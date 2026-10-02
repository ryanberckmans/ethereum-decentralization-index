# Editorial content

Editorial content for the Ethereum Decentralization Index website: profiles, stories, sources, dated
observations and relationships. EDI, at the repository root, is the only assessment authority. Nothing here states a
grade; prose uses `{{grade:…}}` tokens that render EDI's live result. The schema and its rules are in
[`../docs/content-schema.md`](../docs/content-schema.md) and [`../src/content/schema.ts`](../src/content/schema.ts).

```sh
cd site && npm ci && npm run content:check
```

| Path | Holds |
| --- | --- |
| `objects/<slug>.md` | One file per EDI record: a role for every record, a full profile for the priority ones |
| `stories/<slug>.md` | Stories, each with the five required sections |
| `claims.yaml` | What each source supports, with its evidence state and retrieval date |
| `observations.yaml` | Dated numbers with unit, scope, chains and sources |
| `relationships.yaml` | Typed, sourced connections; never control dependencies |
| `subjects.yaml` | Organizations, products, deployments and networks outside EDI, never graded |
| `collections.yaml` | The two collections and their home entrances |
| `evidence/` | Onchain reads behind every reproduced observation, and the script that re-runs them |

## Evidence rules

- Every claim cites one source and says only what that source supports. Its state is the strongest the source
  justifies: capability, announced, pilot, live, reported adoption, reproduced observation, or forecast.
- Every number is an observation with a date or interval, unit, chain scope, entity scope, definition and source.
  Prose uses `{{obs:…}}` so the number always appears with its date.
- Nothing is summed across nested holdings, and a contract's balance is part of a token's supply, never an addition
  to it. Stocks, flows, run rates and counts are kept apart. A multichain figure is marked `multichain-unsplit` and is
  never presented as Ethereum activity.
- Numbers from the chain are reproduced, not copied: see [`evidence/README.md`](evidence/README.md).
- A source that could not be fetched is not cited. A gap stays a gap; it is never filled with an estimate.

## Dates

`retrievedAt` and `checkedAt` are when an editor read a source or confirmed a link. `sourcePublishedAt` and
`observedAt` come from the source. Observation dates belong to the data. EDI's review dates come from EDI and are never
written here.
