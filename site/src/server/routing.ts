/**
 * URL normalization and language choice, as pure functions the middleware
 * applies and the tests exercise. Only the bare root and locale-less page
 * paths depend on the reader's language; everything else redirects the same
 * way for everyone.
 */
import {DEFAULT_LOCALE, LOCALES, isLocale, type Locale} from '../config.ts';

/** First path segments of pages that live under a locale. */
const LOCALIZED = new Set(['objects', 'stories', 'collections', 'compare', 'methodology', 'changes', 'data']);
const BY_LOWER = new Map(LOCALES.map(locale => [locale.toLowerCase(), locale]));
/** Traditional Chinese readers are not sent to the Simplified Chinese interface. */
const TRADITIONAL = /^zh-(tw|hk|mo|hant)/i;

/** The supported locale for one BCP 47 tag, if any. */
export function localeForTag(tag: string): Locale | undefined {
  const lower = tag.trim().toLowerCase();
  if (!lower || lower === '*') return undefined;
  const exact = BY_LOWER.get(lower);
  if (exact) return exact;
  if (TRADITIONAL.test(lower)) return undefined;
  const primary = lower.split('-')[0];
  if (primary === 'pt') return 'pt-BR';
  if (primary === 'zh') return 'zh-CN';
  return LOCALES.find(locale => locale.toLowerCase() === primary);
}

/** Accept-Language, by quality then order; a remembered choice (the edi-lang cookie) wins. */
export function negotiateLocale(remembered: string | undefined, acceptLanguage: string | null): Locale {
  if (remembered && isLocale(remembered)) return remembered;
  const ranges = (acceptLanguage ?? '')
    .slice(0, 512)
    .split(',')
    .slice(0, 24)
    .map((part, index) => {
      const [tag, ...params] = part.split(';');
      const q = params.map(param => /^\s*q=([01](?:\.\d{0,3})?)\s*$/.exec(param)?.[1]).find(Boolean);
      return {tag: tag.trim(), q: q === undefined ? 1 : Number(q), index};
    })
    .filter(range => range.tag && range.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const range of ranges) {
    const locale = localeForTag(range.tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

export interface Redirect {
  location: string;
  status: 301 | 302;
  /** True when the target depends on the reader's language. */
  negotiated: boolean;
}

/**
 * Where a request should go instead, or null to serve it. Locale casing,
 * trailing slashes and old locale-less paths are fixed; the root and
 * locale-less paths go to the reader's language.
 */
export function routeRedirect(url: URL, locale: () => Locale): Redirect | null {
  const {pathname, search} = url;
  const segments = pathname.split('/');
  const first = segments[1] ?? '';
  if (pathname === '/') return {location: `/${locale()}/${search}`, status: 302, negotiated: true};

  const canonicalLocale = BY_LOWER.get(first.toLowerCase());
  if (canonicalLocale) {
    let path = `/${canonicalLocale}${pathname.slice(first.length + 1)}`;
    if (path === `/${canonicalLocale}`) path += '/';
    else if (path.length > canonicalLocale.length + 2 && path.endsWith('/')) path = path.replace(/\/+$/, '');
    return path === pathname ? null : {location: `${path}${search}`, status: 301, negotiated: false};
  }

  // /data/v1/... are the exports; only the bare /data is the data page.
  const exportPath = first === 'data' && segments.length > 2 && segments[2] !== '';
  if (LOCALIZED.has(first) && !exportPath) {
    const rest = pathname.replace(/\/+$/, '');
    return {location: `/${locale()}${rest}${search}`, status: 302, negotiated: true};
  }
  return null;
}
