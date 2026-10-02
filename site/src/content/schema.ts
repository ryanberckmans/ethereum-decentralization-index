/**
 * Editorial content schema for the directory.
 *
 * EDI (the repository root) is the only assessment authority. Editorial records
 * describe, connect and cite; they never carry a grade, floor, status, control
 * dependency or review date of their own. Grades are derived at render time
 * with EDI's date-aware functions. Unknown keys are rejected, so a `grade:` or
 * `tier:` field in frontmatter fails validation instead of being ignored.
 *
 * File layout under site/content/ (all English; translations come later as
 * overlays under site/content/i18n/<locale>/, see docs/content-schema.md):
 *
 *   objects/<slug>.md      ObjectEditorial frontmatter + profile sections
 *   stories/<slug>.md      Story frontmatter + the five story sections
 *   claims.yaml            SourceClaim[]
 *   observations.yaml      Observation[]
 *   relationships.yaml     Relationship[]
 *   subjects.yaml          ContextSubject[] (organizations, products, deployments,
 *                          networks and economic references outside EDI)
 *   collections.yaml       Collection[] (exactly the two collection IDs)
 *   methodology.md         Methodology sections
 *   changes.yaml           ChangeEntry[]
 *   redirects.yaml         Redirects (old slugs that must keep working)
 *
 * Markdown bodies may use these tokens; every token is validated:
 *   {{object:weth9}}             link to an EDI object, labelled with its EDI name
 *   {{grade:uniswap-v4}}         the live EDI mechanism badge for that object
 *   {{grade:uniswap-v4:position}} the live position-scope badge
 *   {{subject:org:opensea}}      a contextual subject (never graded)
 *   {{claim:opensea-weth-offers}} citation marker with the claim's evidence state
 *   {{obs:v2-flash-swaps-2020}}  the observation's value, unit and date
 * Raw HTML is not allowed in Markdown. Links must be https:// or a token.
 */
import {z} from 'zod';

// ---------------------------------------------------------------------------
// Primitives

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
/** A real calendar date, YYYY-MM-DD, interpreted in UTC. Quote it in YAML if your editor reformats dates. */
export const IsoDate = z.string().refine(isIsoDate, 'Use a real calendar date in YYYY-MM-DD form');

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Editorial record IDs: lowercase kebab-case, at most 80 characters. */
export const RecordId = z.string().max(80).regex(KEBAB, 'Use lowercase kebab-case (a-z, 0-9, single hyphens)');
/** URL slugs: kebab-case; a double hyphen stands for the `:` in EDI IDs such as token:uniswap. */
export const SLUG = /^[a-z0-9]+(?:-{1,2}[a-z0-9]+)*$/;
export const Slug = z.string().max(120).regex(SLUG, 'Use lowercase kebab-case');

/** The default object slug: `:` becomes `--` and `.` becomes `-` (token:uniswap → token--uniswap, seaport-v1.6 → seaport-v1-6). */
export function defaultObjectSlug(ediId: string): string {
  return ediId.replace(/:/g, '--').replace(/\./g, '-').replace(/_/g, '-');
}

/** An EDI registry ID exactly as it appears in data/control-registry.json (for example `token:uniswap`, `seaport-v1.6`). */
export const EdiId = z.string().min(1).max(256).regex(/^[a-z0-9][a-z0-9:._-]{0,255}$/, 'Not an EDI registry ID');

