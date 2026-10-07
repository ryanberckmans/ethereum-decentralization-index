import {assessment, assessControlGraph, composeAssessments, isDLevel, safeEvidenceUrl, type Assessment, type ControlReview} from '../core/index.js';
import {registry as data} from './data.js';
import type {ControlEntity, ControlRegistry} from './types.js';
export type {ControlEntity, ControlRegistry, PositionReview} from './types.js';
export {validateInventory, reconcileInventory} from './inventory.js';
export type {ConsumerInventory, InventoryObject, InventoryCoverage, CoverageReason} from './inventory.js';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** The bundled scientific data is immutable in memory. */
export const registry = freeze(data);

export function assertReviewDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)
    throw new Error('Use an ISO calendar date');
}
const isoDate = assertReviewDate;

/** An explicit registry ID or curated integration alias; never a ticker match. */
export function findReview(id: string, database: ControlRegistry = registry): ControlEntity | undefined {
  return database.entities.find(entity => entity.id === id || entity.aliases.includes(id));
}

/** Only exact recorded addresses match; a similar token or a new deployment stays unknown. */
export function findReviewByAddress(chainId: number, address: string, database: ControlRegistry = registry): ControlEntity | undefined {
  if (!Number.isSafeInteger(chainId) || chainId <= 0 || !/^0x[0-9a-fA-F]{40}$/.test(address)) return undefined;
  return database.entities.find(entity => entity.canonicalAddresses?.[String(chainId)]?.toLowerCase() === address.toLowerCase());
}

/** One calendar month, clamped to the last day of the following month. */
export function addReviewMonth(value: string): string {
  isoDate(value);
  const d = new Date(value), day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const end = new Date(d);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  d.setUTCDate(Math.min(day, end.getUTCDate()));
  const result = d.toISOString().slice(0, 10);
  isoDate(result);
  return result;
}

function permanent(entity: ControlEntity, database: ControlRegistry, active = new Set<string>(), depth = 0): boolean {
  if (depth > 64) throw new Error('Control path exceeds 64 levels');
  if (active.has(entity.id)) throw new Error('Cyclic control dependency');
  if (entity.reviewCadence !== 'permanent-D0' || entity.proposedTier !== 0 || (entity.knownFloor ?? 0) !== 0 || entity.assessment !== 'assessed' || entity.tierBound === true || !entity.immutableIdentity?.trim() || !entity.evidenceUrls.length)
    return false;
  active.add(entity.id);
  const result = entity.dependencies.every(id => {
    const dep = database.entities.find(e => e.id === id);
    return dep !== undefined && permanent(dep, database, active, depth + 1);
  });
  active.delete(entity.id);
  return result;
}

export interface ReviewTiming {permanent: boolean; dueAt: string | null; overdue: boolean}
/**
 * @cc [label:product] scoped-d0-permanence
 * Only an assessed D0 immutable mechanism with a fully permanent D0 dependency
 * path is exempt from age expiry. A D0 wrapper of a controlled asset is not exempt.
 */
export function reviewTiming(entity: ControlEntity, asOf: string, database: ControlRegistry = registry): ReviewTiming {
  isoDate(asOf);
  isoDate(entity.reviewedAt);
  if (entity.reviewedAt > asOf) throw new Error('Review date is in the future');
  if (permanent(entity, database)) return {permanent: true, dueAt: null, overdue: false};
  const monthly = addReviewMonth(entity.reviewedAt);
  if (entity.nextReviewAt !== null) isoDate(entity.nextReviewAt);
  // Explicit dates can pull a full restudy forward, never postpone it beyond a month.
  const dueAt = entity.nextReviewAt !== null && entity.nextReviewAt < monthly ? entity.nextReviewAt : monthly;
  return {permanent: false, dueAt, overdue: dueAt <= asOf};
}

export interface ReviewTask {id: string; scope: 'mechanism' | 'position-dependencies'; dueAt: string; unresolved: boolean}
export function reviewQueue(asOf: string, database: ControlRegistry = registry): readonly ReviewTask[] {
  isoDate(asOf);
  const tasks: ReviewTask[] = [];
  for (const entity of database.entities) {
    const timing = reviewTiming(entity, asOf, database);
    if (timing.overdue) tasks.push({id: entity.id, scope: 'mechanism', dueAt: timing.dueAt!, unresolved: entity.assessment !== 'assessed'});
    if (entity.positionReview) {
      const position = entity.positionReview;
      isoDate(position.nextReviewAt);
      if (position.reviewedAt) isoDate(position.reviewedAt);
      if (position.reviewedAt && position.reviewedAt > asOf) throw new Error('Position review date is in the future');
      const monthly = position.reviewedAt ? addReviewMonth(position.reviewedAt) : position.nextReviewAt;
      const dueAt = position.nextReviewAt < monthly ? position.nextReviewAt : monthly;
      if (dueAt <= asOf) tasks.push({id: entity.id, scope: 'position-dependencies', dueAt, unresolved: position.status === 'unresolved'});
    }
  }
  return freeze(tasks.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id) || a.scope.localeCompare(b.scope)));
}

