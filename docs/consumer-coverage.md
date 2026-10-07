# Consumer coverage and research

A financial application can support an object before its control research is complete. Export the application's full supported universe, including unmeasured assets and deployments, as a consumer inventory. Reconcile that inventory against a pinned EDI registry before collecting a new financial edition:

```sh
npm ci
npm run compile
npm run reviews:plan -- --inventory=/path/to/inventory.json --as-of=YYYY-MM-DD --all
```

`--all` requests an initial full restudy of matching nonpermanent mechanisms and position scopes. For subsequent reconciliation, omit it and optionally set `--due-within-days=7`. Pass `--previous-inventory=/path/to/previous.json` to detect identity, deployment or dependency changes. Ordinary registry review tasks still appear under `tasks`; consumer-specific missing and mismatched identities appear under `consumer.tasks`. Process both. Missing reviews cannot be found by enumerating only existing registry records.

The version 1 inventory is `{schemaVersion: 1, consumer, objects}`. Each object has a unique `id`, a proposed canonical `entityId`, `kind` (`chain`, `asset`, `protocol`), `name`, `scope` (`mechanism`, `position`), `sources` and `dependencies` (canonical EDI identities). Optional `deployment` contains a named `chain`, an EVM `chainId` and an exact `address`. Non-EVM or unspecified contracts remain explicitly unverified; do not invent an EVM chain ID to obtain a match. The exported `validateInventory` and `reconcileInventory` APIs use the same rules as the CLI. Input is bounded to 4 MiB in the CLI and 4,096 objects, with bounded lists and identity strings.

Exact IDs and curated aliases resolve mechanisms. An explicit deployment is covered only by an exact recorded chain ID and contract address. Tickers, similar brand names, a review's dependency on a chain, and a factory's existence do not prove an arbitrary deployment. A deployment gap is a research task, not a new grade. Position dependencies require their own assessment even for an immutable D0 mechanism. Changed identity assertions require review before relying on a prior permanent exemption.

For each task, a human or research agent must establish the actual deployment, implementation/proxy path, privileged authorities, governance and emergency powers, delays, realistic exit conditions, and dependency scope from dated primary evidence. Use `reviews:fetch` for bounded contract-source evidence where supported, then prepare a candidate for `reviews:apply`; fetching source alone is not a control assessment. Read [refresh.md](refresh.md) for candidate validation and atomic application. Record incomplete findings and the reason for uncertainty honestly; never synthesize a review date from an API refresh or reuse another deployment's rating.

The report carries the registry and inventory digests, the evaluation date, original review dates, unresolved dependencies and reasons for each task. It is a reproducible planning result, not a research completion receipt. Publish accepted research in the canonical registry and its generated outputs; Git retains previous accepted versions. A consumer pins the resulting immutable EDI commit before freezing its collector. Financial observation timestamps remain separate from research dates. Historical assessment reproduction uses that historical pin and an explicit assessment date; live applications may expire a monthly review without altering historical findings.
