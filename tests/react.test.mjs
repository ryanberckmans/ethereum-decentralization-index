import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { assessment } from '../dist/core/index.js';
import { DecentralizationBadge, DecentralizationCard, DecentralizationLegend, DecentralizationSpectrum } from '../dist/react/index.js';
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
test('standalone badges remain explicit help buttons for known, partial and unknown states', () => {
    for (const [value, label] of [[0, 'D0'], [assessment(6, { complete: false }), '≥ D6'], [null, 'D?'], [99, 'D?']]) {
        const html = render(DecentralizationBadge, { value });
        assert.match(html, /<button/);
        assert.ok(html.includes(label));
        assert.match(html, /aria-label=/);
        assert.match(html, /type="button"/);
    }
});
test('untrusted position labels are text, and a standalone card retains its theme scope', () => {
    const html = render(DecentralizationCard, { title: '<img src=x onerror=alert(1)>', value: assessment(0), subject: 'ethereum-l1' });
    assert.ok(html.includes('&lt;img'));
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /edi-provider/);
    assert.match(html, /shared foundation/);
});
test('standalone badges remain valid inline content and safely display inconsistent serialized ratings', () => {
    const value = { effectiveLevel: 0, knownFloor: 9, status: 'partial', unresolved: ['Unknown controller'] };
    const html = renderToStaticMarkup(React.createElement('p', null, 'Your position ', React.createElement(DecentralizationBadge, { value }), '.'));
    assert.match(html, /^<p>Your position <span/);
    assert.doesNotMatch(html, /<div/);
    assert.match(html, /≥ D9/);
    const malformed = render(DecentralizationBadge, { value: { effectiveLevel: 99, knownFloor: null, status: 'assessed', unresolved: [] } });
    assert.match(malformed, /D\?/);
});
test('spectrum and legend provide all ten accessible grade explanations in a selected locale', () => {
    const spectrum = render(DecentralizationSpectrum, { locale: 'ja' }), legend = render(DecentralizationLegend, { locale: 'es' });
    assert.equal((spectrum.match(/<button/g) ?? []).length, 10);
    assert.equal((legend.match(/<button/g) ?? []).length, 10);
    assert.match(spectrum, /D9/);
    assert.match(legend, /Máxima descentralización/);
});
