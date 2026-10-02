/** Server-side directory helpers: the prepared index and the row context per locale. */
import {LIMITS, type Locale} from '../config.ts';
import {messages} from '../i18n/index.ts';
import type {BodyContext, ResultsMessages} from '../components/ResultsBody.tsx';
import type {DirectoryAppMessages} from '../islands/DirectoryApp.tsx';
import {serializeDirectoryQuery, type DirectoryQuery} from '../model/query.ts';
import {CHAIN_IDS, entity} from '../model/registry.ts';
import {prepareIndex, type PreparedIndex} from '../model/search.ts';
import {paths} from '../model/urls.ts';
import {directoryIndex} from '../model/views.ts';
import type {DirectoryIndex} from '../model/view-types.ts';
import {catalog} from './site.ts';

const prepared = new Map<Locale, PreparedIndex>();

export function indexFor(locale: Locale): DirectoryIndex {
  return directoryIndex(catalog, locale);
}

export function preparedFor(locale: Locale): PreparedIndex {
  let value = prepared.get(locale);
  if (!value) {
    const m = messages(locale);
    const index = indexFor(locale);
    const networkNames = new Map(index.networks.map(network => [network.id, network.name]));
    value = prepareIndex(index, {
      role: role => m.roles[role as keyof typeof m.roles] ?? role,
      kind: kind => m.kinds[kind as keyof typeof m.kinds] ?? kind,
      network: id => networkNames.get(id) ?? id,
      story: id => catalog.story(id)?.data.title ?? id,
      object: id => catalog.object(id)?.name ?? id,
    });
    prepared.set(locale, value);
  }
  return value;
}

/** Names of every network EDI identifies by chain ID, for address matches. */
export const CHAIN_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_IDS).map(([id, chainId]) => [chainId, entity(id)?.name ?? `Chain ${chainId}`]),
);

/** The strings the directory island needs, and nothing else. */
export function directoryMessages(locale: Locale): DirectoryAppMessages {
  const m = messages(locale);
  return {directory: m.directory, grade: m.grade, kinds: m.kinds, roles: m.roles, common: m.common, subjects: m.subjects, edition: m.edition};
}

export function bodyContext(locale: Locale, query: DirectoryQuery, m: ResultsMessages = directoryMessages(locale)): BodyContext {
  const index = indexFor(locale);
  const urlFor = (value: DirectoryQuery) => {
    const search = serializeDirectoryQuery(value);
    return `${paths.home(locale)}${search ? `?${search}` : ''}`;
  };
  return {
    locale,
    m,
    networkNames: Object.fromEntries(index.networks.map(network => [network.id, network.name])),
    chainNames: CHAIN_NAMES,
    objectHref: slug => paths.object(locale, slug),
    storyHref: slug => paths.story(locale, slug),
    pageHref: page => urlFor({...query, page}),
    clearHref: urlFor({...query, q: '', role: [], kind: [], network: [], grade: [], atleast: null, review: [], story: false, page: 1}),
    objectName: id => catalog.object(id)?.name ?? id,
    compare: query.compare,
    compareMax: LIMITS.compare,
  };
}
