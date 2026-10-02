import { type Assessment } from '../core/index.js';
import type { ControlEntity, ControlRegistry } from './types.js';
export type { ControlEntity, ControlRegistry, PositionReview } from './types.js';
/** The bundled scientific data is immutable in memory. */
export declare const registry: ControlRegistry;
export declare function assertReviewDate(value: string): void;
/** An explicit registry ID or curated integration alias; never a ticker match. */
export declare function findReview(id: string, database?: ControlRegistry): ControlEntity | undefined;
/** Only exact recorded addresses match; a similar token or a new deployment stays unknown. */
export declare function findReviewByAddress(chainId: number, address: string, database?: ControlRegistry): ControlEntity | undefined;
/** One calendar month, clamped to the last day of the following month. */
export declare function addReviewMonth(value: string): string;
export interface ReviewTiming {
    permanent: boolean;
    dueAt: string | null;
    overdue: boolean;
}
/**
 * @cc [label:product] scoped-d0-permanence
 * Only an assessed D0 immutable mechanism with a fully permanent D0 dependency
 * path is exempt from age expiry. A D0 wrapper of a controlled asset is not exempt.
 */
export declare function reviewTiming(entity: ControlEntity, asOf: string, database?: ControlRegistry): ReviewTiming;
export interface ReviewTask {
    id: string;
    scope: 'mechanism' | 'position-dependencies';
    dueAt: string;
    unresolved: boolean;
}
export declare function reviewQueue(asOf: string, database?: ControlRegistry): readonly ReviewTask[];
/**
 * @cc [label:research] no-synthetic-review-renewal
 * Expired non-D0 research remains incomplete with its established control floor
 * and original review date. Financial updates cannot renew a research assessment.
 */
export declare function registryAssessment(id: string, asOf: string, options?: {
    scope?: 'mechanism' | 'position';
    database?: ControlRegistry;
}): Assessment;
/** Validate the release data, without making any network call or changing dates. */
export declare function validateRegistry(database?: ControlRegistry): void;
//# sourceMappingURL=index.d.ts.map