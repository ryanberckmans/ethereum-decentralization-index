/**
 * Evaluates EDI for every record on every date where its result can change.
 * Runs at build time (and in tests); the Worker only selects the segment that
 * applies on the request's UTC date, so no grade is stored, edited or
 * re-derived by directory code.
 *
 * @cc [label:product] edi-is-the-assessment-authority
 * Mechanism and position assessments MUST come from EDI's registryAssessment
 * and reviewTiming at the evaluation date. Editorial data never supplies,
 * promotes or renews a grade.
 *
 * @cc [label:product] date-correct-assessments
 * EDI results change only on review due dates. The edition records, for each
 * record, EDI's result from the registry date and on every later due date, so
 * the server and a browser can show the result for any UTC date (after
 * midnight, on a resumed tab or from a cache) without reimplementing EDI
 * semantics. Permanent D0 never expires with age.
 */
import type {Assessment} from 'ethereum-decentralization-index';
import {registry, registryAssessment, reviewQueue, reviewTiming} from 'ethereum-decentralization-index/registry';
import {entities, entity, type Entity} from './registry.ts';
import {maxDate} from './dates.ts';
import type {AssessmentTimelines, RawState, ReviewState, Segment} from './edition-types.ts';

/** The earliest date EDI can be evaluated at: no record may be reviewed after it. */
export const REGISTRY_DATE = registry.lastUpdatedAt;

/** Clamp a requested date so EDI is never asked about a date before its own records. */
export function evaluationDate(requested: string): string {
  return maxDate(requested, REGISTRY_DATE);
}

/** Records that carry a separate EDI position review. Others have no position grade. */
export function hasPositionReview(subject: Entity): boolean {
  return subject.positionReview !== undefined || subject.positionDependenciesUnreviewed === true;
}

/**
 * Position review due dates, as EDI's own review queue computes them. Asking
 * the queue about a date after every deadline lists each position review once.
 */
const POSITION_DUE = new Map(
  reviewQueue('9999-12-31')
    .filter(task => task.scope === 'position-dependencies')
    .map(task => [task.id, task.dueAt] as const),
);

function positionTiming(subject: Entity, asOf: string): ReviewState | undefined {
  const dueAt = POSITION_DUE.get(subject.id);
  return dueAt === undefined ? undefined : {permanent: false, dueAt, overdue: dueAt <= asOf};
}

function plain(value: Assessment): Assessment {
  return {
    effectiveLevel: value.effectiveLevel,
    knownFloor: value.knownFloor,
    status: value.status,
    unresolved: [...value.unresolved],
    ...(value.reviewedAt ? {reviewedAt: value.reviewedAt} : {}),
  };
}

/** One record's EDI state on one date, straight from EDI. */
export function rawState(id: string, asOf: string): RawState {
  const subject = entity(id);
  if (!subject) throw new Error(`Not an EDI record: ${id}`);
  const date = evaluationDate(asOf);
  const timing = reviewTiming(subject, date);
  const state: RawState = {
    mechanism: plain(registryAssessment(id, date)),
    review: {permanent: timing.permanent, dueAt: timing.dueAt, overdue: timing.overdue},
  };
  if (hasPositionReview(subject)) {
    state.position = plain(registryAssessment(id, date, {scope: 'position'}));
    const positionReview = positionTiming(subject, date);
    if (positionReview) state.positionReview = positionReview;
  }
  return state;
}

/**
 * Every date on which any EDI result can change: each record's mechanism due
 * date and each position review's due date. Between two consecutive change
 * dates every assessment is constant, because EDI's date dependence is
 * exactly `dueAt <= asOf`. The tests verify this against daily evaluation.
 */
export const CHANGE_DATES: readonly string[] = (() => {
  const dates = new Set<string>();
  for (const subject of entities) {
    const timing = reviewTiming(subject, REGISTRY_DATE);
    if (timing.dueAt) dates.add(timing.dueAt);
    const position = positionTiming(subject, REGISTRY_DATE);
    if (position?.dueAt) dates.add(position.dueAt);
  }
  return [...dates].sort();
})();

/** EDI's results for `id` from the registry date onward, one segment per distinct result. */
export function rawTimeline(id: string): Segment<RawState>[] {
  const segments: Segment<RawState>[] = [{from: REGISTRY_DATE, value: rawState(id, REGISTRY_DATE)}];
  for (const date of CHANGE_DATES) {
    if (date <= REGISTRY_DATE) continue;
    const value = rawState(id, date);
    if (JSON.stringify(value) !== JSON.stringify(segments[segments.length - 1].value)) segments.push({from: date, value});
  }
  return segments;
}

/** The complete, locale-free assessment data an edition carries. */
export function assessmentTimelines(): AssessmentTimelines {
  return {
    registryDate: REGISTRY_DATE,
    changeDates: [...CHANGE_DATES],
    records: Object.fromEntries(entities.map(subject => [subject.id, rawTimeline(subject.id)])),
  };
}
