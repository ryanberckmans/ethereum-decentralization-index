import {assertReviewDate, registry, registryAssessment, reviewTiming, validateRegistry} from './index.js';
import {safeEvidenceUrl} from '../core/index.js';
import type {ControlEntity, ControlRegistry} from './types.js';

/** A consumer's identity assertions, never decentralization findings. */
export interface InventoryObject {
  id: string;
  name: string;
  entityId: string;
  kind: ControlEntity['kind'];
  scope: 'mechanism' | 'position';
  sources: string[];
  dependencies: string[];
  deployment?: {chain: string; chainId?: number; address?: string};
}
export interface ConsumerInventory {schemaVersion: 1; consumer: string; objects: InventoryObject[]}
const identity = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9][a-z0-9:._-]{0,255}$/.test(s);

/** Reject ambiguous or unbounded input before looking up any review. No network access. */
export function validateInventory(input: unknown): asserts input is ConsumerInventory {
  const value = input as ConsumerInventory;
  if (!value || value.schemaVersion !== 1 || !identity(value.consumer) || !Array.isArray(value.objects) || value.objects.length > 4096)
    throw Error('Invalid consumer inventory');
  const ids = new Set<string>();
  for (const row of value.objects) {
    if (!row || !identity(row.id) || ids.has(row.id) || !identity(row.entityId) || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 512 ||
      !['chain', 'asset', 'protocol'].includes(row.kind) || !['mechanism', 'position'].includes(row.scope)) throw Error('Invalid or duplicate inventory identity');
    ids.add(row.id);
    if (!Array.isArray(row.sources) || row.sources.length > 16 || row.sources.some(s => typeof s !== 'string' || s.length > 2048 || !safeEvidenceUrl(s)) ||
      !Array.isArray(row.dependencies) || row.dependencies.length > 64 || row.dependencies.some(d => !identity(d)) || new Set(row.dependencies).size !== row.dependencies.length)
      throw Error(`Invalid inventory evidence or dependencies: ${row.id}`);
    const d = row.deployment;
    if (d && (!identity(d.chain) || (d.chainId !== undefined && (!Number.isSafeInteger(d.chainId) || d.chainId <= 0)) ||
      (d.address !== undefined && (typeof d.address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(d.address))))) throw Error(`Invalid deployment: ${row.id}`);
  }
}

export type CoverageReason = 'missing-review' | 'kind-mismatch' | 'deployment-unverified' | 'changed-identity' | 'incomplete-review' | 'review-due' | 'review-due-soon' | 'full-restudy' | 'dependency-unreviewed';
export interface InventoryCoverage {
  id: string; entityId: string; canonicalId: string | null;
  status: 'assessed' | 'partial' | 'unreviewed'; reviewedAt: string | null; dueAt: string | null;
  permanent: boolean; reasons: CoverageReason[]; unresolvedDependencies: string[];
}
const signature = (r: InventoryObject) => JSON.stringify([r.entityId, r.kind, r.scope, r.deployment?.chain ?? null, r.deployment?.chainId ?? null, r.deployment?.address?.toLowerCase() ?? null, [...r.dependencies].sort()]);

/**
 * @cc [label:research] consumer-coverage-is-not-research
 * Reconciliation only reads canonical findings. Missing, changed or unmatched deployments
 * create explicit tasks; they never inherit a brand's grade or advance a research date.
 * Permanent D0 applies only to a matching identity and its reviewed dependency path.
 */
export function reconcileInventory(input: ConsumerInventory, asOf: string, options: {database?: ControlRegistry; all?: boolean; dueWithinDays?: number; previous?: ConsumerInventory} = {}) {
  validateInventory(input); assertReviewDate(asOf);
  const database = options.database ?? registry;
  validateRegistry(database);
  const days = options.dueWithinDays ?? 0;
  if (!Number.isInteger(days) || days < 0 || days > 31) throw Error('Review horizon must be 0–31 days');
  if (options.previous) { validateInventory(options.previous); if (options.previous.consumer !== input.consumer) throw Error('Previous inventory belongs to another consumer'); }
  const prior = new Map(options.previous?.objects.map(r => [r.id, signature(r)]));
  const lookup = new Map(database.entities.flatMap(e => [[e.id, e] as const, ...e.aliases.map(a => [a, e] as const)]));
  const horizon = new Date(Date.parse(asOf) + days * 86400000).toISOString().slice(0, 10);
  const coverage: InventoryCoverage[] = [...input.objects].sort((a, b) => a.id.localeCompare(b.id)).map(row => {
    const entity = lookup.get(row.entityId), reasons: CoverageReason[] = [];
    let matched = !!entity;
    if (!entity) reasons.push('missing-review');
    else if (entity.kind !== row.kind) { matched = false; reasons.push('kind-mismatch'); }
    // A chain name or dependency is not evidence that a particular contract was reviewed.
    if (matched && row.deployment) {
      const d = row.deployment;
      if (!d.chainId || !d.address || entity!.canonicalAddresses?.[String(d.chainId)]?.toLowerCase() !== d.address.toLowerCase()) {
        matched = false; reasons.push('deployment-unverified');
      }
    }
    if (prior.has(row.id) && prior.get(row.id) !== signature(row)) reasons.push('changed-identity');
    const timing = matched ? reviewTiming(entity!, asOf, database) : null;
    const assessment = matched ? registryAssessment(entity!.id, asOf, {scope: row.scope, database}) : null;
    const unresolvedDependencies = row.dependencies.filter(id => !lookup.has(id) || registryAssessment(id, asOf, {database}).status !== 'assessed');
    if (unresolvedDependencies.length) reasons.push('dependency-unreviewed');
    if (assessment && assessment.status !== 'assessed') reasons.push('incomplete-review');
    const position = row.scope === 'position' ? entity?.positionReview : undefined;
    const dueAt = [timing?.dueAt, position?.nextReviewAt].filter((d): d is string => !!d).sort()[0] ?? null;
    if (matched && dueAt && dueAt <= asOf) reasons.push('review-due');
    else if (matched && dueAt && dueAt <= horizon) reasons.push('review-due-soon');
    const permanent = !!timing?.permanent && row.scope === 'mechanism' && !unresolvedDependencies.length && !reasons.includes('changed-identity');
    if (options.all && matched && !permanent) reasons.push('full-restudy');
    return {id: row.id, entityId: row.entityId, canonicalId: matched ? entity!.id : null,
      status: assessment?.status === 'assessed' && (unresolvedDependencies.length || reasons.includes('changed-identity')) ? 'partial' : assessment?.status ?? 'unreviewed', reviewedAt: matched ? entity!.reviewedAt : null,
      dueAt: matched ? dueAt : null, permanent, reasons, unresolvedDependencies};
  });
  const objects = new Map(input.objects.map(r => [r.id, r]));
  return {schemaVersion: 1 as const, consumer: input.consumer, asOf, coverage,
    tasks: coverage.filter(r => r.reasons.length).map(r => ({...r, object: objects.get(r.id)!}))};
}
