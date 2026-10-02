/**
 * Pure rules at the directory's failure boundaries: URL state, comparison,
 * spreadsheet exports, language choice and redirects.
 */
import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import type {Observation} from '../src/content/schema.ts';
import {compareObservations, incompatibility, parseCompareParams} from '../src/model/compare.ts';
import {csvCell, toCsv} from '../src/model/csv.ts';
import {cleanText, EMPTY_QUERY, parseDirectoryQuery, serializeDirectoryQuery} from '../src/model/query.ts';
import {findObject, localeForTag, localeOfPath, negotiateLocale, resolveMissing, wordsOfPath, type KnownPages} from '../src/model/routing.ts';

const validators = {network: (id: string) => ['ethereum', 'base'].includes(id), object: (id: string) => ['usdc', 'weth9', 'uniswap-v4', 'token:uniswap'].includes(id)};
const parse = (search: string) => parseDirectoryQuery(new URLSearchParams(search), validators);

describe('directory URL state', () => {
  test('equivalent states serialize to one canonical query string', () => {
    const a = parse('kind=protocol,asset&grade=D3,d0&review=partial&q=lend%20dollars&compare=usdc,weth9').query;
    const b = parse('compare=usdc&compare=weth9&q=lend+dollars&review=partial&grade=0&grade=3&kind=asset&kind=protocol').query;
    assert.equal(serializeDirectoryQuery(a), serializeDirectoryQuery(b));
    assert.equal(serializeDirectoryQuery(a), 'q=lend+dollars&kind=asset,protocol&grade=d0,d3&review=partial&compare=usdc,weth9');
  });

  test('a canonical string reads back to the same state', () => {
    const search = 'q=weth&role=wrapper&network=base,ethereum&atleast=d5&story=1&sort=name&page=2&compare=token:uniswap';
    const {query, invalid} = parse(search);
    assert.deepEqual(invalid, []);
    assert.equal(serializeDirectoryQuery(query), search.replace('network=base,ethereum', 'network=base,ethereum'));
    assert.deepEqual(parse(serializeDirectoryQuery(query)).query, query);
  });

  test('defaults are omitted and the empty state is the bare page', () => {
    assert.equal(serializeDirectoryQuery(EMPTY_QUERY), '');
    assert.equal(serializeDirectoryQuery(parse('sort=editorial&page=1').query), '');
    assert.equal(serializeDirectoryQuery(parse('q=usdc&sort=relevance').query), 'q=usdc');
  });

  test('the empty sort the form sends for the default order means best match for a search', () => {
    const {query, invalid} = parse('q=usdc&atleast=&sort=');
    assert.deepEqual(invalid, []);
    assert.equal(query.sort, null);
    assert.equal(serializeDirectoryQuery(query), 'q=usdc');
  });

  test('unknown values are reported, never guessed, and the rest still applies', () => {
    const {query, invalid} = parse('kind=bank&grade=d10&atleast=d0&page=999&sort=hot&compare=not-a-record&network=solana&role=wrapper');
    assert.deepEqual(invalid, ['kind', 'network', 'grade', 'atleast', 'sort', 'page', 'compare']);
    assert.deepEqual(query.role, ['wrapper']);
    assert.deepEqual(query.kind, []);
    assert.equal(query.page, 1);
  });

  test('comparison selections are capped at four objects', () => {
    const {query, invalid} = parse('compare=usdc,weth9,uniswap-v4,token:uniswap,usdc');
    assert.equal(query.compare.length, 4);
    assert.deepEqual(invalid, []);
  });

  test('hostile text is neutralized and bounded', () => {
    assert.equal(cleanText('  uni\u202eswap\u0000 v4\u200b '), 'uni swap v4');
    const {query, invalid} = parse(`q=${'a'.repeat(200)}`);
    assert.equal(query.q.length, 120);
    assert.deepEqual(invalid, ['q']);
    const huge = parse(`q=${'x'.repeat(3000)}&kind=asset`);
    assert.deepEqual(huge.query.kind, []);
    assert.deepEqual(huge.invalid, ['q', 'kind']);
  });
});

function observation(overrides: Partial<Observation>): Observation {
  return {
    id: 'o',
    subjectId: 'usdc',
    metric: 'Supply',
    metricDefinition: 'Tokens outstanding',
    value: '100',
    unit: 'USD',
    asOf: '2026-09-30',
    chainIds: [1],
    scope: 'Ethereum mainnet',
    sourceClaimIds: ['c'],
    measure: 'stock',
    comparisonGroup: 'dollar-supply',
    ...overrides,
  } as Observation;
}

