/**
 * Directory state in the URL: query, filters, sort, page and the comparison
 * selection. Parsing is total: malformed or oversized input never throws, it
 * is dropped and named so the page can say what was ignored.
 *
 * @cc [label:product] restoration-without-side-effects
 * Restoring a URL only reconstructs reading state (query, filters, sort, page,
 * selection). It never triggers a network action beyond loading the page and
 * its same-origin index, and an intentional URL wins over saved preferences.
 */
import {LIMITS} from '../config.ts';
import {ROLES, type Role} from '../content/vocab.ts';
import {D_LEVELS, KINDS, type DLevel, type Kind} from './view-types.ts';

export const SORTS = ['relevance', 'editorial', 'name', 'reviewed', 'grade-asc', 'grade-desc'] as const;
export type Sort = (typeof SORTS)[number];
export const REVIEW_FILTERS = ['complete', 'partial', 'unknown', 'overdue', 'permanent'] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];
/** The network facet value for records where EDI records no network. */
export const NETWORK_NONE = 'none';

export interface DirectoryQuery {
  q: string;
  role: Role[];
  kind: Kind[];
  network: string[];
  /** Exact complete grades. */
  grade: DLevel[];
  /** Known authority at least this level, including partial floors. */
  atleast: DLevel | null;
  review: ReviewFilter[];
  story: boolean;
  /** null means the default: best match with a query, the editor's order without. */
  sort: Sort | null;
  page: number;
  compare: string[];
}

export const EMPTY_QUERY: DirectoryQuery = {
  q: '',
  role: [],
  kind: [],
  network: [],
  grade: [],
  atleast: null,
  review: [],
  story: false,
  sort: null,
  page: 1,
  compare: [],
};

export const QUERY_PARAMS = ['q', 'role', 'kind', 'network', 'grade', 'atleast', 'review', 'story', 'sort', 'page', 'compare'] as const;
export type QueryParam = (typeof QUERY_PARAMS)[number];

export interface QueryValidators {
  network(id: string): boolean;
  object(id: string): boolean;
}

/** The order used when none is chosen: best match with a query, the editor's order without. */
export function defaultSort(query: Pick<DirectoryQuery, 'q'>): Sort {
  return query.q ? 'relevance' : 'editorial';
}

export function effectiveSort(query: Pick<DirectoryQuery, 'q' | 'sort'>): Sort {
  if (query.sort && !(query.sort === 'relevance' && !query.q)) return query.sort;
  return defaultSort(query);
}

/** Whether any filter (not the query, sort or page) is set. */
export function filterCount(query: DirectoryQuery): number {
  return (
    query.role.length +
    query.kind.length +
    query.network.length +
    query.grade.length +
    (query.atleast === null ? 0 : 1) +
    query.review.length +
    (query.story ? 1 : 0)
  );
}

export function cleanText(value: string): string {
  // Control characters, bidi overrides and surrounding space never belong in a query.
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
}

function levelOf(value: string): DLevel | null {
  const match = /^d?(\d)$/i.exec(value.trim());
  return match ? (Number(match[1]) as DLevel) : null;
}

const MAX_QUERY_STRING = 2048;

