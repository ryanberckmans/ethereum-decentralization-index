# Canonical research data

EDI owns the deployment-specific control registry, research policy, refresh hints and derived latest snapshot. Map of Ethereum owns financial observations and conserved capital accounting. A price or holdings refresh cannot renew a decentralization review.

| File | Purpose |
|---|---|
| `data/control-registry.json` | Current canonical research records, evidence, exact identities, grades/floors, dependencies and real review dates |
| `data/latest.json` | Compact current summary, including source SHA256, freshness and permanent-D0 flags |
| `data/refresh-hints.json` | Full-restudy checklist and concrete project/chain guidance |
| `data/coverage-input.json` | One latest conserved L1 cohort input, with its financial observation provenance |
| `data/mapped-l1-coverage.json` | Reproducible mechanism and position coverage for that explicit cohort |
| `data/rubric.json` | Shared ordinal taxonomy and translations |

Only latest files are retained in the working tree. Older committed versions belong in Git history. The ignored `work/latest-evidence/` cache overwrites each deployment's current observation; it is neither a history archive nor part of the package. It can be deleted and regenerated. Downloaded contract sources are inspection inputs, not duplicated in the canonical registry.

## Identity and completeness

Use chain ID plus exact address or reviewed factory provenance. Registry IDs and curated aliases are explicit; tickers and application brands are not deployment identities. `ethereum` names the chain, while `asset:ethereum` names native ETH. Token IDs such as `token:uniswap` are separate from protocol IDs such as `uniswap-v4`. Native OP and AERO are recorded on chains 10 and 8453; unidentified Ethereum representations remain unknown.

`proposedTier` describes the recorded mechanism; composed assessments also include material dependencies. `assessment: "lower-bound"` and `tierBound: true` preserve a documented floor without claiming a complete grade. Missing, overdue or unresolved dependencies remain visible. Use `registryAssessment(id, asOf, {scope: 'position'})` when assessing a position. The mechanism entry alone cannot certify its hooks, tokens, oracles or vaults.

Uniswap v1, v2, v3 and the canonical v4 PoolManager are reviewed D0 cores. The unversioned `uniswap` identity intentionally remains unknown. V4 hook-dependent positions and Morpho market/vault dependencies have their own unresolved monthly work. UNI's issuance authority and MORPHO's upgradeable token are separate from the immutable application cores.

Permanent D0 requires an assessed D0, a named immutable identity and an entirely permanent D0 dependency path. It never expires with age. New deployments, evidence corrections and newly selected dependencies are distinct work. An immutable wrapper of controlled backing does not qualify for permanent D0.

Every other mechanism and every unresolved position dependency is fully restudied monthly. Deadlines are at most one calendar month after the real review date, clamped at month end; an explicit earlier deadline wins. After expiry, the API preserves the known floor but removes complete status. Historical assessment calls require the registry version that existed at that date; a current record cannot be evaluated before its review date.

Source proofs retain source/runtime SHA256 fingerprints, the compiled target, exact address and selected state/authority observations. Hashes are compact evidence locators, not an independent code audit. Sourcify can miss legacy proxies: TUSD, GUSD and SNX required manual proxy identification. A verified-source match or negative proxy hint never assigns D0 automatically. Inspect the reachable implementation and controller graph. Source URLs may move; fingerprints and Git history preserve what was accepted.

## Format choice and measured sizes

The canonical format is JSON with metadata followed by one complete entity per line, sorted by ID. It preserves familiar field names, null/false distinctions, ordinary tooling and useful entity-level diffs. `latest.json` is compact generated JSON. No Protobuf compiler, runtime or additional dependency is required.

At the recovered 83-record baseline, compact JSON was 78,294 bytes (15,277 gzip). A typed-field TextProto prototype was 81,386 bytes (15,264 gzip), approximately 4% larger before compression. That prototype omitted null fields and was not a complete schema/round-trip benchmark. It is insufficient evidence to choose a canonical Protobuf representation. Pretty JSON was 97,418 bytes (15,913 gzip). The original dataset averaged about 943 compact bytes per record.

The important tradeoff is research readability and reproducibility versus minimum transport bytes. TextProto needs a schema and formatter while providing no material measured benefit at this scale. Protobuf binary could be an optional generated transport later if a consumer demonstrates a need. Protobuf serialization is [not canonical](https://protobuf.dev/programming-guides/serialization-not-canonical/); do not hash arbitrary serializer output as the research identity. Hash the accepted canonical file bytes instead.

Run `npm run data:size` for the exact current registry, snapshot, hints, coverage and apparatus sizes, with gzip level 9. Apparatus includes the registry and core semantics source, rubric, collector/generator/acceptance scripts, relevant tests, documentation and TypeScript configuration; the lockfile is reported separately. Installed dependencies and compiled UI/image assets are excluded from this refresh-only measure. The small generated registry module is shipped in `dist/` for Git consumers, with parity checked against the canonical JSON.

## Historical and financial data boundary

The imported financial cohort was observed on 2026-09-28. Its dates and quantities remain unchanged by this research release. It covers 21 mapped L1 protocols and about $18.732 billion in conserved located holdings. Complete mechanism coverage and complete position coverage are reported separately; neither is an exhaustive claim about Ethereum L1. Unresolved position configuration prevents full coverage.

Read-only measurements of the Map source at `fdcbf4182d934aac293d8dec1235e57657490c52` found:

| Map path | Latest bytes | Unique committed versions | All logical blob bytes | Older logical bytes |
|---|---:|---:|---:|---:|
| `data/control-registry.json` | 97,418 | 7 | 494,864 | 397,446 |
| `data/capital-inputs.json` | 2,622,026 | 6 | 8,113,553 | 5,491,527 |
| `data/paid-observations.json` | 1,383,147 | 2 | 1,388,514 | 5,367 |

These are uncompressed unique blob sizes, not Git pack/delta disk usage. EDI imports the current research records and compact cohort input, not the financial collector, credentials, paid observations or historical files. The Map's full financial `latest.json` was 711,337 bytes with 1,450 holdings; it is not the EDI rating snapshot.

To inspect a historical version without keeping copies in the working tree:

```sh
git log -- data/control-registry.json
git show <commit>:data/control-registry.json
```

## Consumer migration

Pin EDI to an exact release commit. Import `registry` and `registryAssessment` from `ethereum-decentralization-index/registry`, or use its `/registry.json` export for build-time compatibility. Replace the consumer's hand-maintained registry with that export. Keep financial refresh and accounting in the consumer. Do not silently retain two editable authorities.

```ts
import {registry, registryAssessment, reviewQueue}
  from 'ethereum-decentralization-index/registry';

const mechanism = registryAssessment('uniswap-v4', '2026-09-29');
const position = registryAssessment('uniswap-v4', '2026-09-29', {scope: 'position'});
const due = reviewQueue('2026-10-01');
```

Publishing this EDI source release does not deploy a consuming application. A consumer must update its pin, replace local registry reads, and verify its accounting/position composition before release.
