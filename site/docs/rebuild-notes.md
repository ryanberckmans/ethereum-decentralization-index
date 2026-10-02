# Continuation notes

State of the directory rebuild when it was first merged (October 2026), for
whoever continues it. The [README](../README.md) says how to work on the site;
[architecture](architecture.md) and [contracts](contracts.md) say how it fits
together and what it guarantees.

## Decisions taken

- **Rendering:** Astro 7 server rendering on Cloudflare Workers, not static
  generation. EDI results change on review due dates, so every response is
  evaluated for its own UTC date, and later results ride along in inert
  templates for cached pages and long-open tabs.
- **EDI dependency:** `"ethereum-decentralization-index": "file:.."`. The
  repository commit is the edition's EDI pin. Vite dedupes `react`,
  `react-dom` and `radix-ui` because the linked package resolves its peers
  from the repository root.
- **Name:** the product is "EDI Directory", the directory of the Ethereum
  Decentralization Index (`PRODUCT` in `src/config.ts`).
- **Slugs:** `:` becomes `--` and `.` becomes `-` (`token--uniswap`,
  `seaport-v1-6`). Raw EDI IDs, percent-encoded IDs and other capitalizations
  redirect to the canonical slug.
- **Languages:** the interface is translated into all eight languages;
  editorial content is English and marked `lang="en"`. Search maps words in
  the page language to the English words records use (`searchTerms` in each
  dictionary), splits unspaced Chinese and Japanese at known words and
  ignores articles and particles.
- **CSP:** strict, hashed, no inline styles. EDI's guide dialog needed a
  `react-style-singleton` replacement that uses constructable stylesheets.
- **Deployment:** secrets-gated workflow; nothing deploys until the
  Cloudflare secrets exist. Owner steps are in the README.

## Findings worth keeping

- EDI assessments are piecewise constant in the date: they change only when
  a mechanism or position review falls due (every monthly review in this
  edition is due 2026-11-01). `registryAssessment(id, asOf)` throws for dates
  before the registry date, so dates are clamped to it.
- EDI locale keys are `en zh es ja ko fr pt de`: `zh-CN` maps to `zh` and
  `pt-BR` to `pt`.
- `dist/core/index.js` imports all eight EDI locales; EDI badges are rendered
  on the server and the guide is loaded on click to keep them off first load.
- Acceptance-case records: own-tier-zero wrappers `wsteth`, `weeth`, `reth`,
  `sfrxeth`; `liquity-v1` and `liquity-v2` partial with own tier 0;
  `token:golem` unreviewed with a D0 floor (shown as D?); unversioned
  `uniswap` is unreviewed; `uniswap-v4`, `morpho-blue` and `seaport-v1.6`
  carry unresolved position reviews.

## Open work

- **Content.** This edition has two profiles (WETH, USDC) and two stories.
  The content thread owns the rest of the twelve priority profiles, the
  remaining stories (including Morpho on Base and BUIDL with UniswapX), roles
  for every record and methodology copy. Records without a profile are honest
  basic records from EDI's own text.
- **Acceptance tests waiting on content:** Morpho story scopes and the BUIDL
  integration (see [contracts](contracts.md)).
- **Translated editorial content:** not started; the schema has no locale
  overlays yet.
- **Field performance:** budgets are verified in the lab (Playwright, 390px
  phone). LCP and INP need field data after launch.