export function parseDirectoryQuery(params: URLSearchParams, validators: QueryValidators): {query: DirectoryQuery; invalid: QueryParam[]} {
  const invalid = new Set<QueryParam>();
  const query: DirectoryQuery = {...EMPTY_QUERY, role: [], kind: [], network: [], grade: [], review: [], compare: []};
  const total = [...params].reduce((sum, [key, value]) => sum + key.length + value.length + 2, 0);
  if (total > MAX_QUERY_STRING) return {query, invalid: QUERY_PARAMS.filter(key => params.has(key))};

  const list = (key: QueryParam): string[] => {
    const values = params
      .getAll(key)
      .flatMap(value => value.split(','))
      .map(value => value.trim())
      .filter(Boolean);
    return [...new Set(values)];
  };
  const one = (key: QueryParam): string | null => {
    const values = params.getAll(key).filter(value => value.trim() !== '');
    if (values.length > 1) invalid.add(key);
    return values.length ? values[values.length - 1].trim() : null;
  };

  const q = params.getAll('q').join(' ');
  query.q = cleanText(q);
  if (query.q.length > LIMITS.query) {
    query.q = query.q.slice(0, LIMITS.query).trim();
    invalid.add('q');
  }

  for (const value of list('role')) {
    if ((ROLES as readonly string[]).includes(value)) query.role.push(value as Role);
    else invalid.add('role');
  }
  for (const value of list('kind')) {
    if ((KINDS as readonly string[]).includes(value)) query.kind.push(value as Kind);
    else invalid.add('kind');
  }
  for (const value of list('network')) {
    if (value === NETWORK_NONE || validators.network(value)) query.network.push(value);
    else invalid.add('network');
  }
  for (const value of list('grade')) {
    const level = levelOf(value);
    if (level === null) invalid.add('grade');
    else if (!query.grade.includes(level)) query.grade.push(level);
  }
  const atleast = one('atleast');
  if (atleast !== null) {
    const level = levelOf(atleast);
    if (level === null || level === 0) invalid.add('atleast');
    else query.atleast = level;
  }
  for (const value of list('review')) {
    if ((REVIEW_FILTERS as readonly string[]).includes(value)) query.review.push(value as ReviewFilter);
    else invalid.add('review');
  }
  const story = one('story');
  if (story !== null) {
    if (['1', 'true', 'yes', 'on'].includes(story)) query.story = true;
    else if (!['0', 'false', 'no', 'off'].includes(story)) invalid.add('story');
  }
  const sort = one('sort');
  if (sort !== null) {
    if ((SORTS as readonly string[]).includes(sort)) query.sort = sort as Sort;
    else invalid.add('sort');
  }
  const page = one('page');
  if (page !== null) {
    const number = /^\d{1,4}$/.test(page) ? Number(page) : NaN;
    if (Number.isInteger(number) && number >= 1 && number <= LIMITS.page) query.page = number;
    else invalid.add('page');
  }
  for (const value of list('compare')) {
    if (value.length > LIMITS.idLength || !validators.object(value)) invalid.add('compare');
    else if (query.compare.length >= LIMITS.compare) invalid.add('compare');
    else query.compare.push(value);
  }
  return {query, invalid: QUERY_PARAMS.filter(key => invalid.has(key))};
}

/** Query-string value encoding that keeps commas and colons readable. */
export function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/%2C/gi, ',').replace(/%3A/gi, ':').replace(/%20/g, '+');
}

/**
 * The canonical query string (without `?`): fixed key order, vocabulary order
 * within each list, defaults omitted. Two equivalent states give the same string.
 */
export function serializeDirectoryQuery(query: DirectoryQuery): string {
  const parts: string[] = [];
  const add = (key: QueryParam, values: readonly string[]) => {
    if (values.length) parts.push(`${key}=${values.map(encodeValue).join(',')}`);
  };
  if (query.q) parts.push(`q=${encodeValue(query.q)}`);
  add('role', ROLES.filter(role => query.role.includes(role)));
  add('kind', KINDS.filter(kind => query.kind.includes(kind)));
  add('network', [...query.network].sort((a, b) => (a === NETWORK_NONE ? 1 : b === NETWORK_NONE ? -1 : a.localeCompare(b))));
  add('grade', D_LEVELS.filter(level => query.grade.includes(level)).map(level => `d${level}`));
  if (query.atleast !== null) add('atleast', [`d${query.atleast}`]);
  add('review', REVIEW_FILTERS.filter(review => query.review.includes(review)));
  if (query.story) add('story', ['1']);
  const sort = effectiveSort(query);
  if (sort !== defaultSort(query)) add('sort', [sort]);
  if (query.page > 1) add('page', [String(query.page)]);
  add('compare', query.compare);
  return parts.join('&');
}

export function sameQuery(a: DirectoryQuery, b: DirectoryQuery): boolean {
  return serializeDirectoryQuery(a) === serializeDirectoryQuery(b);
}

/** A query with one list value toggled; the page resets because the result set changes. */
export function toggled<K extends 'role' | 'kind' | 'network' | 'grade' | 'review'>(
  query: DirectoryQuery,
  key: K,
  value: DirectoryQuery[K][number],
): DirectoryQuery {
  const current = query[key] as readonly unknown[];
  const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
  return {...query, [key]: next, page: 1};
}
