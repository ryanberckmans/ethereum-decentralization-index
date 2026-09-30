import {readFile} from 'node:fs/promises';
import {reviewQueue, reviewTiming, validateRegistry} from '../dist/registry/index.js';
import {argument, readRegistry, today, root} from './registry-files.mjs';
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
console.log(JSON.stringify({schemaVersion: 1, asOf, baseRegistrySha256: digest,
  policy: database.reviewPolicy, checklist: hints.checklist,
  tasks: tasks.filter(task => !ids.length || ids.includes(task.id)).map(task => {
    const entity = database.entities.find(e => e.id === task.id);
    return {...task, name: entity.name, scopeDescription: entity.scope, lastFindings:entity.reason, sources: entity.evidenceUrls,
      deployments: entity.canonicalAddresses ?? {}, dependencies: entity.dependencies,
      hints: [...new Set([...(hints.kinds[entity.kind] ?? []), ...(hints.projects[entity.id] ?? []), ...(entity.limits ?? [])])]};
  })}, null, 2));
