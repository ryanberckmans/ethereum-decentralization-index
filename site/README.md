# Ethereum Directory

A server-rendered directory of 118 canonical EDI objects, 12 edited profiles, six sourced stories and three historical observations. Its editorial collections connect useful D0 mechanisms with institutions, assets and networks participating in Ethereum's economy.

## Run and verify

Requires Node.js 22.13 or later and pnpm 11.25.0. Preserve the pinned lockfile.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec tsc --noEmit
pnpm build
node tests/http-smoke.mjs
```

For development use `pnpm dev`; in supervised Sites environments use the preview controller instead. `pnpm start` serves the built Worker locally through Wrangler and does not deploy it. The HTTP smoke check invokes the built fetch handler directly; it is not a browser or deployed-Cloudflare test.

```sh
EDI_QA_OUTPUT=/tmp/edi-qa node tests/http-smoke.mjs
node scripts/measure-bundle.mjs /tmp/edi-qa/directory-response.html
```

## Routes and state

The main routes are `/en`, `/en/objects/weth9`, `/en/stories`, `/en/compare`, `/en/methodology`, `/en/changes`, `/en/collections/d0` and `/en/collections/global-economy`. A colon in a canonical object ID becomes two hyphens in its path. Replace `en` with `es`, `pt-BR`, `fr`, `de`, `zh-CN`, `ja` or `ko`.

Query, filters, sort, page and up to four comparison IDs belong to the URL. Theme and language are local preferences; explicit locale URLs take precedence. No wallet, account, database, runtime RPC, third-party analytics or model call is required.

Exports are `/data/directory.json`, `/data/directory.csv` and `/data/observations.json`. Public agent guidance lives at `/agents.md` and `/llms.txt`. Optional browser WebMCP tools `read_directory_state` and `configure_directory` share the visible filters and URL state, validate input before mutation, and unregister on navigation.

## Source and editorial ownership

EDI is pinned to commit `60c755565f285c379af7e23c20f50adc59eac57d` of [ethereum-decentralization-index](https://github.com/ryanberckmans/ethereum-decentralization-index). Release files are vendored byte-for-byte under `vendor/edi`; `vendor/PROVENANCE.json` records their original Git blob hashes. The check command verifies all 18 files and the registry SHA-256.

The app imports canonical assessment functions. Editorial records never supply grades or change control dependencies. Assessments are evaluated against the server UTC date and refreshed on client date changes and resumed tabs. Permanent D0 does not age-expire. Mechanism scope, partial floors, unknown status and separately reviewed position coverage remain distinct.

`content/<locale>.json` holds editorial content and `content/ui/<locale>.json` interface text. Canonical EDI semantics are supplied from the active upstream locale. `lib/evidence.ts` holds claims and historical observations. `lib/relationships.ts` holds typed editorial connections and explicitly ungraded contextual subjects.

Updates are prepared offline: review the upstream diff, replace the source pin and provenance together, validate content, then build. Failed validation must not replace a previously published edition. No scheduled importer is installed.

## Runtime configuration

The app uses React 19, TypeScript and Vinext. The built Worker exports a default `fetch` handler at `dist/server/index.js`; public assets live under `dist/client`.

Set `SITE_URL` to the intended HTTPS origin for canonical URLs, hreflang, sitemap and social metadata. Credentials, queries and subpaths are rejected. With no origin configured, the sitemap returns 503 rather than inventing a public address. This checkout assumes no hosting project.

The Worker adds a same-origin content policy, denies framing and active objects, disables unused browser permissions and marks HTML private/no-store. React's streamed bootstrap requires inline scripts; executable external content and raw untrusted HTML are not supported. The visitor path makes no third-party data calls.

## Verification boundaries

The observations retain stock versus flow, units, chain, dates and greater-than qualifiers. They are first-party historical reports, not live financial measurements or independent audits. There is no aggregate success score, average D or economy-wide total.

Tests cover canonical integrity, exact identities, uncertainty, expiry, locale completeness, editorial isolation, source/export safety, bounded configuration and server routes. Browser interactions, responsive layouts, accessibility, WebMCP registration and field performance require separate verification in a permitted browser.
