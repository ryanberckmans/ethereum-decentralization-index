import type { ControlEntity, ControlRegistry } from './types.js';
/** A consumer's identity assertions, never decentralization findings. */
export interface InventoryObject {
    id: string;
    name: string;
    entityId: string;
    kind: ControlEntity['kind'];
    scope: 'mechanism' | 'position';
    sources: string[];
    dependencies: string[];
    deployment?: {
        chain: string;
        chainId?: number;
        address?: string;
    };
}
export interface ConsumerInventory {
    schemaVersion: 1;
    consumer: string;
    objects: InventoryObject[];
}
/** Reject ambiguous or unbounded input before looking up any review. No network access. */
export declare function validateInventory(input: unknown): asserts input is ConsumerInventory;
export type CoverageReason = 'missing-review' | 'kind-mismatch' | 'deployment-unverified' | 'changed-identity' | 'incomplete-review' | 'review-due' | 'review-due-soon' | 'full-restudy' | 'dependency-unreviewed';
export interface InventoryCoverage {
    id: string;
    entityId: string;
    canonicalId: string | null;
    status: 'assessed' | 'partial' | 'unreviewed';
    reviewedAt: string | null;
    dueAt: string | null;
    permanent: boolean;
    reasons: CoverageReason[];
    unresolvedDependencies: string[];
}
/**
 * @cc [label:research] consumer-coverage-is-not-research
 * Reconciliation only reads canonical findings. Missing, changed or unmatched deployments
 * create explicit tasks; they never inherit a brand's grade or advance a research date.
 * Permanent D0 applies only to a matching identity and its reviewed dependency path.
 */
export declare function reconcileInventory(input: ConsumerInventory, asOf: string, options?: {
    database?: ControlRegistry;
    all?: boolean;
    dueWithinDays?: number;
    previous?: ConsumerInventory;
}): {
    schemaVersion: 1;
    consumer: string;
    asOf: string;
    coverage: InventoryCoverage[];
    tasks: {
        object: InventoryObject;
        id: string;
        entityId: string;
        canonicalId: string | null;
        status: "assessed" | "partial" | "unreviewed";
        reviewedAt: string | null;
        dueAt: string | null;
        permanent: boolean;
        reasons: CoverageReason[];
        unresolvedDependencies: string[];
    }[];
};
//# sourceMappingURL=inventory.d.ts.map