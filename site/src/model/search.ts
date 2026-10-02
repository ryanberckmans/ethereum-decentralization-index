/**
 * Local directory search: deterministic, explainable tiers, no hosted service
 * and no per-keystroke network or model calls. Runs identically on the server
 * (for no-JavaScript and first paint) and in the browser.
 *
 * Tiers: 0 exact EDI ID, slug or recorded address; 1 exact name or alias;
 * 2 every word found in names and aliases; 3 every word found somewhere,
 * with the matched context shown. Within a tier, more important fields win,
 * then the editor's order. There is no paid or opaque ranking.
 *
 * @cc [label:product] exact-deployment-identity
 * An address only matches the deployments EDI records for it, each shown
 * with its chain. A ticker or brand match never stands in for an identity.
 */
import {parseAddressQuery} from './address.ts';
import type {DirectoryEntry, DirectoryIndex, StoryEntry, SubjectEntry} from './view-types.ts';

export type FieldKey =
  | 'name'
  | 'alias'
  | 'id'
  | 'tags'
  | 'role'
  | 'summary'
  | 'story'
  | 'kind'
  | 'network'
  | 'scope'
  | 'controls'
  | 'reason'
  | 'title'
  | 'dek'
  | 'objects'
  | 'description';

const WEIGHTS: Record<FieldKey, number> = {
  name: 10,
  title: 10,
  alias: 9,
  id: 8,
  tags: 6,
  role: 5,
  dek: 5,
  summary: 4,
  story: 4,
  objects: 4,
  kind: 3,
  network: 3,
  description: 3,
  scope: 2,
  controls: 2,
  reason: 1,
};
const IDENTITY_FIELDS: ReadonlySet<FieldKey> = new Set(['name', 'alias', 'id', 'title']);

export interface Snippet {
  field: FieldKey;
  text: string;
  /** [start, end) ranges in `text` to highlight. */
  marks: [number, number][];
}

export interface Match {
  tier: 0 | 1 | 2 | 3;
  score: number;
  /** Shown when the match is not in the name: where the words were found. */
  snippet?: Snippet;
  /** For address searches: the chains whose recorded deployment matched. */
  chains?: number[];
}

interface Field {
  key: FieldKey;
  text: string;
  words: string[];
  norm: string;
}

interface Prepared<T> {
  item: T;
  fields: Field[];
  exact: Set<string>;
  identities: Set<string>;
  rank: number;
}

export interface SearchLabels {
  role: (role: string) => string;
  kind: (kind: string) => string;
  network: (id: string) => string;
  story: (id: string) => string;
  object: (id: string) => string;
}

export interface PreparedIndex {
  objects: Prepared<DirectoryEntry>[];
  stories: Prepared<StoryEntry>[];
  subjects: Prepared<SubjectEntry>[];
}

const CJK = /[぀-ヿ㐀-鿿가-힯豈-﫿]/;
const MAX_TOKENS = 12;

/** Lowercase, strip diacritics, and turn punctuation into spaces. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function tokenize(query: string): string[] {
  return [...new Set(normalize(query).split(' ').filter(Boolean))].slice(0, MAX_TOKENS);
}

function field(key: FieldKey, text: string): Field {
  const norm = normalize(text);
  return {key, text, norm, words: norm.split(' ').filter(Boolean)};
}

function tokenMatches(token: string, target: Field): boolean {
  if (CJK.test(token)) return target.norm.includes(token);
  for (const word of target.words) if (word.startsWith(token)) return true;
  // A plain plural also finds its singular: "dollars" finds "dollar".
  if (token.length > 3 && token.endsWith('s')) {
    const singular = token.slice(0, -1);
    for (const word of target.words) if (word.startsWith(singular)) return true;
  }
  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** An excerpt of `target.text` around the first matched token, with each matched token marked. */
function snippetFor(target: Field, tokens: readonly string[]): Snippet {
  const text = target.text;
  const found: [number, number][] = [];
  for (const token of tokens) {
    const pattern = CJK.test(token) ? escapeRegExp(token) : `(?<![\\p{L}\\p{N}])${escapeRegExp(token)}`;
    const match = new RegExp(pattern, 'iu').exec(text);
    if (match) found.push([match.index, match.index + match[0].length]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const LENGTH = 140;
  if (text.length <= LENGTH || !found.length) {
    const cut = text.length <= LENGTH ? text : `${text.slice(0, LENGTH).replace(/\s+\S*$/, '')}…`;
    return {field: target.key, text: cut, marks: found.filter(([, end]) => end <= cut.length)};
  }
  let start = Math.max(0, found[0][0] - 40);
  if (start > 0) {
    const space = text.indexOf(' ', start);
    start = space === -1 || space > found[0][0] ? start : space + 1;
  }
  let end = Math.min(text.length, start + LENGTH);
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > found[0][1]) end = space;
  }
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  const marks = found
    .filter(([a, b]) => a >= start && b <= end)
    .map(([a, b]) => [a - start + prefix.length, b - start + prefix.length] as [number, number]);
  return {field: target.key, text: `${prefix}${text.slice(start, end)}${suffix}`, marks};
}

