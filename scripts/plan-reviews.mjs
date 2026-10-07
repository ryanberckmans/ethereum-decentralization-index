import {readFile, open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {reviewQueue, reviewTiming, validateRegistry, reconcileInventory} from '../dist/registry/index.js';
import {argument, readRegistry, today, root, sha256} from './registry-files.mjs';
// Read at most the limit plus one byte, including when input is not a regular file.
async function inventoryFile(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    if (!(await handle.stat()).isFile()) throw Error('Inventory must be a regular file');
    const limit = 4 * 1024 * 1024, buffer = Buffer.alloc(limit + 1);
    const {bytesRead} = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > limit) throw Error('Inventory exceeds 4 MiB');
    const bytes = buffer.subarray(0, bytesRead);
    return {value: JSON.parse(bytes.toString('utf8')), sha256: sha256(bytes)};
  } finally { await handle.close(); }
}
const {database, digest} = await readRegistry(), asOf = argument('as-of', today());
validateRegistry(database);
const hints = JSON.parse(await readFile(new URL('data/refresh-hints.json', root), 'utf8'));
const tasks = [...reviewQueue(asOf, database)];
if (process.argv.includes('--all')) for (const entity of database.entities) {
  const timing = reviewTiming(entity, asOf, database);
  if (!timing.permanent && !tasks.some(t => t.id === entity.id && t.scope === 'mechanism')) tasks.push({id: entity.id, scope: 'mechanism', dueAt: timing.dueAt, unresolved: entity.assessment !== 'assessed'});
  if (entity.positionReview && !tasks.some(t => t.id === entity.id && t.scope === 'position-dependencies')) tasks.push({id: entity.id, scope: 'position-dependencies', dueAt: entity.positionReview.nextReviewAt, unresolved: entity.positionReview.status === 'unresolved'});
}
const ids = argument('ids', '').split(',').filter(Boolean);
const inventoryPath = argument('inventory', ''), previousPath = argument('previous-inventory', '');
if (previousPath && !inventoryPath) throw Error('--previous-inventory requires --inventory');
const inventory = inventoryPath ? await inventoryFile(inventoryPath) : null;
const previous = previousPath ? await inventoryFile(previousPath) : null;
const consumer = inventory ? {...reconcileInventory(inventory.value, asOf, {database, all: process.argv.includes('--all'), dueWithinDays: Number(argument('due-within-days', '0')), previous: previous?.value}), inventorySha256: inventory.sha256, previousInventorySha256: previous?.sha256 ?? null} : null;
console.log(JSON.stringify({schemaVersion: 1, asOf, baseRegistrySha256: digest,
  ...(consumer ? {consumer} : {}),
  policy: database.reviewPolicy, checklist: hints.checklist,
  tasks: tasks.filter(task => !ids.length || ids.includes(task.id)).map(task => {
    const entity = database.entities.find(e => e.id === task.id);
    return {...task, name: entity.name, scopeDescription: entity.scope, lastFindings:entity.reason, sources: entity.evidenceUrls,
      deployments: entity.canonicalAddresses ?? {}, dependencies: entity.dependencies,
      hints: [...new Set([...(hints.kinds[entity.kind] ?? []), ...(hints.projects[entity.id] ?? []), ...(entity.limits ?? [])])]};
  })}, null, 2));
