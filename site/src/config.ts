/**
 * Product identity and locale configuration, in one place.
 *
 * The site is the directory of the Ethereum Decentralization Index (EDI). EDI,
 * at the root of this repository, is its only assessment authority.
 */
export const PRODUCT = {
  /** Short product name: masthead, titles, social cards. */
  name: 'EDI Directory',
  /** The index this directory belongs to. */
  indexName: 'Ethereum Decentralization Index',
  repository: 'https://github.com/ryanberckmans/ethereum-decentralization-index',
} as const;

/** Every locale the site is structured for, in menu order. */
export const LOCALES = ['en', 'es', 'pt-BR', 'fr', 'de', 'zh-CN', 'ja', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** EDI ships its own translations under shorter keys. */
export const EDI_LOCALE = {
  en: 'en',
  es: 'es',
  'pt-BR': 'pt',
  fr: 'fr',
  de: 'de',
  'zh-CN': 'zh',
  ja: 'ja',
  ko: 'ko',
} as const satisfies Record<Locale, string>;

/** Native names for the language menu. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  fr: 'Français',
  de: 'Deutsch',
  'zh-CN': '简体中文',
  ja: '日本語',
  ko: '한국어',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Bounds on untrusted URL input. */
export const LIMITS = {
  query: 120,
  compare: 4,
  page: 50,
  idLength: 256,
} as const;

export const PAGE_SIZE = 30;
