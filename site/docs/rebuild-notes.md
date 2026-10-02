# Rebuild continuation notes (2 October 2026)

State of branch `claude/site-rebuild-5qr58o`, based on `claude/move-site-into-index-repo-9vl0t1`:

- The old ChatGPT Sites / Vinext scaffold is removed. `site/content/` is untouched; its old `*.json` and `ui/` files are unused and belong to the content thread to delete.
- The editorial content schema, loader, Markdown parser and cross-validator exist (`src/content/`), documented in `docs/content-schema.md` with passing examples in `docs/content-examples/`. `npm run content:check [dir]` runs on Node 22.18+ type stripping; `npx tsc --noEmit` passes. The content thread has the schema location.
- Nothing else is built yet. The layout comparison (row-led editorial directory versus split directory/inspector) was not started, so there are no comparison results. The prior, untested, was row-led because every row must be a real link and phones collapse an inspector anyway.

## Decisions taken

- **Framework:** Astro 7.3.5 static generation with React 19.3 components; React islands only for the directory search/filters and comparison. Astro 7 has stable `security.csp` (meta CSP with script/style hashes, build only) and a fonts API whose `fontProviders.local()` can serve `@fontsource` files from `node_modules`, so no runtime third-party requests.
- **Host:** Cloudflare Workers static assets (the old scaffold's intended host; it was never deployed from GitHub and references no secrets). Deploy workflow should run only when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist or on manual dispatch. Ryan asked for decisions without questions and for automerge.
- **EDI dependency:** `"ethereum-decentralization-index": "file:.."` (npm symlink). Vite needs `resolve.dedupe` for `react`, `react-dom` and `radix-ui`, because the linked package's real path resolves peers from the repo root. The repository commit is the edition's EDI pin.
- **Name:** present the site as the directory of the Ethereum Decentralization Index; keep the product name in one config constant.
- **Slugs:** `defaultObjectSlug` in `schema.ts` maps `:` to `--` and `.` to `-` (`token--uniswap`, `seaport-v1-6`); overrides need `redirects.yaml`.

## Findings worth keeping

- `data/control-registry.json` SHA-256 equals `latest.json` `registrySha256` (`0fb808b3…d413f`); assert this at build.
- EDI assessments are piecewise constant in the date: they change only when some `dueAt` (mechanism or position review) is reached. In this edition every monthly record and position review is due 2026-11-01. HTML evaluated at the build date is exact until the earliest `dueAt` after it, so the client only needs to load the registry and rerun `registryAssessment` once today reaches that date (and on UTC date change or a resumed tab). Prove it with a test over every entity and every date in the window.
- `registryAssessment(id, asOf)` throws when `asOf` precedes any entity's `reviewedAt`, because it times every entity. Clamp a skewed client clock to at least the registry's `lastUpdatedAt`.
- EDI locale keys are `en zh es ja ko fr pt de`: map `zh-CN` to `zh` and `pt-BR` to `pt`.
- `dist/core/index.js` imports all eight EDI locales; `describeAssessment` and the EDI React components pull them in. To keep eight dictionaries off first load, render badges server-side and lazy-load `DecentralizationGuide` on click; the registry functions alone tree-shake the locales away.
- The EDI badge has a fixed dark background (`#06111e`) in both themes.
- Acceptance-case records: own-tier-zero wrappers `wsteth`, `weeth`, `reth`, `sfrxeth`; `liquity-v1`/`liquity-v2` lower-bound with own tier 0; `token:golem` lower-bound with a D0 floor (renders D?); unversioned `uniswap` is unreviewed; `uniswap-v4`, `morpho-blue` and `seaport-v1.6` carry unresolved position reviews. 17 permanent D0 records; 46 of 118 have canonical addresses.
- Playwright 1.56.1 and Chromium 1194 are preinstalled at `/opt/pw-browsers` in the old environment.
