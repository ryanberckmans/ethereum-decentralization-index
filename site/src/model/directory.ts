/**
 * Filtering, facets, sorting and paging for the directory. Shared by the
 * server render and the browser island, so a link, a refresh and a live
 * filter change always produce the same list.
 *
 * @cc [label:product] no-grade-promotion-from-missing-data
 * Exact-grade filters match complete assessments only. "Known authority at
 * least Dn" is bound-aware and includes partial floors explicitly. Unknown
 * never sorts or filters as D0, and grade sorts keep partial and unknown
 * records in their own labelled groups.
 */
import {PAGE_SIZE} from '../config.ts';
import type {Role} from '../content/vocab.ts';
import {effectiveSort, NETWORK_NONE, type DirectoryQuery, type ReviewFilter, type Sort} from './query.ts';
import {search, type Hit, type Match, type PreparedIndex} from './search.ts';
import {completeness, D_LEVELS, segmentAt, type DatedView, type DirectoryEntry, type DLevel, type Kind, type StoryEntry, type SubjectEntry} from './view-types.ts';

export interface ObjectHit {
  entry: DirectoryEntry;
  state: DatedView;
  match?: Match;
}

export type GradeGroup = 'complete' | 'partial' | 'unknown';

export interface Facets {
  role: Partial<Record<Role, number>>;
  kind: Partial<Record<Kind, number>>;
  network: Record<string, number>;
  grade: Partial<Record<DLevel, number>>;
  atleast: Partial<Record<DLevel, number>>;
  review: Partial<Record<ReviewFilter, number>>;
  story: number;
}

export interface DirectoryResult {
  sort: Sort;
  total: number;
  page: number;
  pages: number;
  /** The current page of objects. */
  objects: ObjectHit[];
  /** For grade sorts: where each group starts within this page. */
  groups: {group: GradeGroup; index: number}[];
  stories: Hit<StoryEntry>[];
  subjects: Hit<SubjectEntry>[];
  facets: Facets;
}

type Facet = 'role' | 'kind' | 'network' | 'grade' | 'atleast' | 'review' | 'story';

function knownLevel(state: DatedView): DLevel | null {
  return state.mechanism.effective ?? state.mechanism.floor;
}

function reviewMatches(filter: ReviewFilter, state: DatedView): boolean {
  switch (filter) {
    case 'complete':
    case 'partial':
    case 'unknown':
      return completeness(state.mechanism) === filter;
    case 'overdue':
      return state.review.overdue;
    case 'permanent':
      return state.review.permanent;
  }
}

function passes(hit: ObjectHit, query: DirectoryQuery, skip?: Facet): boolean {
  const {entry, state} = hit;
  if (skip !== 'role' && query.role.length && !(entry.role && query.role.includes(entry.role))) return false;
  if (skip !== 'kind' && query.kind.length && !query.kind.includes(entry.kind)) return false;
  if (skip !== 'network' && query.network.length) {
    const networks = entry.networks.length ? entry.networks : [NETWORK_NONE];
    if (!networks.some(network => query.network.includes(network))) return false;
  }
  if (skip !== 'grade' && query.grade.length) {
    if (completeness(state.mechanism) !== 'complete' || !query.grade.includes(state.mechanism.effective!)) return false;
  }
  if (skip !== 'atleast' && query.atleast !== null) {
    const level = knownLevel(state);
    if (level === null || level < query.atleast) return false;
  }
  if (skip !== 'review' && query.review.length && !query.review.some(filter => reviewMatches(filter, state))) return false;
  if (skip !== 'story' && query.story && !entry.stories.length) return false;
  return true;
}

