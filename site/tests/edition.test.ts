/**
 * The directory's integration with EDI and its editorial data, at the places
 * where the directory could misrepresent EDI: dates, scope, identity,
 * composition, colors, invalid content and unsafe links. The acceptance cases
 * from the specification are named in the test titles.
 */
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, test} from 'node:test';
import {levelColor} from 'ethereum-decentralization-index';
import {registry, registryAssessment, reviewTiming} from 'ethereum-decentralization-index/registry';
import {buildEdition, DEFAULT_CONTENT_DIR, EditionError} from '../src/build/edition.ts';
import {parseMarkdown} from '../src/content/markdown.ts';
import {runDirectory} from '../src/model/directory.ts';
import {EMPTY_QUERY} from '../src/model/query.ts';
import {observationView} from '../src/model/views.ts';
import {layoutDiagram} from '../src/server/diagram.ts';
import {preparedFor} from '../src/server/directory.ts';
import {catalog} from '../src/server/site.ts';

const REGISTRY_DATE = registry.lastUpdatedAt;
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const mechanism = (id: string, date: string) => catalog.rawOn(id, date).mechanism;

describe('EDI is the only assessment authority', () => {
  test('every record’s stored timeline equals EDI evaluated day by day', () => {
    const days = [
      ...Array.from({length: 75}, (_, i) => addDays(REGISTRY_DATE, i)),
      ...Array.from({length: 110}, (_, i) => addDays(REGISTRY_DATE, 75 + i * 7)),
      '2030-01-01',
      '2099-12-31',
    ];
    for (const object of catalog.objects) {
      for (const day of days) {
        const stored = catalog.rawOn(object.id, day);
        const edi = registryAssessment(object.id, day);
        const timing = reviewTiming(registry.entities.find(entity => entity.id === object.id)!, day);
        assert.equal(stored.mechanism.status, edi.status, `${object.id} ${day}`);
        assert.equal(stored.mechanism.effectiveLevel, edi.effectiveLevel, `${object.id} ${day}`);
        assert.equal(stored.mechanism.knownFloor, edi.knownFloor, `${object.id} ${day}`);
        assert.deepEqual(stored.mechanism.unresolved, [...edi.unresolved], `${object.id} ${day}`);
        assert.equal(stored.mechanism.reviewedAt, edi.reviewedAt, `${object.id} ${day}`);
        assert.deepEqual(stored.review, {permanent: timing.permanent, dueAt: timing.dueAt, overdue: timing.overdue}, `${object.id} ${day}`);
        if (stored.position) {
          const position = registryAssessment(object.id, day, {scope: 'position'});
          assert.equal(stored.position.status, position.status, `${object.id} position ${day}`);
          assert.equal(stored.position.knownFloor, position.knownFloor, `${object.id} position ${day}`);
        }
      }
    }
  });

  test('dates before the registry are evaluated at the registry date', () => {
    assert.deepEqual(catalog.rawOn('usdc', '2020-01-01'), catalog.rawOn('usdc', REGISTRY_DATE));
  });

  test('the grade palette is EDI’s palette', () => {
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
    for (const level of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
      const value = new RegExp(`--d${level}:\\s*(#[0-9a-f]{6})`, 'i').exec(root)?.[1];
      assert.equal(value?.toLowerCase(), levelColor(level).toLowerCase(), `--d${level}`);
    }
    assert.equal(/--dq:\s*(#[0-9a-f]{6})/i.exec(root)?.[1]?.toLowerCase(), levelColor(null).toLowerCase());
  });
});

describe('acceptance cases', () => {
  const date = REGISTRY_DATE;
  const results = (q: string) => runDirectory(preparedFor('en'), {...EMPTY_QUERY, q}, date, 'en');

  test('Search Uniswap: separate cores, the token and the unversioned identity; no brand-wide D0', () => {
    const hits = results('uniswap').objects;
    const ids = hits.map(hit => hit.entry.id);
    for (const id of ['uniswap-v1', 'uniswap-v2', 'uniswap-v3', 'uniswap-v4', 'token:uniswap', 'uniswap']) assert.ok(ids.includes(id), id);
    const brand = hits.find(hit => hit.entry.id === 'uniswap')!;
    assert.equal(brand.state.mechanism.label, 'D?');
    assert.equal(brand.state.mechanism.level, null);
    const labels = new Map(hits.map(hit => [hit.entry.id, hit.state.mechanism.label]));
    assert.notEqual(labels.get('token:uniswap'), labels.get('uniswap-v4'));
  });

  test('Open Uniswap v4: D0 covers the core; unresolved positions get no complete D0', () => {
    const state = catalog.rawOn('uniswap-v4', date);
    assert.equal(state.mechanism.status, 'assessed');
    assert.equal(state.mechanism.effectiveLevel, 0);
    assert.ok(state.position, 'v4 has a separate position assessment');
    assert.notEqual(state.position!.status, 'assessed');
    assert.equal(state.position!.effectiveLevel, null);
  });

  test('Open WETH: only the recorded L1 WETH9 identity carries its assessment', () => {
    const weth = catalog.object('weth9')!;
    assert.deepEqual(weth.deployments.map(d => [d.chainId, d.address.toLowerCase()]), [[1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2']]);
    const byAddress = runDirectory(preparedFor('en'), {...EMPTY_QUERY, q: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'}, date, 'en').objects;
    assert.deepEqual(byAddress.map(hit => hit.entry.id), ['weth9']);
    const elsewhere = runDirectory(preparedFor('en'), {...EMPTY_QUERY, q: '8453:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'}, date, 'en').objects;
    assert.deepEqual(elsewhere, [], 'the same address on another chain is not WETH9');
  });

  test('Inspect a wrapper with own tier zero: dependencies keep the higher floor', () => {
    for (const id of ['wsteth', 'reth', 'weeth']) {
      const state = mechanism(id, date);
      assert.notEqual(state.effectiveLevel, 0, id);
      assert.ok((state.knownFloor ?? 0) >= 3, `${id} keeps its dependency’s floor`);
    }
  });

  test('Inspect Liquity or GLM: incomplete controls stay partial or unknown', () => {
    for (const id of ['liquity-v1', 'liquity-v2']) {
      const state = mechanism(id, date);
      assert.equal(state.effectiveLevel, null, id);
      assert.equal(state.knownFloor, 2, id);
    }
    const golem = mechanism('token:golem', date);
    assert.equal(golem.effectiveLevel, null);
    assert.notEqual(golem.status, 'assessed');
  });

  test('Cross the monthly deadline: a complete grade becomes partial, keeping its floor and review date', () => {
    const before = catalog.rawOn('usdc', '2026-10-31');
    const after = catalog.rawOn('usdc', '2026-11-01');
    assert.equal(before.mechanism.status, 'assessed');
    assert.equal(before.mechanism.effectiveLevel, 9);
    assert.equal(after.mechanism.effectiveLevel, null);
    assert.equal(after.mechanism.knownFloor, 9);
    assert.equal(after.mechanism.reviewedAt, before.mechanism.reviewedAt);
    assert.equal(after.review.overdue, true);
    assert.ok(catalog.changeDates.includes('2026-11-01'));
  });

  test('Revisit permanent D0 later: no expiry by age alone', () => {
    for (const day of ['2027-10-01', '2040-01-01']) {
      const state = catalog.rawOn('weth9', day);
      assert.equal(state.mechanism.effectiveLevel, 0);
      assert.equal(state.review.permanent, true);
      assert.equal(state.review.dueAt, null);
      assert.equal(state.review.overdue, false);
    }
  });

  test('Read a multichain figure: never presented as Ethereum-only', () => {
    for (const observation of catalog.observations.values()) {
      const view = observationView(observation, 'en');
      if (observation.chainIds === 'multichain-unsplit') assert.match(view.chains, /not an Ethereum-only figure/);
    }
  });

  test('every figure has its unit, date and source; stocks have a date and flows an interval', () => {
    for (const observation of catalog.observations.values()) {
      assert.ok(observation.unit && observation.sourceClaimIds.length, observation.id);
      if (observation.measure === 'stock') assert.ok(observation.asOf && !observation.interval, observation.id);
      if (observation.measure === 'flow') assert.ok(observation.interval, observation.id);
      for (const claim of observation.sourceClaimIds) assert.ok(catalog.claims.has(claim), `${observation.id} cites ${claim}`);
    }
  });
});

describe('invalid content never publishes', () => {
  function withContent(edit: (dir: string) => void): () => unknown {
    const dir = mkdtempSync(path.join(tmpdir(), 'edi-content-'));
    cpSync(DEFAULT_CONTENT_DIR, dir, {recursive: true});
    edit(dir);
    return () => {
      try {
        return buildEdition({contentDir: dir});
      } finally {
        rmSync(dir, {recursive: true, force: true});
      }
    };
  }
  const append = (dir: string, file: string, text: string) => writeFileSync(path.join(dir, file), readFileSync(path.join(dir, file), 'utf8') + text);

  test('the shipped content builds', () => {
    assert.doesNotThrow(() => buildEdition());
  });

  test('a grade in editorial frontmatter fails the build', () => {
    const build = withContent(dir => {
      const file = path.join(dir, 'objects', 'weth9.md');
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^---\n/, '---\ngrade: D0\n'));
    });
    assert.throws(build, (error: Error) => error instanceof EditionError && /grade/.test(error.message));
  });

  test('a javascript: source URL fails the build', () => {
    const build = withContent(dir =>
      append(dir, 'claims.yaml', '\n- id: hostile-claim\n  statement: x\n  sourceUrl: javascript:alert(1)\n  publisher: x\n  title: x\n  retrievedAt: 2026-10-01\n  state: capability\n  subjects: [weth9]\n'),
    );
    assert.throws(build, (error: Error) => error instanceof EditionError && /sourceUrl/.test(error.message));
  });

  test('a claim about something that is not an EDI record or known subject fails the build', () => {
    const build = withContent(dir =>
      append(dir, 'claims.yaml', '\n- id: stray-claim\n  statement: x\n  sourceUrl: https://example.com/x\n  publisher: x\n  title: x\n  retrievedAt: 2026-10-01\n  state: capability\n  subjects: [not-a-record]\n'),
    );
    assert.throws(build, (error: Error) => error instanceof EditionError && /not-a-record/.test(error.message));
  });
});

describe('editorial Markdown is inert', () => {
  test('raw HTML, scripts, images and non-https links are rejected', () => {
    for (const source of [
      'Hello <script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '[click](javascript:alert(1))',
      '[mail](mailto:a@b.example)',
      '[local](http://localhost/admin)',
      '![image](https://example.com/a.png)',
      '[ip](https://127.0.0.1/)',
    ]) assert.ok(parseMarkdown(source).errors.length > 0, source);
  });

  test('plain prose, emphasis, https links and tokens parse cleanly', () => {
    const parsed = parseMarkdown('Some *emphasis* and a [link](https://ethereum.org/wrapped-eth/) about {{object:weth9}}.');
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.tokens, [{kind: 'object', id: 'weth9'}]);
  });
});

describe('story diagrams', () => {
  const nodes = [
    {id: 'a', name: 'Circle'},
    {id: 'b', name: 'USDC'},
    {id: 'c', name: 'Ethereum'},
    {id: 'd', name: 'Visa settlement in USDC on several networks'},
  ];
  const edges = [
    {id: 'e1', from: 'a', to: 'b', label: 'issues', kind: 'editorial' as const},
    {id: 'e2', from: 'b', to: 'c', label: 'settles on', kind: 'editorial' as const},
    {id: 'e3', from: 'd', to: 'b', label: 'settles in', kind: 'editorial' as const, tentative: true},
    {id: 'e4', from: 'b', to: 'c', label: 'depends on, for control', kind: 'edi' as const},
  ];

  test('the same story always draws the same diagram', () => {
    assert.deepEqual(layoutDiagram(nodes, edges), layoutDiagram(nodes, edges));
  });

  test('nodes never overlap and stay inside the figure', () => {
    const diagram = layoutDiagram(nodes, edges);
    for (const node of diagram.nodes) {
      assert.ok(node.x >= 0 && node.y >= 0 && node.x + 172 <= diagram.width && node.y + 76 <= diagram.height, node.id);
      for (const other of diagram.nodes)
        if (other !== node) assert.ok(Math.abs(node.x - other.x) >= 172 || Math.abs(node.y - other.y) >= 76, `${node.id} overlaps ${other.id}`);
    }
  });
});
