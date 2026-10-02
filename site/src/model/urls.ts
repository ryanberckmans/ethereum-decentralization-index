/** Route paths. Every page lives under a locale; exports and agent files are locale-free. */
import type {Locale} from '../config.ts';
import type {CollectionId} from '../content/vocab.ts';

export const COLLECTION_SLUGS: Record<CollectionId, string> = {'d0-in-use': 'd0', 'global-economy': 'global-economy'};
export const COLLECTION_BY_SLUG: Record<string, CollectionId> = {d0: 'd0-in-use', 'global-economy': 'global-economy'};

export const paths = {
  home: (locale: Locale) => `/${locale}/`,
  object: (locale: Locale, slug: string) => `/${locale}/objects/${slug}`,
  stories: (locale: Locale) => `/${locale}/stories`,
  story: (locale: Locale, slug: string) => `/${locale}/stories/${slug}`,
  collection: (locale: Locale, id: CollectionId) => `/${locale}/collections/${COLLECTION_SLUGS[id]}`,
  compare: (locale: Locale, ids: readonly string[] = []) => `/${locale}/compare${ids.length ? `?ids=${ids.join(',')}` : ''}`,
  methodology: (locale: Locale) => `/${locale}/methodology`,
  changes: (locale: Locale) => `/${locale}/changes`,
  data: (locale: Locale) => `/${locale}/data`,
  index: (locale: Locale, edition: string) => `/${locale}/directory-index.json?v=${encodeURIComponent(edition)}`,
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

/** The same page in another locale: swap the first path segment. */
export function localizedPath(path: string, locale: Locale): string {
  return path.replace(/^\/[^/]+(\/|$)/, `/${locale}$1`);
}