export function prepareIndex(index: DirectoryIndex, labels: SearchLabels): PreparedIndex {
  const objects = index.entries.map(entry => {
    const fields: Field[] = [
      field('name', entry.name),
      ...entry.aliases.map(alias => field('alias', alias)),
      field('id', entry.id),
      ...entry.tags.map(tag => field('tags', tag)),
      ...(entry.role ? [field('role', `${labels.role(entry.role)} ${entry.role.replace(/-/g, ' ')}`)] : []),
      ...(entry.ediSummary ? [] : [field('summary', entry.summary)]),
      ...entry.stories.map(id => field('story', labels.story(id))),
      field('kind', `${labels.kind(entry.kind)} ${entry.kind}`),
      ...entry.networks.map(id => field('network', labels.network(id))),
      field('scope', entry.scope),
      ...entry.controls.map(control => field('controls', control)),
      field('reason', entry.reason),
    ];
    const exact = new Set([entry.id.toLowerCase(), entry.slug]);
    const identities = new Set([normalize(entry.name), ...entry.aliases.map(normalize)].filter(Boolean));
    return {item: entry, fields, exact, identities, rank: entry.rank};
  });
  const stories = index.stories.map(story => ({
    item: story,
    fields: [field('title', story.title), field('dek', story.dek), ...story.objects.map(id => field('objects', labels.object(id)))],
    exact: new Set([story.id, story.slug]),
    identities: new Set([normalize(story.title)]),
    rank: story.rank,
  }));
  const subjects = index.subjects.map((subject, rank) => ({
    item: subject,
    fields: [field('name', subject.name), ...subject.aliases.map(alias => field('alias', alias)), field('description', subject.description)],
    exact: new Set([subject.id]),
    identities: new Set([normalize(subject.name), ...subject.aliases.map(normalize)].filter(Boolean)),
    rank,
  }));
  return {objects, stories, subjects};
}

function matchPrepared<T>(prepared: Prepared<T>, raw: string, tokens: readonly string[]): Match | null {
  const lowered = raw.trim().toLowerCase();
  if (prepared.exact.has(lowered)) return {tier: 0, score: 100};
  if (!tokens.length) return null;
  const whole = tokens.join(' ');
  if (prepared.identities.has(whole)) return {tier: 1, score: 50};

  let score = 0;
  let identityOnly = true;
  let best: Field | undefined;
  for (const token of tokens) {
    let tokenBest: Field | undefined;
    for (const target of prepared.fields) {
      if (tokenBest && WEIGHTS[target.key] <= WEIGHTS[tokenBest.key]) continue;
      if (tokenMatches(token, target)) tokenBest = target;
    }
    if (!tokenBest) return null;
    score += WEIGHTS[tokenBest.key];
    if (!IDENTITY_FIELDS.has(tokenBest.key)) {
      identityOnly = false;
      if (!best || WEIGHTS[tokenBest.key] > WEIGHTS[best.key]) best = tokenBest;
    }
  }
  if (identityOnly) return {tier: 2, score};
  return {tier: 3, score, snippet: snippetFor(best!, tokens.filter(token => tokenMatches(token, best!)))};
}

export interface Hit<T> {
  item: T;
  match: Match;
  rank: number;
}

function byRelevance<T>(a: Hit<T>, b: Hit<T>): number {
  return a.match.tier - b.match.tier || b.match.score - a.match.score || a.rank - b.rank;
}

export interface SearchResults {
  objects: Map<string, Match>;
  stories: Hit<StoryEntry>[];
  subjects: Hit<SubjectEntry>[];
}

/** Search every group. An address query matches recorded deployments only. */
export function search(index: PreparedIndex, query: string): SearchResults {
  const objects = new Map<string, Match>();
  const address = parseAddressQuery(query);
  if (address) {
    for (const {item} of index.objects) {
      const chains = item.addresses
        .filter(([chainId, value]) => value === address.address && (address.chainId === undefined || chainId === address.chainId))
        .map(([chainId]) => chainId);
      if (chains.length) objects.set(item.id, {tier: 0, score: 100, chains});
    }
    const subjects = index.subjects
      .filter(({item}) => item.address?.toLowerCase() === address.address && (address.chainId === undefined || item.chainId === address.chainId))
      .map(({item, rank}) => ({item, rank, match: {tier: 0, score: 100, ...(item.chainId ? {chains: [item.chainId]} : {})} as Match}));
    return {objects, stories: [], subjects};
  }
  const tokens = tokenize(query);
  for (const prepared of index.objects) {
    const match = matchPrepared(prepared, query, tokens);
    if (match) objects.set(prepared.item.id, match);
  }
  const collect = <T>(list: Prepared<T>[]): Hit<T>[] =>
    list
      .map(prepared => ({item: prepared.item, rank: prepared.rank, match: matchPrepared(prepared, query, tokens)}))
      .filter((hit): hit is Hit<T> => hit.match !== null)
      .sort(byRelevance);
  return {objects, stories: collect(index.stories), subjects: collect(index.subjects)};
}
