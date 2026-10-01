import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {assertReviewDate, registryAssessment, reviewTiming, validateRegistry} from '../dist/registry/index.js';
import {atomicWrite, readRegistry, renderRegistry, withRegistryLock, today} from './registry-files.mjs';

/**
 * @cc [label:research] accepted-research-only
 * Dates advance only with an explicit full-research attestation. An incomplete
 * attempt retains the review date, deadline and established floor. Permanent D0
 * changes require a named evidence correction.
 */
export function applyCandidate(database, candidate, digest) {
  const records = candidate.records ?? [], positionReviews = candidate.positionReviews ?? [];
  if (candidate.schemaVersion !== 1 || candidate.baseRegistrySha256 !== digest || !Array.isArray(records) || !Array.isArray(positionReviews) || !records.length && !positionReviews.length || records.length + positionReviews.length > 128) throw new Error('Invalid or stale research candidate');
  assertReviewDate(candidate.asOf);
  if (candidate.asOf < database.lastUpdatedAt) throw new Error('Candidate date precedes current data');
  const required = ['identity','implementation','authorities','timing','exits','dependencies'];
  const entities = new Map(database.entities.map(e => [e.id,e])), touched = new Set(), incompleteIds=[];
  for (const record of records) {
    if (touched.has(record.id)) throw new Error('Duplicate candidate record');
    touched.add(record.id);
    const prior = entities.get(record.id);
    const complete = record.reviewedAt === candidate.asOf && required.every(check => record.reviewChecks?.includes(check));
    const incomplete = prior && record.reviewedAt === prior.reviewedAt && record.researchAttemptedAt === candidate.asOf && record.assessment !== 'assessed' && record.tierBound === true && record.nextReviewAt === prior.nextReviewAt;
    if ((!complete && !incomplete) || !record.evidenceUrls?.length) throw new Error(`Full research attestation or retained incomplete attempt missing: ${record.id}`);
    if (!complete && Math.max(record.proposedTier??0,record.knownFloor??0) < Math.max(prior.proposedTier??0,prior.knownFloor??0)) throw new Error(`Incomplete attempt weakens the established floor: ${record.id}`);
    if (!complete && reviewTiming(prior,candidate.asOf,database).permanent) throw new Error(`Incomplete attempt cannot replace permanent D0: ${record.id}`);
    if (!complete) incompleteIds.push(record.id);
    if (prior && reviewTiming(prior, candidate.asOf, database).permanent && !isDeepStrictEqual(prior,record) && !candidate.corrections?.[record.id]?.trim()) throw new Error(`Permanent D0 requires an explicit evidence correction: ${record.id}`);
    entities.set(record.id,record);
  }
  for (const position of positionReviews) {
    if (!position || typeof position.id !== 'string' || touched.has(position.id)) throw new Error('Duplicate candidate record');
    touched.add(position.id);
    const prior = entities.get(position.id), review = position.positionReview;
    if (!prior?.positionReview || !review || review.reviewedAt !== candidate.asOf || !required.every(check => position.reviewChecks?.includes(check))) throw new Error(`Full position research attestation missing: ${position.id}`);
    if (!prior.evidenceUrls?.length) throw new Error(`Position research evidence missing: ${position.id}`);
    entities.set(position.id,{...prior,positionReview:review});
  }
  const next = {...database, lastUpdatedAt: candidate.asOf, entities: [...entities.values()]};
  validateRegistry(next);
  for (const id of incompleteIds) if ((registryAssessment(id,candidate.asOf,{database:next}).knownFloor??0) < (registryAssessment(id,candidate.asOf,{database}).knownFloor??0)) throw new Error(`Incomplete attempt weakens the dependency floor: ${id}`);
  return next;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file || file.startsWith('--')) throw new Error('Usage: npm run reviews:apply -- candidate.json');
  const candidateText = await readFile(file,'utf8');
  if (Buffer.byteLength(candidateText) > 2 * 1024 * 1024) throw new Error('Candidate exceeds 2 MiB');
  const candidate=JSON.parse(candidateText);
  if(candidate.asOf>today())throw new Error('Candidate date is in the future');
  await withRegistryLock(async()=>{
    const current = await readRegistry();
    const next = applyCandidate(current.database, candidate, current.digest);
    if ((await readRegistry()).digest !== current.digest) throw new Error('Concurrent registry edit; rebase the research candidate');
    await atomicWrite('data/control-registry.json', renderRegistry(next));
    const records=candidate.records??[], positionReviews=candidate.positionReviews??[];
    console.log(JSON.stringify({accepted:records.length,completedReviews:records.filter(r=>r.reviewedAt===candidate.asOf&&['identity','implementation','authorities','timing','exits','dependencies'].every(check=>r.reviewChecks?.includes(check))).length,acceptedPositionReviews:positionReviews.length,asOf: next.lastUpdatedAt}));
  });
}