// The bundled registry is deep-frozen, so its derived reviews depend only on the date. Deriving every
// entity's timing and permanence for each lookup was most of a lookup's cost.
const bundledReviews = new Map<string, readonly ControlReview[]>();
function controlReviews(asOf: string, database: ControlRegistry): readonly ControlReview[] {
  const cached = database === registry ? bundledReviews.get(asOf) : undefined;
  if (cached) return cached;
  const reviews: ControlReview[] = database.entities.map(entity => {
    const timing = reviewTiming(entity, asOf, database);
    // proposedTier is an editorial floor for incomplete records; preserve stronger known controls.
    const level = entity.proposedTier === null ? entity.knownFloor ?? null : Math.max(entity.proposedTier, entity.knownFloor ?? 0) as ControlReview['level'];
    return {id: entity.id, label: timing.overdue ? `Review overdue: ${entity.id}` : entity.name, level,
      complete: entity.assessment === 'assessed' && entity.tierBound !== true && !timing.overdue,
      dependencies: entity.dependencies, reviewedAt: entity.reviewedAt, evidence: entity.evidenceUrls};
  });
  if (database === registry) {
    if (bundledReviews.size >= 16) bundledReviews.clear();
    bundledReviews.set(asOf, freeze(reviews));
  }
  return reviews;
}

/**
 * @cc [label:research] no-synthetic-review-renewal
 * Expired non-D0 research remains incomplete with its established control floor
 * and original review date. Financial updates cannot renew a research assessment.
 */
export function registryAssessment(id: string, asOf: string, options: {scope?: 'mechanism' | 'position'; database?: ControlRegistry} = {}): Assessment {
  const database = options.database ?? registry;
  isoDate(asOf);
  const reviews = controlReviews(asOf, database);
  const entity = findReview(id, database);
  const result = assessControlGraph(entity?.id ?? id, reviews);
  const positionOverdue = entity?.positionReview && reviewQueue(asOf, { ...database, entities: [entity] }).some(task => task.scope === 'position-dependencies');
  return options.scope === 'position' && (entity?.positionDependenciesUnreviewed || entity?.positionReview?.status === 'unresolved' || positionOverdue)
    ? composeAssessments([result, assessment(null, {unresolved: [`Unresolved or overdue position dependencies: ${id}`]})]) : result;
}

