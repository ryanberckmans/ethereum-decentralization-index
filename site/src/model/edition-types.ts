/** Serializable shapes passed from the build-time importer to the Worker. Types only. */
import type {Assessment} from 'ethereum-decentralization-index';
import type {Block, Section, TokenRef} from '../content/markdown.ts';
import type {
  ChangeEntry,
  Collection,
  ContextSubject,
  ObjectEditorial,
  Observation,
  Redirects,
  Relationship,
  SourceClaim,
  Story,
} from '../content/schema.ts';

export interface MarkdownBody {
  intro: Block[];
  sections: Section[];
  tokens: TokenRef[];
}

export interface EditionInfo {
  /** Public export schema version. */
  schemaVersion: 1;
  /** `<EDI registry date>.<first 8 hex of the editorial revision>`. */
  id: string;
  /** The repository commit this edition was built from; it pins EDI, which lives in the same repository. */
  ediCommit: string;
  /** True when the build saw uncommitted changes to EDI data or editorial content. */
  ediCommitDirty: boolean;
  ediRegistrySha256: string;
  ediRegistryDate: string;
  ediPolicyDate: string;
  ediRubricVersion: string;
  /** SHA-256 over the editorial content files. */
  editorialRevision: string;
  /** When the edition was built (ISO timestamp). */
  builtAt: string;
  /** Latest date covered by any editorial observation. */
  observedThrough?: string;
}

export interface ContentData {
  objects: {file: string; data: ObjectEditorial; body: MarkdownBody}[];
  stories: {file: string; data: Story; body: MarkdownBody}[];
  claims: SourceClaim[];
  observations: Observation[];
  relationships: Relationship[];
  subjects: ContextSubject[];
  collections: Collection[];
  changes: ChangeEntry[];
  redirects: Redirects;
  methodology: MarkdownBody | null;
}

export interface ReviewState {
  permanent: boolean;
  dueAt: string | null;
  overdue: boolean;
}

/** One record's EDI result on one date, exactly as EDI returned it. */
export interface RawState {
  mechanism: Assessment;
  /** Only for records with an EDI position review; otherwise positions are not assessed. */
  position?: Assessment;
  review: ReviewState;
  positionReview?: ReviewState;
}

export interface Segment<T> {
  /** First UTC date this value applies to. */
  from: string;
  value: T;
}

export interface AssessmentTimelines {
  /** EDI cannot be evaluated before this date; earlier dates use it. */
  registryDate: string;
  /** Every date on which some result can change. */
  changeDates: string[];
  /** EDI's results per record, from the registry date onward. */
  records: Record<string, Segment<RawState>[]>;
}

export interface EditionBundle {
  edition: EditionInfo;
  content: ContentData;
  assessments: AssessmentTimelines;
}
