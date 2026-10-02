/**
 * Addresses and language choice, as pure functions. A static host serves the
 * built files as they are, so the pages that run in the browser apply these:
 * the language-neutral root picks the reader's language, and the not-found
 * page turns an old, mistyped or locale-less address, or a raw EDI ID, into
 * the canonical page when there is one. The tests exercise the same code.
 */
import {DEFAULT_LOCALE, LOCALES, isLocale, type Locale} from '../config.ts';
import {COLLECTION_IDS, defaultObjectSlug, type CollectionId} from '../content/vocab.ts';
import {cleanText} from './query.ts';
import {COLLECTION_BY_SLUG, paths} from './urls.ts';

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

/**
 * The reader's language: a remembered choice wins, then the browser's
 * languages (navigator.languages joined with commas, or an Accept-Language
 * value) by quality and order, then English.
 */
export function negotiateLocale(remembered: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
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

/** Pages every locale has besides the directory, profiles, stories and collections. */
const SECTIONS = ['stories', 'compare', 'methodology', 'changes', 'data'] as const;
/** First segments of the localized pages, so /objects/weth9 can take the reader's language. */
const LOCALIZED = new Set<string>(['objects', 'collections', ...SECTIONS]);

/** The identities a missing address can be matched against, from the directory index. */
export interface KnownPages {
  objects: readonly {id: string; slug: string}[];
  stories: readonly {id: string; slug: string}[];
}

export interface Resolution {
  /** The language of the address, or the reader's when it names none. */
  locale: Locale;
  /** The canonical page the address means, when there is one. */
  path?: string;
}

function decoded(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * The record an EDI ID, a slug, the earlier `--` form, or a capitalized or
 * percent-encoded variant of one names. Names and tickers never match: they
 * are not identities.
 */
export function findObject<T extends {id: string; slug: string}>(value: string, objects: readonly T[]): T | undefined {
  const exact = objects.find(object => object.slug === value || object.id === value);
  if (exact) return exact;
  const key = decoded(value).toLowerCase();
  const id = key.replace(/--/g, ':');
  return (
    objects.find(object => object.slug === key) ??
    objects.find(object => {
      const lower = object.id.toLowerCase();
      return lower === key || lower === id || defaultObjectSlug(lower) === key;
    })
  );
}

/** The locale an address starts with, matched without regard to case. */
export function localeOfPath(pathname: string): Locale | undefined {
  return BY_LOWER.get(decoded(pathname.split('/')[1] ?? '').toLowerCase());
}

/**
 * Where an address the host could not serve should go. Locale casing, a
 * missing trailing slash, an old locale-less path, a raw EDI ID (token:uniswap),
 * the earlier `--` form and a capitalized slug all lead to the canonical page;
 * anything else is missing. `reader` is the reader's language, used when the
 * address names none.
 */
export function resolveMissing(pathname: string, reader: Locale, known: KnownPages): Resolution {
  const segments = pathname.split('/').filter(Boolean).map(decoded);
  const named = segments.length ? BY_LOWER.get(segments[0].toLowerCase()) : undefined;
  const rest = (named ? segments.slice(1) : segments).map(segment => segment.toLowerCase());
  const locale = named ?? reader;
  if (!named && !(rest.length && LOCALIZED.has(rest[0]))) return {locale};
  const [section, slug, ...deeper] = rest;
  if (deeper.length) return {locale};
  if (section === undefined) return {locale, path: paths.home(locale)};
  if (slug === undefined) return (SECTIONS as readonly string[]).includes(section) ? {locale, path: `/${locale}/${section}/`} : {locale};
  switch (section) {
    case 'objects': {
      const object = findObject(slug, known.objects);
      return object ? {locale, path: paths.object(locale, object.slug)} : {locale};
    }
    case 'stories': {
      const story = known.stories.find(s => s.slug === slug) ?? known.stories.find(s => s.id === slug);
      return story ? {locale, path: paths.story(locale, story.slug)} : {locale};
    }
    case 'collections': {
      const id = COLLECTION_BY_SLUG[slug] ?? (COLLECTION_IDS as readonly string[]).find(value => value === slug);
      return id ? {locale, path: paths.collection(locale, id as CollectionId)} : {locale};
    }
    default:
      return {locale};
  }
}

/** Words for a search, from the last part of a missing address (uniswap-v9 → "uniswap v9"). */
export function wordsOfPath(pathname: string, limit: number): string {
  const last = decoded(pathname.split('/').filter(Boolean).at(-1) ?? '');
  const words = cleanText(last.replace(/[-_.:+]+/g, ' ')).slice(0, limit).trim();
  return BY_LOWER.has(words.toLowerCase()) || LOCALIZED.has(words.toLowerCase()) ? '' : words;
}
