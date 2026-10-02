# EDI Directory

The directory of the [Ethereum Decentralization Index](../README.md): what
Ethereum's economic objects let people do, who can change their rules, and
how they connect, in eight languages.

EDI, the package at the root of this repository, is the only assessment
authority. Every grade, floor, partial or unknown status, control and review
date on the site comes from EDI's own date-aware functions; editorial content
in [`content/`](content) adds what objects enable, dated observations,
sources and relationships, and can never change a grade.

## Working on the site

Node 22.18 or later. Everything runs from `site/`:

| Command | Does |
| --- | --- |
| `npm ci` | Installs the pinned dependencies; EDI is linked from `..` |
| `npm run dev` | Development server |
| `npm run content:check` | Validates `content/` against the schema and the EDI registry |
| `npm run typecheck` | TypeScript and Astro diagnostics |
| `npm test` | Unit tests: read model, dates, search, exports, dictionaries |
| `npm run build` | Production build for Cloudflare Workers in `dist/` |
| `npm run preview` | Serves the built Worker in the Workers runtime |
| `npm run test:e2e` | Browser tests against the built Worker (build first) |
| `npm run social-cards` | Re-renders `public/social/<locale>.png` |

The [Site workflow](../.github/workflows/site.yml) runs all of the checks on
every pull request that touches the site or EDI's data.

## Pages and data

Every page exists in English (`en`), Spanish (`es`), Brazilian Portuguese
(`pt-BR`), French (`fr`), German (`de`), Simplified Chinese (`zh-CN`),
Japanese (`ja`) and Korean (`ko`). The bare root redirects by the browser's
language or the reader's saved choice.

| Path | Page |
| --- | --- |
| `/<locale>/` | The directory: search, filters, sort and a compare tray, all in the URL |
| `/<locale>/objects/<slug>` | A profile: EDI's assessment, what it enables, controls, observations, connections, sources |
| `/<locale>/stories/`, `/<locale>/stories/<slug>` | Stories of objects in use, with relationship diagrams |
| `/<locale>/collections/d0`, `/<locale>/collections/global-economy` | The two collections |
| `/<locale>/compare?ids=a,b` | Up to four objects side by side, without an overall score |
| `/<locale>/methodology`, `/<locale>/changes`, `/<locale>/data` | How it works, what changed, the exports |

Machine-readable surfaces: versioned exports under `/data/v1/` (directory,
objects, observations, claims, relationships, stories, edition manifest; CSV
for the directory and observations), `/sitemap.xml` with per-language
sitemaps, `/robots.txt`, `/llms.txt` and `/agents.md`.

Editorial text is written in English in this edition; pages in other
languages translate the interface and mark English text with `lang="en"`.

## Deploying

No deployment is set up, and nothing in this repository publishes the site.

## More

- [Architecture](docs/architecture.md): how EDI, the edition, the Worker and the browser fit together.
- [Code contracts](docs/contracts.md): the guarantees the code keeps and the tests that check them.
- [Content schema](docs/content-schema.md): how to write `content/`.
- [Continuation notes](docs/rebuild-notes.md): decisions and open work for whoever continues.
