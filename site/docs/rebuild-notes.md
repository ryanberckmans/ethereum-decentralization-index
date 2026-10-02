# Continuation notes

State of the directory rebuild when it was first merged (October 2026), for
whoever continues it. The [README](../README.md) says how to work on the site;
[architecture](architecture.md) and [contracts](contracts.md) say how it fits
together and what it guarantees.

## Decisions taken

- **Rendering:** Astro 7 static generation: plain files any static host can
  serve, with no server code ([hosting](hosting.md)). EDI results change on
  review due dates, so pages are evaluated for the build date and carry every
  later result in inert templates that the browser switches to on the day it
  applies. Search, filters and comparisons run in the browser from small
  same-origin data files; without scripts the directory lists every record
  and the compare page says it needs them.
- **EDI dependency:** `"ethereum-decentralization-index": "file:.."`. The
  repository commit is the edition's EDI pin. Vite dedupes `react`,
  `react-dom` and `radix-ui` because the linked package resolves its peers
  from the repository root.
- **Name:** the site is the "Ethereum Decentralization Index" (Ryan, 2
  October 2026), kept in English as a proper name in every language, with
  "EDI" as its short form. It is `PRODUCT.name` in `src/config.ts`, and the
  dictionaries take it through a `{name}` placeholder. The site's listing
  page is still called the directory.
- **Slugs and addresses:** `:` becomes `--` and `.` becomes `-`
  (`token--uniswap`, `seaport-v1-6`), and every address ends with a slash.
  Old slugs and raw IDs that are safe file names get redirect pages at build
  time; raw IDs with a colon, percent-encoded IDs, other capitalizations and
  addresses without a language are resolved by the not-found page's script.
- **Languages:** the interface is translated into all eight languages;
  editorial content is English and marked `lang="en"`. Search maps words in
  the page language to the English words records use (`searchTerms` in each
  dictionary), splits unspaced Chinese and Japanese at known words and
  ignores articles and particles.
- **CSP:** strict, hashed, no inline styles, delivered in a `<meta>` tag so
  it holds on any host. EDI's guide dialog needed a `react-style-singleton`
  replacement that uses constructable stylesheets. Framing protection needs a
  host header ([hosting](hosting.md)).
- **Deployment:** none is set up; the site's host has not been chosen. The
  build assumes none: [hosting](hosting.md) lists what any host must do and
  the headers worth adding.

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

- **Content.** This edition has twelve edited profiles and six stories;
  records without a profile are honest basic records from EDI's own text.
  Stories still to write include Morpho on Base and BUIDL with UniswapX.
- **Acceptance tests waiting on content:** Morpho story scopes and the BUIDL
  integration (see [contracts](contracts.md)).
- **Translated editorial content:** not started; the schema has no locale
  overlays yet.
- **Field performance:** budgets are verified in the lab (Playwright, 390px
  phone). LCP and INP need field data after launch.
