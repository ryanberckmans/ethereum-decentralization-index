# Architecture

The Ethereum Decentralization Index website is an Astro site built into
plain static files: every page in every language, the data files the pages
load, and the exports. Any static
host can serve them ([hosting](hosting.md)). Three sources meet in it, each
with one owner:

| Source | Owner | Holds |
| --- | --- | --- |
| EDI (the repository root: `data/`, `dist/`) | EDI's own review process | Every grade, floor, status, control, dependency, scope and review date |
| `site/content/` | Editors | What objects enable, observations, sources, relationships, stories, collections |
| `site/src/` | This site | How the two are read, combined, translated and shown |

## Build: the edition

`src/build/edition.ts` runs in Node during `astro build` and `astro dev`,
never in the browser. It:

1. loads and validates `content/` against `src/content/schema.ts` and
   cross-checks every reference against the EDI registry
   (`src/content/validate.ts`);
2. checks that the bundled EDI registry matches the hash in EDI's
   `latest.json`, and records the repository commit;
3. evaluates EDI (`src/model/assess.ts`) for every record on the registry
   date and on every later date where a result can change. EDI results only
   change when a review falls due, so a short list of segments per record
   describes every future date exactly.

The result is the edition bundle, a virtual module (`virtual:edi-edition`)
that the pages are built from. Any error fails the build, so a broken import
never replaces the last valid edition.

## Pages: built once, right on any later date

Astro writes one `index.html` per page with React views (`src/views/`)
rendered at build time. Each page is evaluated for the build's UTC date
(`EVALUATION_DATE` in `src/server/site.ts`) and carries every later EDI
result in inert `<template>` elements (`src/components/Dated.tsx`), so a
page served or left open after a review deadline shows EDI's result for the
reader's date without a rebuild and without evaluating anything.

Addresses end with a slash (`/en/objects/weth9/`), the form static hosts give
a directory's `index.html`. Other names for a page are kept working in two
ways. Old slugs, raw EDI IDs that are safe file names (`seaport-v1.6`) and
collection IDs get small redirect pages at build time
(`src/server/redirects.ts`). Everything else that misses, such as a raw ID
with a colon, other capitalizations or an address without a language, lands
on `404.html`, whose script resolves it with `src/model/routing.ts`.

Every page carries a hashed Content-Security-Policy in a `<meta>` tag
(`script-src 'self'` plus the hashes of Astro's and the theme script's inline
code, `style-src 'self'`, `connect-src 'self'`) and a referrer policy. No
page uses inline styles or third-party resources; fonts are self-hosted. The
headers a host should add are in [hosting](hosting.md).

## Browser: small scripts and two islands

- `src/client/theme-init.js`, inline in every page's head: applies the saved
  theme before first paint, and marks the page when its address carries a
  search or a comparison so the built results it would replace stay hidden.
- `src/client/page.ts` on every page: wires the menus, theme and copy
  buttons, remembers a language chosen in the menu (in this browser only)
  and keeps the search when switching, and swaps in the result for the
  reader's UTC date.
- `src/islands/DirectoryApp.tsx` on the directory: search, filters, sort,
  paging and the compare tray, all in the URL. The built page shows the
  editor's order; the island reads a link's search from the address and
  computes results from the active language's compact index
  (`/<locale>/directory-index.json`), loaded once. Without scripts the page
  lists every record.
- `src/islands/CompareApp.tsx` on the compare page: reads `?ids=` from the
  address, loads the index and `/<locale>/compare-data.json` (limits and
  figures), and draws the comparison (`src/components/Comparison.tsx`) for
  the reader's date. Its links and forms stay ordinary GET links and forms
  that the island follows in place.
- `src/client/not-found.ts` on the not-found pages and `src/client/root.ts`
  on the bare root: the address resolution and language choice described
  above.
- `src/client/guide.tsx`, loaded on first click: EDI's own
  `DecentralizationGuide` dialog. Its scroll lock uses a constructable
  stylesheet (`src/client/style-singleton.ts`) because the CSP forbids
  `<style>` elements.

Scripts load only the site's own files (`src/client/fetch.ts`). The first
load of the directory stays under 200 KiB of compressed script and carries
only the active language's strings; EDI's guide, loaded on click, brings
EDI's own translations.

## Read model

`src/model/` is shared by the build, the islands and the tests:

- `registry.ts` and `catalog.ts`: EDI records joined with editorial records,
  with exact deployment identity (chain and address) and slug handling.
- `search.ts`, `directory.ts`, `query.ts`: ranked search with match context,
  facets and URL state that restores exactly through Back, refresh and links.
- `compare.ts`: which observations may stand side by side, and why not.
- `routing.ts`: language choice and what a missing address means.
- `views.ts`, `view-types.ts`: localized view data for grades, observations
  and rows.

## Languages

Interface dictionaries live in `src/i18n/`, one per language, each with the
exact shape of `en.ts` (enforced by `tests/i18n.test.ts`). Counts use plural
rules, lists use each language's conjunction, punctuation comes from the
dictionary, and French marks get no-break spaces. Editorial content is
English in this edition and is marked `lang="en"` on the elements that hold
it. EDI's grade labels and explanations come from EDI's own translations.

## Tests

- `tests/*.test.ts` (Node's test runner): EDI timelines against daily
  evaluation, search identity, address resolution, exports and crawler
  files, dictionaries, and a scan for hidden characters.
- `tests/e2e/*.spec.ts` (Playwright, against `dist/` served as plain files
  by `scripts/serve.ts`): the spec's acceptance cases in a browser, the
  no-script pages, missing addresses, accessibility in both themes, phone
  budgets, the CSP and every language on phone widths.
