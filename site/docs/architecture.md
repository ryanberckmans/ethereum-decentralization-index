# Architecture

The directory is an Astro site rendered on request by one Cloudflare Worker.
Three sources meet in it, each with one owner:

| Source | Owner | Holds |
| --- | --- | --- |
| EDI (the repository root: `data/`, `dist/`) | EDI's own review process | Every grade, floor, status, control, dependency, scope and review date |
| `site/content/` | Editors | What objects enable, observations, sources, relationships, stories, collections |
| `site/src/` | This site | How the two are read, combined, translated and shown |

## Build: the edition

`src/build/edition.ts` runs in Node during `astro build` and `astro dev`,
never in the Worker or the browser. It:

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
compiled into the Worker. Any error fails the build, so a broken import never
replaces the last valid edition.

## Request: the Worker

`src/middleware.ts` normalizes URLs (language choice at the bare root,
canonical slugs, old IDs), then the page renders with React views
(`src/views/`) on the server. Each request is evaluated for its UTC date:
`src/model/catalog.ts` picks the edition segment that applies, so grades,
overdue reviews and D0 lists are right on the day they change without a new
build. Pages carry a 5-minute cache, data exports at most an hour and never
past UTC midnight.

The middleware adds the security headers; Astro adds a hashed
Content-Security-Policy (`script-src 'self'` plus the theme script's hash,
`style-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`). No page
uses inline styles or third-party resources; fonts are self-hosted.

## Browser: three small scripts

- `src/client/page.ts` on every page: applies the theme and language choice,
  wires the menus and copy buttons, and swaps in the result for the reader's
  UTC date. Dated markup (`src/components/Dated.tsx`) ships later results in
  inert `<template>` elements, so a cached page or a tab left open past a
  deadline shows EDI's result for today without evaluating anything.
- `src/islands/DirectoryApp.tsx` on the directory only: live search, filters,
  sort, paging and the compare tray. The server renders the same results
  first, so the page works without scripts; the island fetches the active
  language's compact index (`/<locale>/directory-index.json`) once.
- `src/client/guide.tsx`, loaded on first click: EDI's own
  `DecentralizationGuide` dialog. Its scroll lock uses a constructable
  stylesheet (`src/client/style-singleton.ts`) because the CSP forbids
  `<style>` elements.

The first load of the directory stays under 200 KiB of compressed script and
carries only the active language's strings; EDI's guide, loaded on click,
brings EDI's own translations.

## Read model

`src/model/` is shared by the server, the island and the tests:

- `registry.ts` and `catalog.ts`: EDI records joined with editorial records,
  with exact deployment identity (chain and address) and slug handling.
- `search.ts`, `directory.ts`, `query.ts`: ranked search with match context,
  facets and URL state that restores exactly through Back, refresh and links.
- `compare.ts`: which observations may stand side by side, and why not.
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
  evaluation, search identity, exports and crawler files, dictionaries, and a
  scan for hidden characters.
- `tests/e2e/*.spec.ts` (Playwright, against the built Worker): the spec's
  acceptance cases in a browser, accessibility in both themes, phone budgets,
  security headers and every language on phone widths.
