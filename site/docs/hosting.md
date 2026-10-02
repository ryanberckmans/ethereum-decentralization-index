# Hosting

`npm run build` writes plain files to `site/dist/`: one `index.html` per page
(`/en/objects/weth9/index.html`), the data files and exports, and `404.html`.
Nothing runs on a server, so any static host, or a CDN in front of object
storage, can serve the site. No host has been chosen, and the repository has
no deployment set up for any.

## Build

From `site/`, with Node 22.18 or later: `npm ci`, then `npm run build`. The
output is `site/dist/`.

- `PUBLIC_SITE_URL` (optional) is the site's public origin, such as
  `https://directory.example.org`, served from the root of its host. With it,
  canonical and language links, social cards, structured data, sitemaps and
  the links in exports and agent files are absolute. Without it they are
  relative to whichever host serves the files, social cards have no image,
  and no sitemaps are built (they must be absolute).
- The build evaluates EDI for its own UTC date. Pages stay right without a
  rebuild: they carry every later EDI result and switch to it in the browser
  on the day it applies. The exports and agent files state the date they
  were evaluated for and list later results under `scheduled`. Rebuild when
  EDI or the content changes, and after a review date passes if the exports
  should be evaluated for a later date.

## What the host must do

1. Serve `dist/` at the root of the origin.
2. Answer a directory's address with its `index.html` (`/en/` serves
   `/en/index.html`), and redirect an address without the trailing slash to
   the one with it (`/en/objects/weth9` to `/en/objects/weth9/`). Most static
   hosts do both by default.
3. Serve `404.html`, with status 404, for any address without a file. Its
   script sends old, mistyped and locale-less addresses to the page they mean
   (`/en/objects/token:uniswap`, `/EN/objects/weth9/`, `/objects/weth9`), and
   readers of another language to the not-found page in theirs.
4. Serve each file with the content type its extension implies, text as
   UTF-8: `.html`, `.js`, `.css`, `.json`, `.csv` (`text/csv`), `.txt`, `.md`
   (`text/markdown`), `.xml`, `.svg`, `.png` and `.woff2`.

The bare root `/` picks the reader's language in the browser (a choice made
on the site, then the browser's languages) and lists the languages without
scripts. A host that can redirect by `Accept-Language` may send `/` to
`/<locale>/` itself with the same rules (`src/model/routing.ts`), as a 302
with `Vary: Accept-Language`.

## Headers worth adding

Every page carries its own Content-Security-Policy and referrer policy in
`<meta>` tags, so it is safe without any header. A host that can set
headers should add these:

| Header | On | Why |
| --- | --- | --- |
| `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY` | HTML | Browsers ignore `frame-ancestors` in a `<meta>` policy; this keeps other sites from framing the pages |
| `X-Content-Type-Options: nosniff` | everything | Files are used only as their declared type |
| `Strict-Transport-Security: max-age=31536000` | everything, over HTTPS | Browsers keep to HTTPS |
| `Access-Control-Allow-Origin: *` | `/data/` | Other sites' scripts can read the exports |
| `Content-Disposition: attachment` | `/data/v1/*.csv` | Spreadsheet exports download instead of opening as text |
| `Cache-Control: public, max-age=31536000, immutable` | `/_astro/` | File names carry a hash of their content |
| `Cache-Control: no-cache`, or a short `max-age` | everything else | A rebuild replaces these files in place |

## Checking a host

`npm run preview` serves `dist/` as the steps above describe
(`scripts/serve.ts`), and the browser tests run against it. On a real host,
check that `/` reaches a language, `/en/objects/weth9` reaches
`/en/objects/weth9/`, `/en/objects/token:uniswap` reaches
`/en/objects/token--uniswap/`, `/en/objects/nothing/` answers 404 with the
not-found page, and `/data/v1/directory.csv` arrives as CSV.
