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
| `npm run build` | Production build: plain static files in `dist/` |
| `npm run preview` | Serves `dist/` the way a plain static host does |
| `npm run test:e2e` | Browser tests against the built files (build first) |
| `npm run social-cards` | Re-renders `public/social/<locale>.png` |

The [Site workflow](../.github/workflows/site.yml) runs all of the checks on
every pull request that touches the site or EDI's data.

## Pages and data

Every page exists in English (`en`), Spanish (`es`), Brazilian Portuguese
(`pt-BR`), French (`fr`), German (`de`), Simplified Chinese (`zh-CN`),
Japanese (`ja`) and Korean (`ko`). The bare root sends readers to a language
chosen on the site or to their browser's, and lists the languages without
scripts.

| Path | Page |
| --- | --- |
| `/<locale>/` | The directory: search, filters, sort and a compare tray, all in the URL |
| `/<locale>/objects/<slug>/` | A profile: EDI's assessment, what it enables, controls, observations, connections, sources |
| `/<locale>/stories/`, `/<locale>/stories/<slug>/` | Stories of objects in use, with relationship diagrams |
| `/<locale>/collections/d0/`, `/<locale>/collections/global-economy/` | The two collections |
| `/<locale>/compare/?ids=a,b` | Up to four objects side by side, without an overall score |
| `/<locale>/methodology/`, `/<locale>/changes/`, `/<locale>/data/` | How it works, what changed, the exports |

An address with no page gets the not-found page, which sends old, mistyped
and language-less addresses (`/objects/weth9`, `/en/objects/token:uniswap`)
to the page they mean and otherwise suggests matching records.

Machine-readable surfaces: versioned exports under `/data/v1/` (directory,
objects, observations, claims, relationships, stories, edition manifest; CSV
for the directory and observations), `/robots.txt`, `/llms.txt`,
`/agents.md` and, when the build is given the site's public address,
`/sitemap.xml` with per-language sitemaps.

Editorial text is written in English in this edition; pages in other
languages translate the interface and mark English text with `lang="en"`.

## Hosting

The build is plain static files, which any static host can serve.
[Hosting](docs/hosting.md) lists what a host must do and the headers worth
adding. No host has been chosen, and nothing in this repository publishes
the site.

## More

- [Architecture](docs/architecture.md): how EDI, the edition, the built pages and the browser fit together.
- [Hosting](docs/hosting.md): what a static host must do, and the headers worth adding.
- [Code contracts](docs/contracts.md): the guarantees the code keeps and the tests that check them.
- [Content schema](docs/content-schema.md): how to write `content/`.
- [Continuation notes](docs/rebuild-notes.md): decisions and open work for whoever continues.