describe('figure comparability', () => {
  test('a stock and a flow are never comparable', () => {
    const stock = observation({id: 'a'});
    const flow = observation({id: 'b', subjectId: 'weth9', measure: 'flow', asOf: undefined, interval: {start: '2026-09-01', end: '2026-09-30'}});
    const kinds = incompatibility(stock, flow).map(reason => reason.kind);
    assert.ok(kinds.includes('measure'));
    assert.ok(kinds.includes('timeBasis'));
    const result = compareObservations(['usdc', 'weth9'], [stock, flow]);
    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0].comparable, false);
  });

  test('matching unit, measure, chain scope and date is comparable', () => {
    const result = compareObservations(['usdc', 'weth9'], [observation({id: 'a'}), observation({id: 'b', subjectId: 'weth9'})]);
    assert.equal(result.groups[0].comparable, true);
    assert.deepEqual(result.groups[0].reasons, []);
    assert.equal(result.groups[0].metric, 'Supply');
  });

  test('a multichain total is never set against a single chain', () => {
    const reasons = incompatibility(observation({id: 'a'}), observation({id: 'b', chainIds: 'multichain-unsplit'}));
    assert.deepEqual(reasons.map(reason => reason.kind), ['multichain']);
  });

  test('dates apart, units and rate periods are named', () => {
    assert.deepEqual(incompatibility(observation({id: 'a'}), observation({id: 'b', asOf: '2026-08-31'})), [{kind: 'dates', days: 30}]);
    assert.deepEqual(incompatibility(observation({id: 'a'}), observation({id: 'b', unit: 'EUR'})).map(r => r.kind), ['unit']);
    const rate = observation({id: 'a', measure: 'rate', ratePeriod: 'year'});
    assert.deepEqual(incompatibility(rate, observation({id: 'b', measure: 'rate', ratePeriod: 'month'})).map(r => r.kind), ['rate']);
  });

  test('figures without a shared editor group stay separate, newest first, and nothing is summed', () => {
    const result = compareObservations(
      ['usdc', 'weth9'],
      [observation({id: 'a', comparisonGroup: undefined}), observation({id: 'b', comparisonGroup: undefined, asOf: '2026-10-01'}), observation({id: 'c', subjectId: 'weth9'})],
    );
    assert.deepEqual(result.groups, []);
    assert.deepEqual(result.separate[0].map(o => o.id), ['b', 'a']);
    assert.deepEqual(result.separate[1].map(o => o.id), ['c']);
  });

  test('the latest observations in a group represent each object', () => {
    const result = compareObservations(
      ['usdc', 'weth9'],
      [observation({id: 'old', asOf: '2026-01-01'}), observation({id: 'new'}), observation({id: 'w', subjectId: 'weth9'})],
    );
    assert.deepEqual(result.groups[0].cells.map(cell => cell.map(o => o.id)), [['new'], ['w']]);
    assert.deepEqual(result.separate[0].map(o => o.id), ['old']);
  });
});

describe('compare parameters', () => {
  const ids = new Map([['usdc', 'usdc'], ['weth9', 'weth9'], ['weth', 'weth9'], ['uniswap-v4', 'uniswap-v4'], ['token:uniswap', 'token:uniswap'], ['token--uniswap', 'token:uniswap'], ['eth', 'native-eth'], ['ethereum', 'ethereum']]);
  const resolve = (value: string) => ids.get(value);
  const read = (search: string) => parseCompareParams(new URLSearchParams(search), resolve, 4);

  test('slugs resolve to EDI IDs, duplicates collapse and names are never guessed', () => {
    const result = read('ids=weth,weth9,usdc,Circle');
    assert.deepEqual(result.ids, ['weth9', 'usdc']);
    assert.deepEqual(result.unknown, ['Circle']);
    assert.equal(result.canonical, 'ids=weth9,usdc');
  });

  test('more than four is truncated and reported', () => {
    const result = read('ids=usdc,weth9,uniswap-v4,token:uniswap,eth');
    assert.equal(result.ids.length, 4);
    assert.equal(result.truncated, true);
  });

  test('a chosen pair moves to the front; the view is kept', () => {
    const result = read('ids=usdc,weth9,uniswap-v4&left=uniswap-v4&right=usdc&view=table');
    assert.deepEqual(result.ids, ['uniswap-v4', 'usdc', 'weth9']);
    assert.equal(result.canonical, 'ids=uniswap-v4,usdc,weth9&view=table');
  });

  test('the add control appends one object', () => {
    assert.deepEqual(read('ids=usdc&add=token--uniswap').ids, ['usdc', 'token:uniswap']);
  });
});

