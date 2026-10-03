import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessment, assessControlGraph, composeAssessments, describeAssessment, describeL2beat, displayedLevel, l2beat, l2beatProjectUrl, levelColor, levelLabel, locales, normalizeAssessment, rubric, safeEvidenceUrl } from '../dist/core/index.js';
test('core is a standalone, exact projection of the versioned data rubric', async () => {
    assert.deepEqual(rubric, JSON.parse(await readFile(new URL('../data/rubric.json', import.meta.url))));
    assert.equal(rubric.grades.length, 10);
    assert.equal(levelColor(0), '#8bffff');
    assert.equal(levelColor(1), '#32ff81');
    assert.equal(levelColor(99), '#a5b4c4');
    const source = await readFile(new URL('../dist/core/index.js', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from ['"](?:react|radix)|\b(?:fetch|document|window|localStorage)\s*[.(]/);
});
test('actual dependencies compose by maximum control, not addition or an average', () => {
    const path = [{ id: 'l1', label: 'Ethereum', level: 0, reviewedAt: '2026-09-08' }, { id: 'base', label: 'Base', level: 6, dependencies: ['l1'], reviewedAt: '2026-09-20' }, { id: 'usdc', label: 'USDC', level: 9, dependencies: ['base'], reviewedAt: '2026-09-21' }];
    const result = assessControlGraph('usdc', path);
    assert.equal(result.effectiveLevel, 9);
    assert.equal(result.reviewedAt, '2026-09-08');
    assert.equal(levelLabel(result), 'D9');
    assert.equal(composeAssessments([assessment(4), assessment(4)]).effectiveLevel, 4);
});
test('unknown dependency preserves a positive floor and never turns the L1 baseline into certification', () => {
    const partial = assessControlGraph('app', [{ id: 'app', label: 'Unreviewed app', level: null, dependencies: ['base'] }, { id: 'base', label: 'Base', level: 6 }]);
    assert.equal(partial.effectiveLevel, null);
    assert.equal(partial.knownFloor, 6);
    assert.equal(partial.status, 'partial');
    assert.equal(levelLabel(partial), '≥ D6');
    assert.deepEqual(partial.unresolved, ['Unreviewed app']);
    const unknown = composeAssessments([assessment(0), assessment(null, { unresolved: ['Unknown hook'] })]);
    assert.equal(unknown.effectiveLevel, null);
    assert.equal(unknown.knownFloor, 0);
    assert.equal(displayedLevel(unknown), null);
    assert.equal(levelLabel(unknown), 'D?');
});
test('parallel independent paths are not silently treated as reviewed exit alternatives', () => {
    const unknown = assessControlGraph('asset', [{ id: 'asset', label: 'Asset', level: 0, dependencies: ['missing'] }]);
    assert.equal(unknown.status, 'unreviewed');
    assert.deepEqual(unknown.unresolved, ['missing']);
});
test('inconsistent host data cannot erase a known restriction or certify an unknown as D0', () => {
    for (const status of ['assessed', 'partial', 'unreviewed']) {
        const unsafe = { effectiveLevel: 0, knownFloor: 9, status, unresolved: ['Unknown controller'] };
        assert.equal(levelLabel(unsafe), '≥ D9');
        assert.equal(describeAssessment(unsafe).label, '≥ D9');
        assert.equal(composeAssessments([assessment(0), unsafe]).knownFloor, 9);
    }
    const malformed = { effectiveLevel: 99, knownFloor: 0, status: 'assessed', unresolved: [] };
    assert.equal(levelLabel(malformed), 'D?');
    assert.equal(describeAssessment(malformed).uncertainty, locales.en.unknownBody);
    assert.equal(normalizeAssessment({ effectiveLevel: 9, knownFloor: null, status: 'assessed', unresolved: [] }).status, 'partial');
    assert.equal(normalizeAssessment(null).status, 'unreviewed');
    assert.equal(describeAssessment({}).label, 'D?');
    assert.equal(normalizeAssessment(assessment(0)).status, 'assessed');
});
test('malformed, cyclic and unbounded graphs fail explicitly', () => {
    assert.throws(() => assessControlGraph('a', [{ id: 'a', label: 'A', level: 0, dependencies: ['a'] }]), /Cyclic/);
    assert.throws(() => assessControlGraph('a', [{ id: 'a', label: 'A', level: 0 }, { id: 'a', label: 'A', level: 1 }]), /duplicate/);
    assert.throws(() => assessControlGraph('a', [{ id: 'a', label: 'A', level: 10 }]), /Unsupported/);
    assert.throws(() => assessControlGraph('a', [{ id: 'a', label: 'A', level: 0, complete: 'false' }]), /boolean/);
    assert.throws(() => assessment(0, { complete: 'false' }), /boolean/);
    assert.throws(() => assessment(0, { unresolved: 'Unknown hook' }), /unresolved/);
    assert.throws(() => assessControlGraph('a', [{ id: 'a', label: 'A', level: 0, reviewedAt: '2026-02-31' }]), /ISO/);
    const deep = Array.from({ length: 70 }, (_, i) => ({ id: String(i), label: String(i), level: 0, dependencies: i < 69 ? [String(i + 1)] : [] }));
    assert.throws(() => assessControlGraph('0', deep), /64 levels/);
});
test('L1 gets its own foundation message, while D0 apps retain mechanism scope in every locale', () => {
    for (const locale of Object.keys(locales)) {
        assert.equal(locales[locale].tiers.length, 10);
        const l1 = describeAssessment(assessment(0), locale, 'ethereum-l1'), app = describeAssessment(assessment(0), locale);
        assert.notEqual(l1.definition, app.definition);
        assert.equal(l1.definition, locales[locale].l1);
    }
});
test('EDI’s stance on L2BEAT is canonical, translated into every locale and links to L2BEAT itself', () => {
    assert.ok(Object.isFrozen(l2beat));
    assert.equal(l2beat.name, 'L2BEAT');
    assert.equal(safeEvidenceUrl(l2beat.url), 'https://l2beat.com/');
    // The positioning exactly as the project states it.
    assert.equal(locales.en.l2beatBody, 'EDI regards L2BEAT as the authority on scientific risk assessment. EDI complements that work by prioritizing accuracy and storytelling over fine-grained precision: it distills complex decentralization and control considerations into a single, accessible D0–D9 rating.');
    const CJK = '[\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af]';
    for (const [locale, c] of Object.entries(locales)) {
        for (const key of ['l2beatTitle', 'l2beatSummary', 'l2beatBody', 'l2beatScope', 'l2beatLink', 'l2beatProject']) {
            const text = c[key], where = `${locale}.${key}`;
            assert.equal(typeof text, 'string', where);
            assert.ok(text.length > 0 && text === text.trim() && !/ {2}/.test(text), where);
            assert.ok(text.includes('L2BEAT'), `${where} names L2BEAT as written`);
            assert.doesNotMatch(text, /["']/, `${where} uses typographic quotes`);
            if (locale !== 'en') assert.notEqual(text, locales.en[key], `${where} is translated`);
            if (locale === 'zh' || locale === 'ja') assert.doesNotMatch(text, new RegExp(`${CJK}[,;?!]|${CJK}[.:](?!\\w)`), `${where} uses full-width punctuation`);
            if (locale === 'fr') assert.doesNotMatch(text, /\S[:;!?](?=\s|$)/, `${where} spaces French punctuation`);
        }
        for (const key of ['l2beatSummary', 'l2beatBody', 'l2beatScope']) assert.ok(c[key].includes('D0–D9'), `${locale}.${key} names D0–D9`);
        assert.deepEqual(describeL2beat(locale), { name: 'L2BEAT', title: c.l2beatTitle, summary: c.l2beatSummary, body: c.l2beatBody, scope: c.l2beatScope, link: { href: l2beat.url, label: c.l2beatLink } });
    }
    for (const locale of ['xx', '__proto__', 'constructor']) assert.equal(describeL2beat(locale).body, locales.en.l2beatBody, locale);
});
test('an L2BEAT project page among the evidence becomes the link to the detailed assessment; nothing else does', () => {
    const base = 'https://l2beat.com/layer2s/projects/base';
    assert.equal(l2beatProjectUrl(['https://docs.base.org/', base, 'https://l2beat.com/layer2s/projects/optimism']), base);
    assert.equal(l2beatProjectUrl(['https://www.l2beat.com/scaling/projects/base']), 'https://www.l2beat.com/scaling/projects/base');
    assert.deepEqual(describeL2beat('de', [base]).link, { href: base, label: locales.de.l2beatProject });
    for (const evidence of [undefined, null, base, [], ['https://l2beat.com/'], ['https://l2beat.com/scaling/summary'], ['http://l2beat.com/layer2s/projects/base'], ['https://l2beat.com.example.org/projects/x'], ['https://notl2beat.com/projects/x'], ['https://user:secret@l2beat.com/projects/x'], ['javascript://l2beat.com/projects/x'], [null, 7, {}]]) {
        assert.equal(l2beatProjectUrl(evidence), null, String(evidence));
        assert.equal(describeL2beat('en', evidence).link.href, l2beat.url, String(evidence));
    }
});
test('evidence links reject executable protocols and credentials', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'http://example.org', 'https://user:secret@example.org'])
        assert.equal(safeEvidenceUrl(url), null);
    assert.equal(safeEvidenceUrl('https://example.org/evidence'), 'https://example.org/evidence');
});

test('canonical assessments are immutable so normalized reuse cannot hide mutation',()=>{
 const a=assessment(0); assert.ok(Object.isFrozen(a));assert.ok(Object.isFrozen(a.unresolved));assert.throws(()=>{a.knownFloor=9});assert.throws(()=>a.unresolved.push('controller'));assert.equal(normalizeAssessment(a),a);
});

test('sparse arrays preserve missing controls instead of certifying D0',()=>{
 const path=[assessment(0)];path.length=2;assert.equal(levelLabel(composeAssessments(path)),'D?');
 assert.equal(levelLabel(normalizeAssessment({effectiveLevel:0,knownFloor:9,status:'partial',unresolved:new Array(1)})),'≥ D9');
 assert.throws(()=>assessment(0,{unresolved:new Array(1)}));
});

test('malformed graph dependency lists cannot certify a missing controller as D0',()=>{
 for(const dependencies of [null,'controller',[null],new Array(1),['']])assert.throws(()=>assessControlGraph('a',[{id:'a',label:'A',level:0,dependencies}]));
});