/** Validate the release data, without making any network call or changing dates. */
export function validateRegistry(database: ControlRegistry = registry): void {
  if (![1, 2].includes(database.schemaVersion) || !Array.isArray(database.entities) || !database.entities.length || database.entities.length > 2048) throw new Error('Invalid registry size or schema');
  const ids = new Set(database.entities.map(e => e.id));
  if (ids.size !== database.entities.length) throw new Error('Duplicate registry identity');
  isoDate(database.lastUpdatedAt);
  isoDate(database.policyUpdatedAt);
  const aliases = new Set<string>();
  for (const entity of database.entities) {
    if (!/^[a-z0-9][a-z0-9:._-]{0,255}$/.test(entity.id) || !entity.name?.trim() || entity.name.length > 512 || !['chain','asset','protocol'].includes(entity.kind)) throw new Error('Invalid registry identity');
    if (entity.proposedTier !== null && !isDLevel(entity.proposedTier)) throw new Error(`Unsupported D level: ${entity.id}`);
    if (entity.knownFloor !== undefined && !isDLevel(entity.knownFloor)) throw new Error(`Unsupported D floor: ${entity.id}`);
    if (!['assessed','lower-bound','unreviewed'].includes(entity.assessment) || (entity.assessment === 'assessed' && entity.proposedTier === null)) throw new Error(`Invalid assessment: ${entity.id}`);
    if (!Array.isArray(entity.aliases) || !Array.isArray(entity.dependencies) || !Array.isArray(entity.controls) || !Array.isArray(entity.evidenceUrls)) throw new Error(`Invalid review lists: ${entity.id}`);
    for (const alias of entity.aliases) {
      if (typeof alias !== 'string' || !alias || (alias !== entity.id && ids.has(alias)) || aliases.has(alias)) throw new Error(`Ambiguous review alias: ${alias}`);
      aliases.add(alias);
    }
    if (entity.tierBound !== undefined && typeof entity.tierBound !== 'boolean') throw new Error(`Invalid tier bound: ${entity.id}`);
    if (!entity.scope?.trim() || !entity.reason?.trim() || !entity.evidenceUrls.length || entity.evidenceUrls.some((url: string) => !safeEvidenceUrl(url))) throw new Error(`Missing or unsafe research evidence: ${entity.id}`);
    if (entity.dependencies.some((id: string) => !ids.has(id)) || new Set(entity.dependencies).size !== entity.dependencies.length) throw new Error(`Missing or duplicate registry dependency: ${entity.id}`);
    isoDate(entity.reviewedAt);
    if (entity.reviewedAt > database.lastUpdatedAt) throw new Error(`Future review date: ${entity.id}`);
    if (entity.researchAttemptedAt !== undefined) {
      isoDate(entity.researchAttemptedAt);
      if (entity.researchAttemptedAt < entity.reviewedAt || entity.researchAttemptedAt > database.lastUpdatedAt) throw new Error(`Invalid research attempt date: ${entity.id}`);
    }
    if (entity.reviewCadence === 'permanent-D0' && (!permanent(entity, database) || entity.nextReviewAt !== null)) throw new Error(`Invalid permanent D0: ${entity.id}`);
    if (entity.reviewCadence !== 'monthly' && entity.reviewCadence !== 'permanent-D0') throw new Error(`Invalid review cadence: ${entity.id}`);
    if (entity.reviewCadence === 'monthly') {
      if (!entity.nextReviewAt) throw new Error(`Missing monthly review date: ${entity.id}`);
      isoDate(entity.nextReviewAt);
      if (entity.nextReviewAt < entity.reviewedAt || entity.nextReviewAt > addReviewMonth(entity.reviewedAt)) throw new Error(`Invalid monthly review date: ${entity.id}`);
    }
    for (const [chainId,address] of Object.entries(entity.canonicalAddresses ?? {})) {
      if (!/^[1-9]\d*$/.test(chainId) || !Number.isSafeInteger(Number(chainId)) || typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error(`Invalid deployment address: ${entity.id}`);
    }
    if (entity.sourceProof) {
      const proof = entity.sourceProof;
      isoDate(proof.checkedAt);
      if (proof.checkedAt > database.lastUpdatedAt || proof.provider !== 'sourcify-v2' || !/^[a-f0-9]{64}$/.test(proof.runtimeSha256) || !/^[a-f0-9]{64}$/.test(proof.sourcesSha256) || !proof.contractName?.trim() || typeof proof.proxyDetected !== 'boolean' || entity.canonicalAddresses?.[String(proof.chainId)]?.toLowerCase() !== proof.address.toLowerCase()) throw new Error(`Invalid source proof: ${entity.id}`);
      if (entity.reviewCadence === 'permanent-D0' && proof.proxyDetected) throw new Error(`Proxy cannot be permanent D0: ${entity.id}`);
    }
    if (entity.positionDependenciesUnreviewed && (!entity.positionReview || entity.positionReview.status !== 'unresolved')) throw new Error(`Missing unresolved position review: ${entity.id}`);
    if (entity.positionReview) {
      if (entity.positionReview.cadence !== 'monthly' || !['assessed','unresolved'].includes(entity.positionReview.status) || !entity.positionReview.reason?.trim()) throw new Error(`Invalid position review: ${entity.id}`);
      isoDate(entity.positionReview.nextReviewAt);
      if (entity.positionReview.reviewedAt) {
        isoDate(entity.positionReview.reviewedAt);
        if (entity.positionReview.reviewedAt > database.lastUpdatedAt) throw new Error(`Future position review: ${entity.id}`);
        if (entity.positionReview.nextReviewAt < entity.positionReview.reviewedAt || entity.positionReview.nextReviewAt > addReviewMonth(entity.positionReview.reviewedAt)) throw new Error(`Invalid position review date: ${entity.id}`);
      }
    }
    reviewTiming(entity, database.lastUpdatedAt, database);
    registryAssessment(entity.id, database.lastUpdatedAt, {database});
  }
  const visited = new Set<string>(), active = new Set<string>();
  function visit(id: string, depth: number): void {
    if (depth > 64) throw new Error('Control path exceeds 64 levels');
    if (active.has(id)) throw new Error('Cyclic control dependency');
    if (visited.has(id)) return;
    active.add(id);
    for (const dependency of database.entities.find(e => e.id === id)!.dependencies) visit(dependency, depth + 1);
    active.delete(id);
    visited.add(id);
  }
  for (const entity of database.entities) visit(entity.id, 0);
}