export const SUBJECT_KINDS = ['organization', 'product', 'deployment', 'network', 'reference'] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];
/** ID prefix for each contextual subject kind. Contextual subjects are never graded. */
export const SUBJECT_PREFIX: Record<SubjectKind, string> = {
  organization: 'org:',
  product: 'product:',
  deployment: 'deployment:',
  network: 'network:',
  reference: 'ref:',
};
/** `org:circle`, `deployment:morpho-blue-base`, `network:solana`, `ref:gold`, `product:coinbase-crypto-backed-loans`. */
export const ContextSubjectId = z.string().max(96).regex(/^(org|product|deployment|network|ref):[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a contextual ID such as org:circle');
/** Anything a claim, observation or relationship can be about: an EDI object or a contextual subject. */
export const SubjectId = z.union([ContextSubjectId, EdiId]);

/** Absolute https URL without credentials, IP-literal hosts or local names. */
export function isSafeHttpsUrl(value: string): boolean {
  if (value.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal') || host === 'localhost') return false;
  if (/^[\d.]+$/.test(host) || host.startsWith('[')) return false;
  return true;
}
export const HttpsUrl = z.string().refine(isSafeHttpsUrl, 'Use an absolute https:// URL with a public host name and no credentials');

/** Exact decimal string: no exponent, no thousands separators, no units. Absence is not zero: omit the observation instead. */
export const Decimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Use an exact decimal string such as "4800000000" or "2.17"');
export const ChainId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const Address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Use a 0x-prefixed 20-byte address');

/** Plain-language text: trimmed, no raw HTML. */
const text = (max: number) =>
  z.string().trim().min(1).max(max).refine(value => !/<[a-zA-Z/!?]/.test(value), 'Raw HTML is not allowed');

// ---------------------------------------------------------------------------
// Vocabularies (labels live in the UI dictionaries so they can be translated)

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
export const EvidenceStateSchema = z.enum(EVIDENCE_STATES);

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

// ---------------------------------------------------------------------------
// Records

export const OfficialLink = z.strictObject({
  label: text(80),
  url: HttpsUrl,
  /** When an editor last confirmed the destination. */
  checkedAt: IsoDate,
});

/**
 * Frontmatter of objects/<slug>.md. One file per EDI object at most. A file
 * is optional: every EDI record is listed as a basic record without one.
 *
 * `basic-record` files may add search aids (role, summary, tags, aliases,
 * links) without a profile. `edited-profile` files require the opening fields
 * and a `## What it enables` section.
 */
export const ObjectEditorialSchema = z
  .strictObject({
    ediId: EdiId,
    /** Defaults to the EDI ID with `:` as `--` and `.` as `-`. Changing a published slug requires a redirect. */
    slug: Slug.optional(),
    contentStatus: z.enum(['basic-record', 'edited-profile']),
    role: z.enum(ROLES).optional(),
    /** One sentence: what this object is for, in plain words. Used in rows, cards and meta descriptions. */
    summary: text(240).optional(),
    /** Opening: the achievement or useful capability worth understanding (1-3 sentences). */
    capability: text(600).optional(),
    /** Opening: the retained authority in plain words (1-2 sentences). Never a D grade; EDI supplies that. */
    authority: text(400).optional(),
    /** Economic tasks and sectors people search for: "dollar settlement", "NFT offers". */
    economicTags: z.array(text(48)).max(16).default([]),
    /** Curated search aliases such as "wrapped ether". Aliases never establish identity. */
    aliases: z.array(text(64)).max(16).default([]),
    officialLinks: z.array(OfficialLink).max(8).default([]),
    /** The one observation shown in compact directory rows. Must be about this object. */
    featuredObservationId: RecordId.optional(),
    /** Editorial review date of this profile (the third clock; not the EDI review date). */
    editorialReviewedAt: IsoDate,
  })
  .superRefine((value, ctx) => {
    if (value.contentStatus !== 'edited-profile') return;
    for (const key of ['role', 'summary', 'capability', 'authority'] as const)
      if (value[key] === undefined) ctx.addIssue({code: 'custom', path: [key], message: `An edited profile needs ${key}`});
  });
export type ObjectEditorial = z.infer<typeof ObjectEditorialSchema>;

/** Section headings recognised in objects/<slug>.md bodies (H2, exact text). */
export const OBJECT_SECTIONS = {
  enables: 'What it enables', // required for edited profiles
  observed: 'Observed use', // optional narrative introducing the observations
  control: 'Control in context', // optional: core rules vs issuance vs chain vs custody, in plain words
} as const;

/** Frontmatter of stories/<slug>.md. */
export const StorySchema = z.strictObject({
  id: RecordId,
  /** Defaults to `id`. */
  slug: Slug.optional(),
  title: text(120),
  /** One-sentence standfirst shown under the title and on cards. */
  dek: text(240),
  /** The specific claim the story makes, one sentence. */
  thesis: text(300),
  /** EDI objects the story is about. Their live grades are shown. */
  objectIds: z.array(EdiId).min(1).max(12),
  /** Organizations, products, deployments or networks outside EDI. Shown without grades. */
  contextualSubjectIds: z.array(ContextSubjectId).max(12).default([]),
  collections: z.array(z.enum(COLLECTION_IDS)).min(1).max(2),
  /** The one clear economic outcome and how well it is evidenced. */
  outcome: z.strictObject({
    mechanism: z.enum(ECONOMIC_MECHANISMS),
    state: EvidenceStateSchema,
    statement: text(300),
  }),
  /** What Ethereum contributes, in one or two sentences. */
  ethereumContribution: text(400),
  /** The relevant control boundary, in one or two sentences, without D grades. */
  controlBoundary: text(400),
  claimIds: z.array(RecordId).min(1).max(40),
  observationIds: z.array(RecordId).max(20).default([]),
  relationshipIds: z.array(RecordId).max(20).default([]),
  /** Editorial review date. */
  reviewedAt: IsoDate,
});
export type Story = z.infer<typeof StorySchema>;

/** The five H2 sections every story body has, in this order. */
export const STORY_SECTIONS = {
  before: 'Before', // the prior limitation
  mechanism: 'The mechanism',
  evidence: 'Evidence of use',
  possible: 'What becomes possible',
  controlled: 'What remains controlled',
} as const;

/** claims.yaml: what a specific source supports. */
export const SourceClaimSchema = z
  .strictObject({
    id: RecordId,
    /** What the source supports, stated narrowly, one or two sentences. */
    statement: text(500),
    sourceUrl: HttpsUrl,
    publisher: text(80),
    title: text(200).optional(),
    /** When the source was published, if stated. */
    sourcePublishedAt: IsoDate.optional(),
    /** The date the reported fact refers to, if different from publication. */
    observedAt: IsoDate.optional(),
    /** When an editor read the source. */
    retrievedAt: IsoDate,
    state: EvidenceStateSchema,
    /** EDI IDs or contextual IDs this claim is about. */
    subjects: z.array(SubjectId).min(1).max(12),
    /** Section, heading or short quote that locates the support. */
    locator: text(200).optional(),
    /** The scope limit a reader needs, e.g. "Run rate across nine chains; not Ethereum-only." */
    qualification: text(300).optional(),
  })
  .refine(value => !value.sourcePublishedAt || value.sourcePublishedAt <= value.retrievedAt, {
    message: 'A source cannot be published after it was retrieved',
    path: ['sourcePublishedAt'],
  });
export type SourceClaim = z.infer<typeof SourceClaimSchema>;

/** observations.yaml: one dated number with its unit, scope and source. */
export const ObservationSchema = z
  .strictObject({
    id: RecordId,
    subjectId: SubjectId,
    /** Short metric label, e.g. "Flash-swap volume". */
    metric: text(80),
    /** What exactly was counted, e.g. "Cumulative notional value of v2 flash swaps reported by Uniswap Labs". */
    metricDefinition: text(300),
    value: Decimal,
    /** How the source qualifies the number. Omit when it is stated exactly. */
    comparator: z.enum(['more-than', 'at-least', 'about']).optional(),
    /** Currency or unit code: USD, USDC, ETH, transactions, addresses, days. */
    unit: text(24),
    /** Required for flows; the period the flow covers. */
    interval: z.strictObject({start: IsoDate, end: IsoDate}).optional(),
    /** Required for stocks; the date the stock was observed. */
    asOf: IsoDate.optional(),
    /** Chains the number covers. A multichain total that the source does not split is `multichain-unsplit`. */
    chainIds: z.union([z.array(ChainId).min(1).max(32), z.literal('multichain-unsplit'), z.literal('not-applicable')]),
    deploymentAddresses: z.array(z.strictObject({chainId: ChainId, address: Address})).max(32).optional(),
    /** Entity and chain scope in words: whose activity, where. */
    scope: text(300),
    sourceClaimIds: z.array(RecordId).min(1).max(8),
    measure: z.enum(MEASURES),
    /** Observations are compared only within one comparison group with the same unit and time basis. */
    comparisonGroup: RecordId.optional(),
    /** For rates only: the period the rate is expressed over, e.g. an annualized run rate is `year`. */
    ratePeriod: z.enum(['day', 'week', 'month', 'year']).optional(),
    derivation: z
      .strictObject({method: text(300), inputObservationIds: z.array(RecordId).min(1).max(16)})
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.interval && value.interval.start > value.interval.end)
      ctx.addIssue({code: 'custom', path: ['interval'], message: 'Interval start is after its end'});
    if (value.measure === 'stock' && (!value.asOf || value.interval))
      ctx.addIssue({code: 'custom', path: ['asOf'], message: 'A stock needs asOf and no interval'});
    if (value.measure === 'flow' && !value.interval)
      ctx.addIssue({code: 'custom', path: ['interval'], message: 'A flow needs the interval it covers'});
    if ((value.measure === 'count' || value.measure === 'rate' || value.measure === 'duration') && !value.asOf && !value.interval)
      ctx.addIssue({code: 'custom', path: ['asOf'], message: 'Give asOf or an interval'});
    if (value.measure === 'rate' && !value.ratePeriod)
      ctx.addIssue({code: 'custom', path: ['ratePeriod'], message: 'A rate needs ratePeriod (day, week, month or year)'});
    if (value.measure !== 'rate' && value.ratePeriod)
      ctx.addIssue({code: 'custom', path: ['ratePeriod'], message: 'Only a rate has a ratePeriod'});
  });
export type Observation = z.infer<typeof ObservationSchema>;

/** relationships.yaml: a typed, sourced, directed editorial connection. Never a control dependency. */
export const RelationshipSchema = z
  .strictObject({
    id: RecordId,
    from: SubjectId,
    to: SubjectId,
    type: z.enum(RELATIONSHIP_TYPES),
    state: EvidenceStateSchema,
    sourceClaimIds: z.array(RecordId).min(1).max(8),
    chainIds: z.array(ChainId).max(32).optional(),
    validFrom: IsoDate.optional(),
    validTo: IsoDate.optional(),
    /** Optional short explanation shown with the edge, e.g. "WETH-funded collection offers". */
    note: text(160).optional(),
  })
  .refine(value => value.from !== value.to, {message: 'A relationship needs two different subjects', path: ['to']})
  .refine(value => !value.validFrom || !value.validTo || value.validFrom <= value.validTo, {
    message: 'validFrom is after validTo',
    path: ['validTo'],
  });
export type Relationship = z.infer<typeof RelationshipSchema>;

/** subjects.yaml: identities outside EDI. They are listed and searchable but visibly lack EDI coverage. */
export const ContextSubjectSchema = z
  .strictObject({
    id: ContextSubjectId,
    kind: z.enum(SUBJECT_KINDS),
    name: text(80),
    description: text(240),
    officialUrl: HttpsUrl.optional(),
    aliases: z.array(text(64)).max(12).default([]),
    /** For deployments: where it lives. */
    chainId: ChainId.optional(),
    address: Address.optional(),
    /** For a deployment or product related to an EDI record it does NOT inherit, e.g. Morpho on Base → morpho-blue. */
    relatedEdiId: EdiId.optional(),
    /**
     * Required for networks: how the network relates to Ethereum. `ethereum-settled` needs a
     * verified settlement path, not EVM compatibility; activity on an `outside-ethereum` network
     * is shown only as scoped context, never as Ethereum activity.
     */
    ethereumRelation: z.enum(['ethereum-settled', 'outside-ethereum']).optional(),
  })
  .refine(value => value.id.startsWith(SUBJECT_PREFIX[value.kind]), {
    message: 'The ID prefix must match the kind (org:, product:, deployment:, network:, ref:)',
    path: ['id'],
  })
  .refine(value => (value.kind === 'network') === (value.ethereumRelation !== undefined), {
    message: 'Networks need ethereumRelation (ethereum-settled or outside-ethereum); other kinds must omit it',
    path: ['ethereumRelation'],
  });
export type ContextSubject = z.infer<typeof ContextSubjectSchema>;

/** collections.yaml: exactly the two collections. */
export const CollectionSchema = z.strictObject({
  id: z.enum(COLLECTION_IDS),
  title: text(80),
  dek: text(240),
  /** Markdown introduction on the collection page. */
  intro: text(2000),
  /** The home-page entrance: one real example. */
  entrance: z.strictObject({storyId: RecordId, line: text(200)}),
  /** Stories in curated order. */
  storyIds: z.array(RecordId).max(24),
  /** Objects featured beyond those derived from EDI (global-economy only; d0 lists complete D0 mechanisms from EDI). */
  objectIds: z.array(EdiId).max(48).default([]),
});
export type Collection = z.infer<typeof CollectionSchema>;

/** methodology.md must contain these H2 sections (exact text); extra sections are allowed. */
export const METHODOLOGY_SECTIONS = {
  meaning: 'What D measures',
  inclusion: 'What is included',
  success: 'What counts as success',
  coverage: 'Coverage',
  dates: 'Dates and freshness',
  corrections: 'Corrections',
} as const;

/** changes.yaml: concise dated changes to published editorial content. EDI edition changes are added by the build. */
export const ChangeEntrySchema = z.strictObject({
  date: IsoDate,
  kind: z.enum(['editorial', 'correction']),
  summary: text(300),
  subjects: z.array(z.union([SubjectId, RecordId])).max(24).default([]),
});
export type ChangeEntry = z.infer<typeof ChangeEntrySchema>;

/** redirects.yaml: old slugs that must keep resolving. */
export const RedirectsSchema = z.strictObject({
  objects: z.record(Slug, EdiId).default({}),
  stories: z.record(Slug, RecordId).default({}),
});
export type Redirects = z.infer<typeof RedirectsSchema>;

export const ClaimsFile = z.array(SourceClaimSchema);
export const ObservationsFile = z.array(ObservationSchema);
export const RelationshipsFile = z.array(RelationshipSchema);
export const SubjectsFile = z.array(ContextSubjectSchema);
export const CollectionsFile = z.array(CollectionSchema);
export const ChangesFile = z.array(ChangeEntrySchema);

/** Frontmatter keys that look like a stored assessment. Rejected with a pointed message. */
export const FORBIDDEN_ASSESSMENT_KEYS = [
  'grade',
  'tier',
  'd',
  'dLevel',
  'level',
  'proposedTier',
  'effectiveLevel',
  'knownFloor',
  'status',
  'assessment',
  'reviewedAt',
  'nextReviewAt',
  'dependencies',
  'controls',
] as const;
