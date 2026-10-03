/**
 * Crawler and agent surfaces: robots.txt, the sitemaps, llms.txt and
 * agents.md. All are generated from the edition, so counts, dates and links
 * are always the ones the site serves. They describe the public product
 * only, never how it is built. `origin` is the public address, or '' when
 * the build does not know it: links are then relative, and nothing points at
 * the sitemaps, which are not built.
 */
import {l2beat, locales as ediLocales} from 'ethereum-decentralization-index';
import {DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, PRODUCT, type Locale} from '../config.ts';
import {AGENT_FILES, EXPORTS, localizedPath, paths} from '../model/urls.ts';
import {catalog} from './site.ts';

const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Markdown link text and titles from content: no brackets or line breaks that could change the structure. */
const md = (value: string) => value.replace(/[\r\n]+/g, ' ').replace(/[[\]]/g, '');

interface SitemapPage {
  path: string;
  lastmod: string;
}

/** Every indexable page, as its English path; other locales swap the first segment. */
export function sitemapPages(): SitemapPage[] {
  const edition = catalog.edition;
  const base = [edition.ediRegistryDate, edition.observedThrough ?? ''].sort().at(-1)!;
  const en = DEFAULT_LOCALE;
  const pages: SitemapPage[] = [
    {path: paths.home(en), lastmod: base},
    {path: paths.stories(en), lastmod: base},
    ...(['d0-in-use', 'global-economy'] as const).map(id => ({path: paths.collection(en, id), lastmod: base})),
    {path: paths.compare(en), lastmod: base},
    {path: paths.methodology(en), lastmod: base},
    {path: paths.changes(en), lastmod: base},
    {path: paths.data(en), lastmod: base},
    ...catalog.stories.map(story => ({path: paths.story(en, story.slug), lastmod: story.data.reviewedAt})),
    ...catalog.objects.map(object => ({
      path: paths.object(en, object.slug),
      lastmod: [object.entity.reviewedAt, object.editorial?.data.editorialReviewedAt ?? ''].sort().at(-1)!,
    })),
  ];
  return pages;
}

