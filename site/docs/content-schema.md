# Editorial content schema

The directory joins two sources:

- **EDI** (this repository's `data/`, `src/`, `dist/`) is the only assessment authority. Grades, floors, partial and unknown status, controls, dependencies, scope and review dates come from it and are derived at render time with its date-aware functions.
- **Editorial content** in `site/content/` describes what objects enable, cites evidence, records dated observations and connects objects to each other and to organizations outside EDI.

The types and rules live in [`src/content/schema.ts`](../src/content/schema.ts). Run `npm run content:check` in `site/` to validate everything, including cross-references against the EDI registry. Shape examples that pass the validator are in [`docs/content-examples/`](content-examples/); they illustrate structure and must be re-verified before any of their facts are published.

## Files

| Path | Holds |
| --- | --- |
| `objects/<slug>.md` | One EDI object's editorial record: frontmatter plus profile sections |
| `stories/<slug>.md` | One story: frontmatter plus the five story sections |
| `claims.yaml` | Source claims: what a specific source supports, with its evidence state |
| `observations.yaml` | Dated numbers with unit, scope, chains, measure and sources |
| `relationships.yaml` | Typed, sourced editorial connections |
| `subjects.yaml` | Organizations, products, deployments, networks and economic references outside EDI |
| `collections.yaml` | The two collections, `d0-in-use` and `global-economy`, with their home entrances |
| `methodology.md` | Methodology copy with six required H2 sections |
| `changes.yaml` | Dated editorial changes (EDI edition changes are added by the build) |
| `redirects.yaml` | Old object and story slugs that must keep resolving |

Every file is optional while content is being written. An EDI record without an `objects/` file is listed as an honest basic record using EDI's own scope, reason and controls.

The directory's role filter is only shown when most records carry a role, so give every EDI record a role: a `basic-record` file with `ediId`, `contentStatus: basic-record`, `role` and `editorialReviewedAt` is enough for records without a profile.

## Identity rules

- `ediId` and `objectIds` are EDI registry IDs exactly as written in `data/control-registry.json` (`weth9`, `token:uniswap`, `seaport-v1.6`). Tickers and brands are never IDs.
- Organizations and anything else outside EDI use a prefixed contextual ID: `org:`, `product:`, `deployment:`, `network:` or `ref:`. They are shown without a grade. A deployment that shares code or a brand with an EDI record (Morpho on Base, for example) is a `deployment:` with `relatedEdiId`; it never inherits the record's assessment.
- Object slugs default to the EDI ID with `:` replaced by `--` and `.` by `-` (`token--uniswap`, `seaport-v1-6`). A `slug` override is allowed; changing a published slug needs an entry in `redirects.yaml`.

## Objects (`objects/<slug>.md`)

Frontmatter fields: `ediId`, `contentStatus` (`basic-record` or `edited-profile`), `role`, `summary`, `capability`, `authority`, `economicTags`, `aliases`, `officialLinks` (`label`, `url`, `checkedAt`), `featuredObservationId`, `editorialReviewedAt`. An edited profile needs `role`, `summary`, `capability`, `authority` and a `## What it enables` section. Optional sections: `## Observed use`, `## Control in context`.

There is no grade, tier, status, control or review-date field. Unknown keys fail validation. `authority` describes retained powers in plain words; the badge beside it comes from EDI.

Roles: `native-asset`, `wrapper`, `dollar-token`, `fund-shares`, `commodity-claim`, `bitcoin-representation`, `staking`, `restaking`, `exchange`, `lending`, `settlement`, `yield`, `payment-streams`, `network`, `bridge`, `governance-token`, `infrastructure`. Ask for a new role rather than stretching one.

## Stories (`stories/<slug>.md`)

Frontmatter: `id`, optional `slug`, `title`, `dek`, `thesis`, `objectIds` (EDI), `contextualSubjectIds`, `collections`, `outcome` (`mechanism`, `state`, `statement`), `ethereumContribution`, `controlBoundary`, `claimIds`, `observationIds`, `relationshipIds`, `reviewedAt`.

The body has exactly these H2 sections in order: `## Before` (the prior limitation), `## The mechanism`, `## Evidence of use`, `## What becomes possible`, `## What remains controlled`.

Outcome mechanisms: `distribution`, `programmable-settlement`, `asset-mobility`, `collateral`, `liquidity-access`, `coordination`, `reusable-infrastructure`.

## Contextual subjects

`subjects.yaml` entries need `id`, `kind`, `name` and `description`. A `network:` subject also needs `ethereumRelation`: `ethereum-settled` only when its settlement on Ethereum is verified (EVM compatibility is not enough), otherwise `outside-ethereum`; activity there is shown as scoped context, never as Ethereum activity. Other kinds omit it.

## Evidence

Evidence states, shown as short labels: `capability`, `announced`, `pilot`, `live`, `reported-adoption`, `reproduced-observation`, `forecast`. A story's outcome state must be supported by at least one of its claims with that state or a stronger one; announcements and forecasts are never shown as achieved.

Observations keep stocks, flows, counts, rates and durations apart. A stock needs `asOf`; a flow needs `interval`; others need one of the two. `value` is an exact decimal string; a missing number is omitted, never zero. `comparator` records "more than", "at least" or "about". `chainIds` is a list, `multichain-unsplit` (the source does not split chains, so the number is never shown as Ethereum activity) or `not-applicable`. A `rate` needs `ratePeriod` (`day`, `week`, `month` or `year`; an annualized run rate is `year`). Observations are compared only within one `comparisonGroup` with the same unit and time basis; nothing is summed.

Relationship types: `settles-on`, `issues`, `interface-to`, `integrates-with`, `collateral-for`, `economic-reference`. Each needs at least one source claim. EDI dependency edges are generated from the registry and cannot be written here; an editorial relationship never changes an assessment.

## Markdown

Paragraphs, emphasis, lists, block quotes, inline code and https links. Raw HTML is rejected. Tokens:

| Token | Renders |
| --- | --- |
| `{{object:weth9}}` | Link to the object, labelled with its EDI name |
| `{{grade:uniswap-v4}}`, `{{grade:uniswap-v4:position}}` | The live EDI badge for the mechanism or position scope |
| `{{subject:org:opensea}}` | The contextual subject's name, marked as outside EDI |
| `{{claim:opensea-weth-offers}}` | A citation marker with the claim's evidence state |
| `{{obs:v2-flash-swaps-2020}}` | The observation's value, unit and date |

Write grades with `{{grade:…}}` rather than as literal text such as "D0", so prose stays true when an assessment changes. The validator warns about literal grades.

## Dates

Three clocks stay separate: EDI review dates (from the registry), observation dates (`asOf`, `interval`) and editorial dates (`editorialReviewedAt`, `reviewedAt`, `retrievedAt`, `checkedAt`). No editorial date may be later than the build date.

## Translations (planned)

English files are the source. Other locales will be overlays under `content/i18n/<locale>/` that translate only text fields, keyed by the same IDs and slugs; the validator will require completeness before a locale is published. Do not translate IDs, URLs, numbers or dates.
