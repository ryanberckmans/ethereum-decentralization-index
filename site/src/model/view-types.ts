/**
 * Shapes shared by the server and the browser. Everything here is plain,
 * already-localized data: the browser never evaluates EDI and never sees the
 * editorial dataset, only what a page or the directory index carries.
 */
import type {Locale} from '../config.ts';
import type {CollectionId, Measure, Role, SubjectKind} from '../content/vocab.ts';

export type DLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export const D_LEVELS: readonly DLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export type Kind = 'chain' | 'asset' | 'protocol';
export const KINDS: readonly Kind[] = ['asset', 'protocol', 'chain'];
export type Status = 'assessed' | 'partial' | 'unreviewed';

/** What a badge needs: EDI's label, displayed level and localized one-line meaning. */
export interface GradeView {
  /** EDI's label: "D0", "≥ D2" or "D?". */
  label: string;
  status: Status;
  /** The level EDI displays: the complete grade or a positive known floor; null for D?. */
  level: DLevel | null;
  effective: DLevel | null;
  floor: DLevel | null;
  /** EDI's short legend for the displayed level, in the page locale. */
  short: string;
  /** EDI's own description of what remains unresolved (English, from EDI). */
  unresolved: string[];
  reviewedAt?: string;
}

export interface ReviewView {
  permanent: boolean;
  dueAt: string | null;
  overdue: boolean;
}

export interface DatedView {
  mechanism: GradeView;
  /** Present only when EDI reviews positions in this object separately. */
  position?: GradeView;
  review: ReviewView;
  positionReview?: ReviewView;
}

export interface Segment<T> {
  from: string;
  value: T;
}

/** The three ways a badge can read: a complete grade, a known floor, or unknown. */
export type Completeness = 'complete' | 'partial' | 'unknown';
export function completeness(grade: GradeView): Completeness {
  if (grade.status === 'assessed' && grade.effective !== null) return 'complete';
  return grade.level === null ? 'unknown' : 'partial';
}

export function segmentAt<T>(segments: readonly Segment<T>[], date: string): T {
  let current = segments[0].value;
  for (const segment of segments) if (segment.from <= date) current = segment.value;
  return current;
}

/** One editorial figure, formatted for the page language. */
export interface ObservationView {
  id: string;
  metric: string;
  definition: string;
  /** Formatted value with comparator, unit and rate period. */
  value: string;
  /** The exact reported value with grouping, for accessible descriptions. */
  exact: string;
  when: string;
  /** Chain scope in words. */
  chains: string;
  multichain: boolean;
  scope: string;
  measure: Measure;
}

export interface FeaturedObservation {
  metric: string;
  /** Formatted value with comparator and unit. */
  value: string;
  /** Formatted date or interval. */
  when: string;
  /** Chain scope in words when it is not one chain. */
  scope?: string;
}

/** One EDI record in the directory index. */
export interface DirectoryEntry {
  id: string;
  slug: string;
  name: string;
  kind: Kind;
  role?: Role;
  /** Editorial summary; for a basic record, EDI's own scope. */
  summary: string;
  ediSummary: boolean;
  scope: string;
  controls: string[];
  reason: string;
  networks: string[];
  addresses: [chainId: number, address: string][];
  aliases: string[];
  tags: string[];
  stories: string[];
  edited: boolean;
  rank: number;
  reviewedAt: string;
  observation?: FeaturedObservation;
  states: Segment<DatedView>[];
}

export interface StoryEntry {
  id: string;
  slug: string;
  title: string;
  dek: string;
  objects: string[];
  collections: CollectionId[];
  rank: number;
}

export interface SubjectEntry {
  id: string;
  kind: SubjectKind;
  name: string;
  description: string;
  aliases: string[];
  relatedId?: string;
  chainId?: number;
  address?: string;
  outsideEthereum?: boolean;
}

export interface DirectoryIndex {
  version: 1;
  edition: string;
  locale: Locale;
  entries: DirectoryEntry[];
  stories: StoryEntry[];
  subjects: SubjectEntry[];
  /** Network facet choices (EDI chain records), Ethereum first. */
  networks: {id: string; name: string; chainId?: number}[];
  /** Roles in use, in vocabulary order. */
  roles: Role[];
  /** Share of records with an editorial role; the role facet is shown only when most are classified. */
  roleCoverage: number;
  /** Search vocabulary: per idea, words a reader may type (normalized) and the English words records use. */
  vocabulary: SearchConcept[];
  /** Normalized words a search ignores, such as articles, unless they are all the reader typed. */
  stopWords: string[];
}

export interface SearchConcept {
  words: string[];
  english: string[];
}