export function sitemapIndex(origin: string): string {
  const lastmod = sitemapPages().reduce((latest, page) => (page.lastmod > latest ? page.lastmod : latest), '');
  const entries = LOCALES.map(locale => `  <sitemap><loc>${xml(`${origin}/sitemaps/${locale}.xml`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
}

export function localeSitemap(origin: string, locale: Locale): string {
  const urls = sitemapPages().map(page => {
    const alternates = [
      ...LOCALES.map(code => `    <xhtml:link rel="alternate" hreflang="${code}" href="${xml(`${origin}${localizedPath(page.path, code)}`)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(`${origin}${page.path}`)}"/>`,
    ];
    return `  <url>\n    <loc>${xml(`${origin}${localizedPath(page.path, locale)}`)}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n${alternates.join('\n')}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(origin: string): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /*/directory-index.json', 'Disallow: /*/compare-data.json', '', ...(origin ? [`Sitemap: ${origin}${AGENT_FILES.sitemap}`, ''] : [])].join('\n');
}

function editionLines(date: string): string[] {
  const edition = catalog.edition;
  const later = catalog.changeDates.filter(change => change > date);
  return [
    `- Edition ${edition.id}, built from repository commit ${edition.ediCommit.slice(0, 12)}, using the EDI registry dated ${edition.ediRegistryDate}.`,
    `- Grades in this edition’s pages and files are evaluated for ${date} (UTC), the day it was built.${later.length ? ` EDI’s results change on ${later.join(', ')} as reviews fall due: pages show the result for the reader’s date in the browser, and the exports list later results under \`scheduled\`.` : ''}`,
    `- ${catalog.objects.length} EDI records (networks, assets and protocols), ${catalog.objects.filter(object => object.edited).length} edited profiles, ${catalog.stories.length} stories, ${catalog.observations.size} dated figures.`,
  ];
}

export function llmsTxt(origin: string, date: string): string {
  const en = DEFAULT_LOCALE;
  const link = (title: string, path: string, note: string) => `- [${md(title)}](${origin}${path}): ${md(note)}`;
  const edited = catalog.objects.filter(object => object.edited);
  return [
    `# ${PRODUCT.name}`,
    '',
    `> Ethereum's economic objects, what they make possible, and who can change their rules. ${ediLocales.en.l2beatSummary} Every grade comes from EDI's own rubric, registry and functions and is evaluated for a UTC date; profiles, figures and stories are editorial. Listing is not endorsement, a security audit or investment advice.`,
    '',
    ...editionLines(date),
    `- Read [agents.md](${origin}${AGENT_FILES.agents}) before citing a grade or a figure.`,
    '',
    '## Pages',
    '',
    link('Directory', paths.home(en), 'search and filter every EDI record by role, kind, network, grade and review state'),
    link('Methodology', paths.methodology(en), 'what D0 to D9 mean, what is included, what counts as success, coverage, dates and corrections'),
    link('Stories', paths.stories(en), 'sourced accounts of what Ethereum mechanisms make possible'),
    link('D0 in use', paths.collection(en, 'd0-in-use'), 'every mechanism with a complete D0 assessment, and stories about them'),
    link('The global economy on Ethereum', paths.collection(en, 'global-economy'), 'dollars, funds, exchanges and settlement at every D level'),
    link('Compare', paths.compare(en), 'up to four records side by side, for example ?ids=usdc,weth9'),
    link('Changes', paths.changes(en), 'dated content changes and the grade changes scheduled by EDI review dates'),
    link('Data', paths.data(en), 'versioned JSON and CSV exports'),
    '',
    '## Data',
    '',
    link('Edition manifest', EXPORTS.edition, 'provenance, evaluation date and the list of files'),
    link('Directory (JSON)', EXPORTS.directoryJson, 'every record with its EDI results, scope, networks and deployments'),
    link('Directory (CSV)', EXPORTS.directoryCsv, 'one row per record'),
    link('Observations (JSON)', EXPORTS.observationsJson, 'dated figures with unit, time basis, scope and sources'),
    link('Claims (JSON)', EXPORTS.claimsJson, 'sourced claims with evidence labels'),
    link('Connections (JSON)', EXPORTS.relationshipsJson, 'typed editorial connections, which never change EDI results'),
    link('Stories (JSON)', EXPORTS.storiesJson, 'stories with thesis, objects and plain text'),
    `- One record: ${origin}${EXPORTS.object('{slug}')}, where {slug} is the last part of a profile URL`,
    '',
    '## Stories',
    '',
    ...catalog.stories.map(story => link(story.data.title, paths.story(en, story.slug), story.data.dek)),
    '',
    '## Edited profiles',
    '',
    ...edited.map(object => link(object.name, paths.object(en, object.slug), object.summary ?? object.entity.scope)),
    '',
    '## Optional',
    '',
    ...(origin ? [link('Sitemap', AGENT_FILES.sitemap, 'every page in every language')] : []),
    `- [${PRODUCT.shortName} on GitHub](${PRODUCT.repository}): EDI's rubric, registry and functions`,
    '',
  ].join('\n');
}