function countFacets(hits: readonly ObjectHit[], query: DirectoryQuery): Facets {
  const facets: Facets = {role: {}, kind: {}, network: {}, grade: {}, atleast: {}, review: {}, story: 0};
  const bump = <K extends string | number>(record: Partial<Record<K, number>>, key: K) => {
    record[key] = (record[key] ?? 0) + 1;
  };
  for (const hit of hits) {
    const {entry, state} = hit;
    if (passes(hit, query, 'role') && entry.role) bump(facets.role, entry.role);
    if (passes(hit, query, 'kind')) bump(facets.kind, entry.kind);
    if (passes(hit, query, 'network')) for (const network of entry.networks.length ? entry.networks : [NETWORK_NONE]) bump(facets.network, network);
    if (passes(hit, query, 'grade') && completeness(state.mechanism) === 'complete') bump(facets.grade, state.mechanism.effective!);
    if (passes(hit, query, 'atleast')) {
      const level = knownLevel(state);
      if (level !== null) for (const threshold of D_LEVELS) if (threshold > 0 && level >= threshold) bump(facets.atleast, threshold);
    }
    if (passes(hit, query, 'review'))
      for (const filter of ['complete', 'partial', 'unknown', 'overdue', 'permanent'] as const) if (reviewMatches(filter, state)) bump(facets.review, filter);
    if (passes(hit, query, 'story') && entry.stories.length) facets.story += 1;
  }
  return facets;
}

function gradeKey(state: DatedView, direction: 1 | -1): [number, number] {
  const group = completeness(state.mechanism);
  if (group === 'complete') return [0, direction * state.mechanism.effective!];
  if (group === 'partial') return [1, direction * state.mechanism.floor!];
  return [2, 0];
}

export function gradeGroup(state: DatedView): GradeGroup {
  return completeness(state.mechanism);
}

function sorter(sort: Sort, collator: Intl.Collator): (a: ObjectHit, b: ObjectHit) => number {
  switch (sort) {
    case 'relevance':
      return (a, b) => a.match!.tier - b.match!.tier || b.match!.score - a.match!.score || a.entry.rank - b.entry.rank;
    case 'editorial':
      return (a, b) => a.entry.rank - b.entry.rank;
    case 'name':
      return (a, b) => collator.compare(a.entry.name, b.entry.name) || a.entry.id.localeCompare(b.entry.id);
    case 'reviewed':
      return (a, b) => b.entry.reviewedAt.localeCompare(a.entry.reviewedAt) || a.entry.rank - b.entry.rank;
    case 'grade-asc':
    case 'grade-desc': {
      const direction = sort === 'grade-asc' ? 1 : -1;
      return (a, b) => {
        const [ga, la] = gradeKey(a.state, direction);
        const [gb, lb] = gradeKey(b.state, direction);
        return ga - gb || la - lb || a.entry.rank - b.entry.rank;
      };
    }
  }
}

/** Run a directory query for the given UTC date. */
export function runDirectory(index: PreparedIndex, query: DirectoryQuery, date: string, locale: string): DirectoryResult {
  const searched = query.q ? search(index, query.q) : null;
  const all: ObjectHit[] = [];
  for (const {item: entry} of index.objects) {
    const match = searched?.objects.get(entry.id);
    if (searched && !match) continue;
    all.push({entry, state: segmentAt(entry.states, date), ...(match ? {match} : {})});
  }
  const facets = countFacets(all, query);
  const filtered = all.filter(hit => passes(hit, query));
  const sort = effectiveSort(query);
  filtered.sort(sorter(sort, new Intl.Collator(locale, {sensitivity: 'base', numeric: true})));

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pages);
  const objects = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const groups: DirectoryResult['groups'] = [];
  if (sort === 'grade-asc' || sort === 'grade-desc') {
    let previous: GradeGroup | undefined;
    objects.forEach((hit, index) => {
      const group = gradeGroup(hit.state);
      if (group !== previous) groups.push({group, index});
      previous = group;
    });
  }
  return {
    sort,
    total,
    page,
    pages,
    objects,
    groups,
    stories: searched ? searched.stories.slice(0, 6) : [],
    subjects: searched ? searched.subjects.slice(0, 8) : [],
    facets,
  };
}
