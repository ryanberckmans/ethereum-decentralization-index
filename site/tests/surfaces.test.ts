/**
 * The machine-readable surfaces: versioned exports, sitemaps, robots.txt,
 * llms.txt and agents.md. They must carry EDI's results with their scope,
 * date and source, keep mechanism and position apart, and never expose how
 * the site is built.
 */
import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {registry} from 'ethereum-decentralization-index/registry';
import {LOCALES} from '../src/config.ts';
import {agentsMd, llmsTxt, localeSitemap, robotsTxt, sitemapIndex, sitemapPages} from '../src/server/agents.ts';
import {directoryCsv, directoryExport, editionManifest, objectExport, observationsCsv, SCHEMA_VERSION} from '../src/server/exports.ts';
import {catalog} from '../src/server/site.ts';

const ORIGIN = 'https://edi.example';
const DATE = registry.lastUpdatedAt;
const PRIVATE = /\/home\/|\/root\/|file:|\.scratch|Agent-Spec|SKILL\.md|node_modules|\bsrc\/|astro|vite|wrangler|cloudflare/i;

describe('exports', () => {
  const directory = directoryExport(DATE, ORIGIN);

  test('every export names its schema version, edition and evaluation date', () => {
    assert.equal(directory.schemaVersion, SCHEMA_VERSION);
    assert.equal(directory.edition, catalog.edition.id);
    assert.equal(directory.evaluationDate, DATE);
    const manifest = editionManifest(DATE, ORIGIN);
    assert.equal(manifest.edition.ediCommit, catalog.edition.ediCommit);
    assert.ok(manifest.files.every(file => file.url.startsWith(ORIGIN)));
  });

  test('each record’s EDI results are EDI’s, for the stated date, with scope and source', () => {
    assert.equal(directory.records.length, registry.entities.length);
    for (const record of directory.records) {
      const raw = catalog.rawOn(record.id, DATE);
      const m = record.assessment.mechanism;
      assert.equal(m.scope, 'mechanism');
      assert.equal(m.evaluationDate, DATE);
      assert.equal(m.effectiveLevel, raw.mechanism.effectiveLevel, record.id);
      assert.equal(m.knownFloor, raw.mechanism.knownFloor, record.id);
      assert.equal(m.status, raw.mechanism.status, record.id);
      assert.equal(m.source.registryDate, catalog.registryDate);
      // A missing position result is null (not assessed separately), never D0.
      if (raw.position) assert.equal(record.assessment.position?.scope, 'position');
      else assert.equal(record.assessment.position, null);
    }
  });

  test('later results are scheduled, not silently applied', () => {
    const usdc = directory.records.find(record => record.id === 'usdc')!;
    const next = usdc.assessment.scheduled.find(change => change.from === '2026-11-01');
    assert.ok(next, 'usdc lists the 2026-11-01 change');
    assert.equal(next!.mechanism.effectiveLevel, null);
    assert.equal(next!.mechanism.knownFloor, 9);
    assert.equal(usdc.assessment.mechanism.effectiveLevel, 9);
  });

  test('Uniswap v4’s export keeps the core’s D0 apart from its unresolved positions', () => {
    const {assessment} = objectExport(catalog.object('uniswap-v4')!, DATE, ORIGIN).record;
    assert.equal(assessment.mechanism.label, 'D0');
    assert.ok(assessment.position);
    assert.notEqual(assessment.position.status, 'assessed');
    assert.notEqual(assessment.position.label, 'D0');
  });

  test('CSV files are spreadsheet-safe and one row per record', () => {
    const csv = directoryCsv(DATE, ORIGIN);
    const lines = csv.slice(1).trimEnd().split('\r\n');
    assert.equal(csv[0], '\ufeff');
    assert.equal(lines.length, registry.entities.length + 1);
    for (const line of [...lines, ...observationsCsv().split('\r\n')]) assert.doesNotMatch(line, /(^|,)"?[=+@\t\r]/, line.slice(0, 80));
  });

  test('nothing private appears in any export', () => {
    for (const body of [JSON.stringify(directory), JSON.stringify(editionManifest(DATE, ORIGIN)), directoryCsv(DATE, ORIGIN)]) assert.doesNotMatch(body, PRIVATE);
  });
});

describe('crawler and agent files', () => {
  test('robots.txt points at the sitemap index and keeps the data files for pages out', () => {
    const robots = robotsTxt(ORIGIN);
    assert.match(robots, /^Sitemap: https:\/\/edi\.example\/sitemap\.xml$/m);
    assert.match(robots, /^Disallow: \/\*\/directory-index\.json$/m);
    assert.match(robots, /^Disallow: \/\*\/compare-data\.json$/m);
  });

  test('without the public address, robots.txt names no sitemap and links stay relative', () => {
    assert.doesNotMatch(robotsTxt(''), /Sitemap/);
    assert.match(llmsTxt('', DATE), /\]\(\/en\/stories\//);
  });

  test('the sitemap lists every page in every language with alternates', () => {
    const index = sitemapIndex(ORIGIN);
    for (const locale of LOCALES) assert.ok(index.includes(`${ORIGIN}/sitemaps/${locale}.xml`), locale);
    const pages = sitemapPages();
    // Home, stories, two collections, compare, methodology, changes and data, then every story and record.
    assert.equal(pages.length, 8 + catalog.stories.length + catalog.objects.length);
    const ja = localeSitemap(ORIGIN, 'ja');
    assert.equal(ja.match(/<url>/g)?.length, pages.length);
    assert.ok(ja.includes(`<loc>${ORIGIN}/ja/objects/weth9/</loc>`));
    const first = ja.slice(ja.indexOf('<url>'), ja.indexOf('</url>'));
    assert.equal(first.match(/hreflang=/g)?.length, LOCALES.length + 1);
    assert.ok(pages.every(page => /^\d{4}-\d{2}-\d{2}$/.test(page.lastmod)), 'lastmod is a date');
  });

  test('llms.txt and agents.md describe the edition, its dates and how to cite, and nothing private', () => {
    const llms = llmsTxt(ORIGIN, DATE);
    const agents = agentsMd(ORIGIN, DATE);
    assert.match(llms, /^# EDI Directory/);
    assert.ok(llms.includes(catalog.edition.id));
    assert.ok(llms.includes(`evaluated for ${DATE} (UTC)`));
    for (const story of catalog.stories) assert.ok(llms.includes(`${ORIGIN}/en/stories/${story.slug}`), story.slug);
    assert.match(agents, /≥ D3/);
    assert.match(agents, /never edits, stores or overrides/);
    assert.match(agents, /weth9/);
    for (const text of [llms, agents]) {
      assert.doesNotMatch(text, PRIVATE);
      assert.doesNotMatch(text, /\]\(javascript:/i);
    }
  });
});