describe('spreadsheet exports', () => {
  test('cells that a spreadsheet would run as formulas are neutralized', () => {
    for (const hostile of ['=HYPERLINK("https://evil.example")', '+cmd|calc', '@SUM(A1)', '-2+3', '\t=1', '\r=1']) assert.ok(csvCell(hostile).replace(/^"/, '').startsWith("'"), hostile);
  });

  test('plain numbers, including negatives, stay numbers', () => {
    assert.equal(csvCell('-12.5'), '-12.5');
    assert.equal(csvCell(42), '42');
    assert.equal(csvCell('0.000001'), '0.000001');
  });

  test('quotes, commas and line breaks are quoted; the file has a BOM and CRLF', () => {
    assert.equal(csvCell('a "b", c'), '"a ""b"", c"');
    const file = toCsv([{a: 'x\ny'}], [['A', row => row.a]]);
    assert.equal(file, '\ufeffA\r\n"x\ny"\r\n');
  });
});

describe('language choice', () => {
  test('tags map to supported locales without crossing scripts', () => {
    assert.equal(localeForTag('pt'), 'pt-BR');
    assert.equal(localeForTag('pt-PT'), 'pt-BR');
    assert.equal(localeForTag('zh-Hans-CN'), 'zh-CN');
    assert.equal(localeForTag('zh-TW'), undefined);
    assert.equal(localeForTag('zh-Hant'), undefined);
    assert.equal(localeForTag('KO-kr'), 'ko');
    assert.equal(localeForTag('*'), undefined);
  });

  test('a remembered choice wins, then quality order, then English', () => {
    assert.equal(negotiateLocale('ja', 'de'), 'ja');
    assert.equal(negotiateLocale('xx', 'de-CH, fr;q=0.9'), 'de');
    assert.equal(negotiateLocale(undefined, 'zh-TW, fr;q=0.5, ja;q=0.8'), 'ja');
    assert.equal(negotiateLocale(undefined, 'ja;q=0, es;q=0.1'), 'es');
    assert.equal(negotiateLocale(undefined, 'nl, sv'), 'en');
    assert.equal(negotiateLocale(undefined, null), 'en');
    assert.equal(negotiateLocale(undefined, `${'x,'.repeat(2000)}fr`), 'en');
  });
});

describe('missing addresses', () => {
  const known: KnownPages = {
    objects: [
      {id: 'weth9', slug: 'weth9'},
      {id: 'token:uniswap', slug: 'token--uniswap'},
      {id: 'seaport-v1.6', slug: 'seaport-v1-6'},
    ],
    stories: [{id: 'dollars', slug: 'dollars-on-ethereum'}],
  };
  const at = (path: string) => resolveMissing(path, 'fr', known);

  test('locale-less pages take the reader’s language; the bare section names lead to their pages', () => {
    assert.deepEqual(at('/objects/weth9'), {locale: 'fr', path: '/fr/objects/weth9/'});
    assert.deepEqual(at('/compare'), {locale: 'fr', path: '/fr/compare/'});
    assert.deepEqual(at('/stories/dollars-on-ethereum'), {locale: 'fr', path: '/fr/stories/dollars-on-ethereum/'});
  });

  test('locale casing and a missing trailing slash lead to the canonical page', () => {
    assert.deepEqual(at('/EN/objects/weth9/'), {locale: 'en', path: '/en/objects/weth9/'});
    assert.deepEqual(at('/pt-br'), {locale: 'pt-BR', path: '/pt-BR/'});
    assert.deepEqual(at('/zh-cn/stories'), {locale: 'zh-CN', path: '/zh-CN/stories/'});
    assert.deepEqual(at('/de/collections/d0-in-use'), {locale: 'de', path: '/de/collections/d0/'});
  });

  test('raw EDI IDs, the earlier -- form and capitalized slugs lead to the profile', () => {
    assert.deepEqual(at('/en/objects/token:uniswap'), {locale: 'en', path: '/en/objects/token--uniswap/'});
    assert.deepEqual(at('/en/objects/token%3Auniswap/'), {locale: 'en', path: '/en/objects/token--uniswap/'});
    assert.deepEqual(at('/en/objects/WETH9'), {locale: 'en', path: '/en/objects/weth9/'});
    assert.deepEqual(at('/ja/objects/seaport-v1.6'), {locale: 'ja', path: '/ja/objects/seaport-v1-6/'});
    assert.deepEqual(at('/en/stories/dollars'), {locale: 'en', path: '/en/stories/dollars-on-ethereum/'});
  });

  test('anything else is missing, in the language of the address or else the reader’s', () => {
    assert.deepEqual(at('/en/objects/uniswap-v9'), {locale: 'en'});
    assert.deepEqual(at('/de/objects/weth9/extra'), {locale: 'de'});
    assert.deepEqual(at('/wp-admin'), {locale: 'fr'});
    assert.equal(localeOfPath('/KO/stories/'), 'ko');
    assert.equal(localeOfPath('/nl/'), undefined);
  });

  test('names and tickers are not identities', () => {
    assert.equal(findObject('Wrapped Ether', known.objects), undefined);
    assert.equal(findObject('TOKEN--UNISWAP', known.objects)?.id, 'token:uniswap');
  });

  test('the words of a missing address become a search', () => {
    assert.equal(wordsOfPath('/en/objects/uniswap-v9/', 120), 'uniswap v9');
    assert.equal(wordsOfPath('/en/objects/token%3Auniswap', 120), 'token uniswap');
    assert.equal(wordsOfPath('/de/', 120), '');
    assert.equal(wordsOfPath('/en/stories/', 120), '');
  });
});