export function agentsMd(origin: string, date: string): string {
  const en = DEFAULT_LOCALE;
  const example = catalog.object('weth9') ?? catalog.objects[0];
  const raw = catalog.rawOn(example.id, date);
  const label = raw.mechanism.status === 'assessed' ? `D${raw.mechanism.effectiveLevel}` : 'its label';
  return [
    `# ${PRODUCT.name}: notes for agents`,
    '',
    `The ${PRODUCT.name} (${PRODUCT.shortName}) site lists every record in the EDI registry, explains what some of them make possible with sourced evidence, and shows who can change their rules using EDI's grades. Site: ${origin}${paths.home(en)}`,
    '',
    ...editionLines(date),
    '',
    '## Grades',
    '',
    '- EDI is the only source of grades. The site computes each grade with EDI’s own functions for a UTC date and never edits, stores or overrides one.',
    `- ${ediLocales.en.l2beatBody} ${ediLocales.en.l2beatScope} L2BEAT’s detailed risk assessments: ${l2beat.url}. Where EDI cites an L2BEAT project page for a record, the record’s evidence links include it.`,
    '- D0 to D9 answer one question: who can change the rules for holding or withdrawing assets in this exact mechanism. D0 starts with Ethereum L1; higher numbers add control by administrators, councils, operators or issuers. The methodology page has EDI’s definition of each level.',
    '- “≥ D3” is a partial assessment: at least D3, and an unreviewed part may add more control. “D?” means the review is missing or incomplete. Neither is D0, and neither means safe or unsafe.',
    '- A mechanism grade covers the reviewed contracts or network. A position grade, where EDI has one, covers what a holder has inside it. A grade never carries over to tokens, positions, businesses or applications built on the mechanism.',
    '- Grades are not safety scores, return forecasts or rankings, and the site computes no overall score.',
    '- Monthly reviews fall due on a date. When a review is overdue, EDI’s functions may turn a complete grade into a partial one. Always state the evaluation date with a grade.',
    '',
    '## Citing',
    '',
    'Give the record name and EDI ID, the label exactly as shown, the scope, the evaluation date and the edition. For example:',
    '',
    `> ${example.name} (EDI record \`${example.id}\`): ${label}, mechanism grade evaluated for ${date} (UTC), ${PRODUCT.name} edition ${catalog.edition.id}. ${origin}${paths.object(en, example.slug)}`,
    '',
    'Link to the profile, or to the record’s JSON for machine use. Editorial statements carry their own sources; cite the source, not just this site.',
    '',
    '## Figures',
    '',
    '- Every figure has a unit, an as-of date or an interval, chain and entity scope, a definition and at least one source.',
    '- Stocks (a balance on a date) and flows (activity over an interval) are different kinds of quantity. Do not add, average or rank figures, and do not compare figures outside one comparison group with the same unit, time basis and chain scope.',
    '- Evidence labels distinguish a documented capability, an announcement, a pilot, live availability, reported adoption, an independently reproduced observation and a forecast. Keep the label when you repeat a claim.',
    '',
    '## Data',
    '',
    `- Manifest: ${origin}${EXPORTS.edition}`,
    `- Records: ${origin}${EXPORTS.directoryJson} and ${origin}${EXPORTS.directoryCsv}`,
    `- One record: ${origin}${EXPORTS.object(example.slug)}`,
    `- Figures: ${origin}${EXPORTS.observationsJson} and ${origin}${EXPORTS.observationsCsv}`,
    `- Claims, connections, stories: ${origin}${EXPORTS.claimsJson}, ${origin}${EXPORTS.relationshipsJson}, ${origin}${EXPORTS.storiesJson}`,
    '- Every export has `schemaVersion`, `edition` and `evaluationDate`. EDI results are projections with the record ID, scope, evaluation date and source revision; `scheduled` lists the results EDI’s review dates bring later. Files change only when the site is rebuilt; please cache them.',
    '- No key or account is needed. Search and compare pages are computed in the browser from the same data, so read the exports rather than crawling search or compare URLs.',
    '',
    '## Addresses',
    '',
    `- Profiles: ${origin}/{locale}/objects/{slug}/, for example ${origin}${paths.object(en, example.slug)}. Each record’s slug is in the directory export; it is usually the EDI ID with \`:\` written as \`--\` and \`.\` as \`-\`.`,
    `- Search: ${origin}${paths.home(en)}?q=uniswap. Filters: role, kind, network, grade, atleast, review, story.`,
    `- Compare: ${origin}${paths.compare(en)}?ids=usdc,weth9 (up to four).`,
    `- Languages: ${LOCALES.map(locale => `${locale} (${LOCALE_NAMES[locale]})`).join(', ')}. The interface is translated; editorial text is in English in every language.`,
    '',
    '## Corrections',
    '',
    `- Grades are corrected in EDI itself: ${PRODUCT.repository}`,
    `- Report an editorial error: ${PRODUCT.repository}/issues. Dated corrections are listed at ${origin}${paths.changes(en)}`,
    '',
  ].join('\n');
}

