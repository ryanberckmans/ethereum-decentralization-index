/**
 * Editorial vocabularies shared by the schema, the server and browser code.
 * No dependencies, so the directory island can use them without bundling zod.
 * Labels live in the UI dictionaries so they can be translated.
 */

/** The default object slug: `:` becomes `--` and `.` becomes `-` (token:uniswap → token--uniswap, seaport-v1.6 → seaport-v1-6). */
export function defaultObjectSlug(ediId: string): string {
  return ediId.replace(/:/g, '--').replace(/\./g, '-').replace(/_/g, '-');
}

export const SUBJECT_KINDS = ['organization', 'product', 'deployment', 'network', 'reference'] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];

/** How far a source supports a statement. Shown as a short evidence label. */
export const EVIDENCE_STATES = [
  'capability', // documented capability: documentation shows it can be done
  'announced', // an announcement or launch statement
  'pilot', // a limited pilot or test
  'live', // live and available, without a usage measurement
  'reported-adoption', // the operator or a participant reports use (first-party numbers)
  'reproduced-observation', // independently reproduced from data
  'forecast', // a projection; never shown as achieved
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/**
 * Economic role of an object, used for browsing and filters. Choose the
 * closest; ask the site owner to add a role rather than overloading one.
 */
export const ROLES = [
  'native-asset',
  'wrapper',
  'dollar-token',
  'fund-shares',
  'commodity-claim',
  'bitcoin-representation',
  'staking',
  'restaking',
  'exchange',
  'lending',
  'settlement',
  'yield',
  'payment-streams',
  'network',
  'bridge',
  'governance-token',
  'infrastructure',
] as const;
export type Role = (typeof ROLES)[number];

/** Editorial relationship types. `edi-dependency` edges come only from EDI and are rejected here. */
export const RELATIONSHIP_TYPES = [
  'settles-on', // from settles on to (an asset or product on a network)
  'issues', // from issues to (an issuer and its asset)
  'interface-to', // from provides an interface to to (an app or product over a mechanism)
  'integrates-with', // from integrates with to
  'collateral-for', // from is used as collateral in to
  'economic-reference', // from economically references to (for example gold or US dollars)
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number] | 'edi-dependency';

export const COLLECTION_IDS = ['d0-in-use', 'global-economy'] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

/**
 * How a story's outcome connects economic activity to Ethereum. The first six
 * are the spec's ways of bringing the global economy into Ethereum.
 */
export const ECONOMIC_MECHANISMS = [
  'distribution', // reaching new users through another product or institution
  'programmable-settlement',
  'asset-mobility', // assets that can now move, settle or trade more broadly
  'collateral',
  'liquidity-access',
  'coordination', // coordination across organizations
  'reusable-infrastructure', // a mechanism other programs build on
] as const;
export const MEASURES = ['stock', 'flow', 'count', 'rate', 'duration'] as const;
export type Measure = (typeof MEASURES)[number];
