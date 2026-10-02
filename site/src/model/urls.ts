/**
 * Route paths. Every page lives under a locale and ends with a slash, the
 * address static hosts give a directory's index.html; exports and agent files
 * are locale-free files.
 */
import type {Locale} from '../config.ts';
import type {CollectionId} from '../content/vocab.ts';

export const COLLECTION_SLUGS: Record<CollectionId, string> = {'d0-in-use': 'd0', 'global-economy': 'global-economy'};
export const COLLECTION_BY_SLUG: Record<string, CollectionId> = {d0: 'd0-in-use', 'global-economy': 'global-economy'};

export const paths = {
  home: (locale: Locale) => `/${locale}/`,
  object: (locale: Locale, slug: string) => `/${locale}/objects/${slug}/`,
  stories: (locale: Locale) => `/${locale}/stories/`,
  story: (locale: Locale, slug: string) => `/${locale}/stories/${slug}/`,
  collection: (locale: Locale, id: CollectionId) => `/${locale}/collections/${COLLECTION_SLUGS[id]}/`,
  compare: (locale: Locale, ids: readonly string[] = []) => `/${locale}/compare/${ids.length ? `?ids=${ids.join(',')}` : ''}`,
  methodology: (locale: Locale) => `/${locale}/methodology/`,
  changes: (locale: Locale) => `/${locale}/changes/`,
  data: (locale: Locale) => `/${locale}/data/`,
  /** Where an address that matches no page is explained in the reader's language. */
  notFound: (locale: Locale, missing?: string) => `/${locale}/not-found/${missing ? `?path=${encodeURIComponent(missing)}` : ''}`,
  /** The compact directory index the directory, compare and not-found pages load. */
  index: (locale: Locale, edition: string) => `/${locale}/directory-index.json?v=${encodeURIComponent(edition)}`,
  /** What the compare page needs besides the index: limits, figures and their comparison fields. */
  compareData: (locale: Locale, edition: string) => `/${locale}/compare-data.json?v=${encodeURIComponent(edition)}`,
};

export const EXPORTS = {
  edition: '/data/v1/edition.json',
  directoryJson: '/data/v1/directory.json',
  directoryCsv: '/data/v1/directory.csv',
  observationsJson: '/data/v1/observations.json',
  observationsCsv: '/data/v1/observations.csv',
  claimsJson: '/data/v1/claims.json',
  relationshipsJson: '/data/v1/relationships.json',
  storiesJson: '/data/v1/stories.json',
  object: (slug: string) => `/data/v1/objects/${slug}.json`,
} as const;

/** Locale-free files for crawlers and agents. */
export const AGENT_FILES = {
  llms: '/llms.txt',
  agents: '/agents.md',
  sitemap: '/sitemap.xml',
  robots: '/robots.txt',
} as const;

/** The same page in another locale: swap the first path segment. */
export function localizedPath(path: string, locale: Locale): string {
  return path.replace(/^\/[^/]+(\/|$)/, `/${locale}$1`);
}

/** Block explorers for the chains EDI records deployments on. Links only; the site fetches nothing from them. */
const EXPLORERS: Readonly<Record<number, string>> = {
  1: 'https://eth.blockscout.com',
  10: 'https://optimism.blockscout.com',
  8453: 'https://base.blockscout.com',
};

export function explorerAddressUrl(chainId: number, address: string): string | undefined {
  const base = EXPLORERS[chainId];
  return base ? `${base}/address/${address}` : undefined;
}

/** Sourcify's public file listing for a verified contract. */
export function sourcifyUrl(chainId: number, address: string): string {
  return `https://repo.sourcify.dev/${chainId}/${address}`;
}
