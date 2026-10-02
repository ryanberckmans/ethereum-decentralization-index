# Code contracts

The guarantees the specification asks the directory to keep. Each is tagged
in the code with `@cc [label:…] <name>` where it is enforced, and checked by
the tests listed here. A tag only makes a guarantee easy to find; the tests
are what show it holds.

| Contract | Enforced in | Checked by |
| --- | --- | --- |
| `edi-is-the-assessment-authority`: grades, floors, statuses and review dates come only from EDI's functions | `src/model/assess.ts` | `edition.test.ts`: every record's timeline equals EDI day by day; `surfaces.test.ts`: exported results are EDI's |
| `canonical-edi-ownership`: editorial content cannot carry or override assessments | `src/model/catalog.ts`, `src/content/validate.ts` | `edition.test.ts`: a grade in frontmatter fails the build |
| `date-correct-assessments`: each page shows EDI's result for the reader's UTC date (read without scripts, the build date's until the next build) | `src/model/assess.ts` | `edition.test.ts`: crossing the deadline, permanent D0; `e2e/dates.spec.ts`: profile and directory after the deadline, a tab open across midnight |
| `no-synthetic-research-renewal`: only a new EDI registry renews a review | `src/model/assess.ts` | `edition.test.ts`: a complete grade becomes partial with its floor and due date; `surfaces.test.ts`: later results are scheduled, not applied |
| `separate-mechanism-position-scope`: mechanism and position grades are never merged | `src/model/assess.ts` | `edition.test.ts` and `e2e/directory.spec.ts`: Uniswap v4's D0 core and D? positions; `surfaces.test.ts`: a missing position is null, never D0 |
| `exact-deployment-identity`: an assessment belongs to one recorded chain and address | `src/model/registry.ts`, `src/model/search.ts` | `edition.test.ts`: only L1 WETH9 carries its assessment; search for Uniswap keeps versions, token and unversioned identity apart |
| `no-grade-promotion-from-missing-data`: unknown stays unknown, partial stays partial | `src/model/directory.ts` | `edition.test.ts`: own-tier-zero wrappers keep the higher floor; Liquity and GLM stay partial or unknown |
| `metric-comparability-and-accounting`: figures stand side by side only when they measure the same thing; nothing is summed or scored | `src/model/compare.ts` | `model.test.ts`: figure comparability; `edition.test.ts`: multichain figures; `e2e/directory.spec.ts`: compare has no overall score |
| `typed-relationship-semantics`: relationships describe economic use and never act as control dependencies | `src/content/schema.ts` | `edition.test.ts`: a relationship posing as a control dependency fails the build |
| `safe-editorial-markdown` (security): content Markdown is inert | `src/content/markdown.ts` | `edition.test.ts`: raw HTML, scripts, images and non-https links are rejected |
| `safe-external-content` (security): links are https with public hosts; exports cannot run formulas | `src/content/schema.ts`, `src/model/csv.ts` | `edition.test.ts`: a `javascript:` source fails the build; `model.test.ts` and `surfaces.test.ts`: spreadsheet exports; `e2e/quality.spec.ts`: external links and exports |
| `bounded-external-work` (security): after load, scripts read only the site's own data files, with a timeout and a version check; no third-party calls | `src/client/fetch.ts` | `e2e/quality.spec.ts`: no request leaves the site, the CSP, no policy violations |
| `restoration-without-side-effects`: the URL alone restores a view, and restoring does nothing else | `src/model/query.ts`, `src/islands/DirectoryApp.tsx` | `model.test.ts`: directory URL state; `e2e/directory.spec.ts`: Back, refresh and new tab, search links, comparisons through Back and refresh |
| `last-valid-edition-survives`: invalid input fails the build instead of publishing | `src/build/edition.ts` | `edition.test.ts`: invalid content never publishes |

## Acceptance cases

The specification's acceptance cases appear by name in the test titles
(`tests/edition.test.ts` and `tests/e2e/`). Two need editorial content that
is not in this edition yet and are not tested: the Morpho story (L1
assessment and Base adoption keep separate deployment scopes) and the BUIDL
integration (UniswapX and v4 stay distinct; announced and observed use stay
distinct). Add their tests with the content.
