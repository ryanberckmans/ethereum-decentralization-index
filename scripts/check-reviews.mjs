import {registryAssessment, reviewQueue, validateRegistry} from '../dist/registry/index.js';
import {argument, readRegistry, today} from './registry-files.mjs';
const {database} = await readRegistry();
const asOf = argument('as-of', today());
validateRegistry(database);
const queue = reviewQueue(asOf, database);
const assessments = database.entities.map(e => registryAssessment(e.id, asOf, {database}));
console.log(JSON.stringify({asOf, records: database.entities.length,
  complete: assessments.filter(a => a.status === 'assessed').length,
  partial: assessments.filter(a => a.status === 'partial').length,
  unknown: assessments.filter(a => a.status === 'unreviewed').length,
  due: queue}, null, 2));
if (process.argv.includes('--strict') && queue.length) process.exitCode = 1;
