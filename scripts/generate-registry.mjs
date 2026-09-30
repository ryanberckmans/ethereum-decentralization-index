import {readRegistry, atomicWrite, sha256} from './registry-files.mjs';

const {text, database, digest} = await readRegistry();
if (!Array.isArray(database.entities) || database.entities.length > 2048) throw new Error('Invalid registry');
// Bootstrap only the data module needed by TypeScript's independently typed binding.
// The compiled validator runs before any public snapshot is generated.
if (process.argv.includes('--bootstrap')) {
  await atomicWrite('dist/registry/data.js', "// One canonical dataset; no second embedded registry.\nimport database from '../../data/control-registry.json' with {type: 'json'};\nexport const registry = database;\n");
  await atomicWrite('dist/registry/data.d.ts', "import type {ControlRegistry} from './types.js';\nexport declare const registry: ControlRegistry;\n");
} else {
  const {validateRegistry, registryAssessment, reviewTiming, reviewQueue} = await import('../dist/registry/index.js');
  validateRegistry(database);
  const asOf = database.lastUpdatedAt;
  const reviews = [...database.entities].sort((a,b) => a.id.localeCompare(b.id)).map(entity => {
    const value = registryAssessment(entity.id, asOf, {database}), timing = reviewTiming(entity, asOf, database);
    return {id: entity.id, level: value.effectiveLevel, floor: value.knownFloor, status: value.status,
      reviewedAt: entity.reviewedAt, dueAt: timing.dueAt, ...(timing.permanent ? {permanentD0: true} : {}),
      ...(entity.positionDependenciesUnreviewed ? {positionUnresolved: true} : {})};
  });
  const summary = {schemaVersion: 1, asOf, registrySha256: digest, entityCount: reviews.length, reviews};
  await atomicWrite('data/latest.json', JSON.stringify(summary) + '\n');
  const {buildCoverage} = await import('./coverage.mjs');
  const {readFile} = await import('node:fs/promises');
  const input = JSON.parse(await readFile(new URL('../data/coverage-input.json', import.meta.url), 'utf8'));
  const coverage = buildCoverage(input, database, asOf);
  await atomicWrite('data/mapped-l1-coverage.json', JSON.stringify(coverage, null, 2) + '\n');
  console.log(JSON.stringify({records: reviews.length, sourceBytes: Buffer.byteLength(text), sourceSha256: digest,
    snapshotBytes: Buffer.byteLength(JSON.stringify(summary) + '\n'), snapshotSha256: sha256(JSON.stringify(summary) + '\n'),
    dueReviews: reviewQueue(asOf, database).length, mappedL1Protocols: coverage.protocols}));
}
