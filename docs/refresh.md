# Refresh research from a fresh checkout

Use Node 22.21+ or 24.10+ and npm. No model API, credential, paid data subscription or external service is required to build or check the snapshot. An agent performs the research; the scripts organize it, collect bounded public evidence and validate explicit accepted records. Grades are not inferred from a network response.

```sh
git clone https://github.com/ryanberckmans/ethereum-decentralization-index.git
cd ethereum-decentralization-index
npm ci
npm test
npm run data:size
npm run reviews:check
mkdir -p work
npm run --silent reviews:plan -- --as-of=2026-10-01 > work/plan.json
```

Use the actual UTC review date instead of the example. `reviews:plan` includes due mechanism and position tasks; `--all` also includes non-D0 tasks not yet due. `--ids=id1,id2` narrows the plan. Proven immutable D0 cores are always excluded from scheduled mechanism restudy, while unresolved position dependencies are retained. The plan carries the exact current registry hash, scope, evidence URLs, prior findings, deployments, dependencies and project hints.

## Bounded source collection and recovery

```sh
npm run reviews:fetch -- --as-of=2026-10-01 --limit=32
# If your environment uses HTTP(S)_PROXY, enable Node's proxy support:
NODE_USE_ENV_PROXY=1 npm run reviews:fetch -- --as-of=2026-10-01 --limit=32
```

The collector calls only the fixed public Sourcify v2 endpoint for recorded addresses. It allows at most four requests in flight, one request per unique deployment, 20 seconds per request, 4 MiB per response and 32 requests per invocation by default (maximum 128). Redirects are refused. It performs no automatic retries, wallet operations, spending or arbitrary evidence-URL fetching. Rate limits preserve a failure and Retry-After information. Additional documentation and RPC reads are explicit research actions, not hidden collector calls.

Every result is saved immediately under ignored `work/latest-evidence/`. Resume uses the same date and skips already checkpointed successes **and failures**. Continue bounded invocations until the remaining list is empty. A later dated run can try again; to intentionally retry a repaired same-day failure, first inspect and remove only that deployment's failed checkpoint. A source failure leaves the grade and real review date untouched. A killed process loses at most the observations still in flight; completed checkpoints survive. Cache writes replace a single latest file per identity.

`--all` collects non-D0 deployments that are not yet due; it still excludes permanent D0. Entities with no recorded address need documentation/deployment discovery. Proxy implementations, legacy proxy targets, owners, role members, controllers and external dependencies must be followed explicitly after the initial response. A negative provider proxy hint is not proof of immutable code.

## Full restudy and accepted records

Read `data/refresh-hints.json` and complete all six checks for each record: `identity`, `implementation`, `authorities`, `timing`, `exits`, `dependencies`. Review matched source and inherited code, current admin/owner/role state, reachable controllers, upgrade routes, delays/bypasses/emergency powers, custody/withdrawal paths and material offchain backing. Identify current hooks/oracles/vaults and bridge origin individually. Use current primary documents and contract state; do not copy a prior conclusion and advance its date.

EDI regards L2BEAT as the authority on scientific risk assessment ([EDI and L2BEAT](../README.md#edi-and-l2beat)). For a project L2BEAT tracks, read its current L2BEAT project page alongside the primary sources and cite that page among the evidence when it informs the review: consumers link readers to it for the detailed assessment. Never convert an L2BEAT stage or risk rating into a grade mechanically. D0–D9 remains EDI's own ordinal summary of documented control, reached through the six checks.

Retain lower bounds and named gaps when closure fails. A partial investigation may record an attempt but cannot renew a prior full `reviewedAt`. Newly discovered controls can strengthen a floor without pretending the entire path is complete. Keep evidence and the immutable deployment scope concise.

Create an explicit candidate in ignored `work/`, using the base hash from the plan and full replacement records:

```json
{
  "schemaVersion": 1,
  "baseRegistrySha256": "<exact hash from the plan>",
  "asOf": "2026-10-01",
  "records": ["<complete researched entity objects, not these placeholder strings>"],
  "positionReviews": [{
    "id": "<permanent-D0-core-with-a-due-position-review>",
    "positionReview": {"cadence": "monthly", "reviewedAt": "2026-10-01", "nextReviewAt": "2026-11-01", "status": "unresolved", "reason": "<current scoped finding>"},
    "reviewChecks": ["identity", "implementation", "authorities", "timing", "exits", "dependencies"]
  }],
  "corrections": {"<permanent-D0-id-if-needed>": "<specific evidence correction>"}
}
```

The six required `reviewChecks` are attestations by the researcher, not a machine proof that the work was done. Each completed replacement record needs cited evidence, the actual date, explicit scope, dependencies and a valid next date for monthly work. A completed `positionReviews` item updates only the nested dependency review: the immutable core record and its permanent review date remain unchanged. For an incomplete attempt on an existing non-D0 record, retain its previous `reviewedAt` and `nextReviewAt`, set `researchAttemptedAt` to the candidate date, and retain `assessment: "lower-bound"` with `tierBound: true`. The validator refuses to weaken its established floor. This records progress while leaving overdue research due. Permanent D0 core changes require a named evidence correction; an incomplete attempt cannot replace one. Do not schedule reanalysis just to touch its date.

```sh
npm run reviews:apply -- work/candidate.json
npm test
npm run reviews:check -- --strict
npm run pack:check
```

Acceptance checks the base hash, unique records, complete attestations, dates and the entire dependency graph before replacing the canonical file. A cooperative writer lock prevents concurrent acceptance runs; a second digest check catches manual edits before replacement. Coordinate with other source editors. If a process dies while accepting, inspect `work/registry-apply.lock`, its PID, the current registry and the candidate hash before removing the stale lock. The canonical file is replaced by rename, so a crash does not leave half a JSON document. Never blindly replay a publication after a lost response; read the remote branch first.

Run `npm run compile` to regenerate `dist/registry/data.js`, the latest summary and coverage report. This step is deterministic and offline; it never changes research dates or financial observations. `reviews:check --strict` fails when monthly work is due. Stage the reviewed canonical data, generated output and any matching hints, then run `npm run release:check` before the authorized source publication. Source and package parity must pass; inspect the diff and package contents. A successful script run with unresolved floors is not a claim that those dependencies are fully reviewed.

## Updating the coverage denominator

`data/coverage-input.json` contains one latest conserved financial cohort, not a paid provider pipeline. To replace it, use a current consumer export with its real cycle, observed/built timestamps and source SHA256. Group already conserved holdings by protocol, asset and unresolved-position flag, preserving their sum; map asset IDs to exact reviewed identities. Never add overlapping protocol TVLs as a substitute. Then regenerate the coverage report. The review date does not become the financial observation date.

Monthly operational research must use the latest canonical EDI main and current project instructions. Git stores prior accepted states; do not create dated snapshot directories or research archives in the working tree.
