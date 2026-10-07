import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {registry, findReview, reconcileInventory, validateInventory} from '../dist/registry/index.js';
const date = '2026-10-07';
const object = (entityId, kind = 'protocol', extra = {}) => ({id: entityId, entityId, kind, name: entityId, scope: 'mechanism', sources: [], dependencies: [], ...extra});
const inventory = (...objects) => ({schemaVersion: 1, consumer: 'example', objects});

test('missing Lighter chain cannot borrow a similarly named product review', () => {
  const input = inventory(object('lighter', 'chain'), object('lighter-robinhood-perps', 'chain'));
  const before = JSON.stringify(registry), result = reconcileInventory(input, date);
  assert.deepEqual(result.coverage.map(r => r.canonicalId), [null, null]);
  assert.deepEqual(result.tasks.map(r => r.reasons), [['missing-review'], ['kind-mismatch']]);
  assert.equal(JSON.stringify(registry), before);
});
test('permanent D0 is scoped to the exact deployment; catch-up never transfers it across chains', () => {
  const weth = findReview('weth9'), canonical = {chain: 'ethereum', chainId: 1, address: weth.canonicalAddresses['1']};
  const rows = [object('weth9', 'asset', {deployment: canonical}),
    object('weth9', 'asset', {id: 'weth-base', deployment: {...canonical, chain: 'base', chainId: 8453}}),
    object('weth9', 'asset', {id: 'weth-other', deployment: {...canonical, address: '0x' + '1'.repeat(40)}}),
    object('weth9', 'asset', {id: 'weth-unspecified', deployment: {chain: 'ethereum'}})];
  const result = reconcileInventory(inventory(...rows), date, {all: true});
  assert.equal(result.coverage.find(r => r.id === 'weth9').permanent, true);
  assert.equal(result.tasks.length, 3);
  for (const row of result.tasks) { assert.equal(row.status, 'unreviewed'); assert.ok(row.reasons.includes('deployment-unverified')); assert.equal(row.permanent, false); }
});
test('overdue, partial, changed and unknown dependency tasks remain explicit', () => {
  const previous = inventory(object('usdc', 'asset'));
  const current = inventory(object('usdc', 'asset', {dependencies: ['missing-control']}), object('uniswap-v4', 'protocol', {scope: 'position'}));
  const result = reconcileInventory(current, '2026-11-02', {previous});
  const usdc = result.tasks.find(r => r.id === 'usdc');
  for (const reason of ['changed-identity', 'dependency-unreviewed', 'incomplete-review', 'review-due']) assert.ok(usdc.reasons.includes(reason));
  assert.equal(usdc.reviewedAt, findReview('usdc').reviewedAt);
  assert.ok(result.tasks.some(r => r.id === 'uniswap-v4' && r.reasons.includes('incomplete-review')));
  const soon = reconcileInventory(previous, '2026-10-28', {dueWithinDays: 7});
  assert.ok(soon.tasks[0].reasons.includes('review-due-soon'));
  assert.equal(reconcileInventory(previous, date).tasks.length, 0);
  assert.ok(reconcileInventory(previous, date, {all: true}).tasks[0].reasons.includes('full-restudy'));
});
test('invalid inventory or ambiguous registry identities fail closed', () => {
  const row = object('usdc', 'asset');
  for (const value of [inventory(row, row), inventory({...row, sources: ['https://user:secret@example.org/']}),
    inventory({...row, deployment: {chain: 'base', chainId: 0}}), inventory(...Array(4097).fill(row))]) assert.throws(() => validateInventory(value));
  assert.throws(() => reconcileInventory(inventory(row), date, {dueWithinDays: 32}));
  const database = structuredClone(registry); database.entities[0].aliases.push(database.entities[1].id);
  assert.throws(() => reconcileInventory(inventory(row), date, {database}), /alias/);
});
test('CLI includes absent consumer objects and binds the report to both inputs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'edi-inventory-'));
  try {
    const path = join(dir, 'inventory.json'); await writeFile(path, JSON.stringify(inventory(object('lighter', 'chain'))));
    const output = JSON.parse(execFileSync(process.execPath, ['scripts/plan-reviews.mjs', '--as-of=' + date, '--inventory=' + path], {encoding: 'utf8'}));
    assert.match(output.baseRegistrySha256, /^[a-f0-9]{64}$/); assert.match(output.consumer.inventorySha256, /^[a-f0-9]{64}$/);
    assert.equal(output.consumer.tasks[0].entityId, 'lighter');
    await writeFile(path, ' '.repeat(4 * 1024 * 1024 + 1));
    assert.throws(() => execFileSync(process.execPath, ['scripts/plan-reviews.mjs', '--inventory=' + path], {stdio: 'pipe'}), /4 MiB/);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
