export { rubric } from './rubric.js';
export { locales, type Locale } from './locales.js';
import { rubric } from './rubric.js';
import { locales, type Locale } from './locales.js';
export type DLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SubjectKind = 'ethereum-l1' | 'mechanism' | 'position';
export interface Assessment {
    /** Complete effective grade; null when any material dependency is unknown. */
    effectiveLevel: DLevel | null;
    /** Largest established grade, even when effectiveLevel remains unknown. */
    knownFloor: DLevel | null;
    status: 'assessed' | 'partial' | 'unreviewed';
    unresolved: readonly string[];
    reviewedAt?: string;
}
const canonical = new WeakSet<object>();
function immutable(value: Assessment): Assessment { Object.freeze(value.unresolved); Object.freeze(value); canonical.add(value); return value; }
export interface ControlReview {
    id: string;
    label: string;
    level: DLevel | null;
    complete?: boolean;
    dependencies?: readonly string[];
    reviewedAt?: string;
    evidence?: readonly string[];
}
export function isDLevel(value: unknown): value is DLevel { return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9; }
export function normalizeLevel(value: unknown): DLevel | null { return isDLevel(value) ? value : null; }
export function levelColor(value: unknown): string { return isDLevel(value) ? rubric.grades[value].color : '#a5b4c4'; }
export function grade(value: unknown) { return isDLevel(value) ? rubric.grades[value] : null; }
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
/** Treat host-supplied/serialized assessments as untrusted; never lower a known restriction. */
export function normalizeAssessment(value: unknown): Assessment {
    if(value && typeof value === 'object' && canonical.has(value)) return value as Assessment;
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return assessment(null, { unresolved: ['Unverified assessment'] });
    const v = value as Record<string, unknown>, effective = normalizeLevel(v.effectiveLevel), floor = normalizeLevel(v.knownFloor);
    const known = effective === null ? floor : floor === null ? effective : Math.max(effective, floor) as DLevel;
    const validUnresolved = Array.isArray(v.unresolved) && v.unresolved.length <= 2048 && Array.from(v.unresolved).every(x => typeof x === 'string' && x.length > 0 && x.length <= 512);
    const unresolved = validUnresolved ? [...new Set(v.unresolved as string[])] : ['Unverified assessment'];
    const validLevels = (v.effectiveLevel === null || isDLevel(v.effectiveLevel)) && (v.knownFloor === null || isDLevel(v.knownFloor));
    const validStatus = ['assessed', 'partial', 'unreviewed'].includes(String(v.status));
    const validReviewDate = v.reviewedAt === undefined || validDate(v.reviewedAt);
    const complete = validLevels && validUnresolved && validStatus && validReviewDate && v.status === 'assessed' && effective !== null && effective === floor && unresolved.length === 0;
    if ((!validLevels || !validStatus || !validReviewDate || (v.status === 'assessed' && !complete)) && !unresolved.includes('Unverified assessment'))
        unresolved.push('Unverified assessment');
    return assessment(known, { complete, unresolved, ...(validDate(v.reviewedAt) ? { reviewedAt: v.reviewedAt } : {}) });
}
export function assessment(level: DLevel | null, options: {
    complete?: boolean;
    reviewedAt?: string;
    unresolved?: readonly string[];
} = {}): Assessment {
    if (!options || typeof options !== 'object' || Array.isArray(options))
        throw Error('Assessment options must be an object');
    if (options.complete !== undefined && typeof options.complete !== 'boolean')
        throw Error('Assessment completeness must be boolean');
    if (options.reviewedAt !== undefined && !validDate(options.reviewedAt))
        throw Error('Use an ISO review date');
    if (options.unresolved !== undefined && (!Array.isArray(options.unresolved) || options.unresolved.length > 2048 || Array.from(options.unresolved).some(x => typeof x !== 'string' || x.length === 0 || x.length > 512)))
        throw Error('Invalid unresolved controls');
    const known = normalizeLevel(level), unresolved = [...new Set(options.unresolved ?? [])];
    const complete = known !== null && options.complete !== false && unresolved.length === 0;
    return immutable({ effectiveLevel: complete ? known : null, knownFloor: known, status: complete ? 'assessed' : known !== null && known > 0 ? 'partial' : 'unreviewed', unresolved, ...(options.reviewedAt ? { reviewedAt: options.reviewedAt } : {}) });
}
/** A known positive restriction remains visible; an unknown never becomes D0. */
export function composeAssessments(values: readonly Assessment[]): Assessment {
    if (!values.length)
        return assessment(null);
    const normalized = Array.from(values,normalizeAssessment), known = normalized.flatMap(v => v.knownFloor === null ? [] : [v.knownFloor]), floor = known.length ? Math.max(...known) as DLevel : null;
    const complete = normalized.every(v => v.status === 'assessed'), dates = normalized.flatMap(v => v.reviewedAt ? [v.reviewedAt] : []).sort();
    return immutable({ effectiveLevel: complete ? floor : null, knownFloor: floor, status: complete ? 'assessed' : floor !== null && floor > 0 ? 'partial' : 'unreviewed', unresolved: [...new Set(normalized.flatMap(v => v.unresolved))], ...(dates.length === normalized.length ? { reviewedAt: dates[0] } : {}) });
}
export function displayedLevel(value: Assessment): DLevel | null { const v = normalizeAssessment(value); return v.effectiveLevel ?? (v.knownFloor !== null && v.knownFloor > 0 ? v.knownFloor : null); }
export function levelLabel(value: Assessment | DLevel | null): string {
    if (value === null || typeof value === 'number')
        return isDLevel(value) ? `D${value}` : 'D?';
    const normalized = normalizeAssessment(value), level = displayedLevel(normalized);
    return !isDLevel(level) ? 'D?' : `${normalized.status === 'assessed' ? '' : '≥ '}D${level}`;
}
export function describeAssessment(value: Assessment, locale: Locale = 'en', subject: SubjectKind = 'mechanism') {
    const normalized = normalizeAssessment(value), c = locales[locale] ?? locales.en, level = displayedLevel(normalized);
    return { label: levelLabel(normalized), color: levelColor(level), short: level === null ? c.unknownTitle : c.tiers[level].legend, definition: level === null ? c.unknownBody : level === 0 && subject === 'ethereum-l1' ? c.l1 : c.tiers[level].definition, uncertainty: normalized.status === 'assessed' ? null : c.unknownBody };
}
/**
 * Pure, bounded graph evaluation. IDs denote actual control dependencies, never
 * ticker or brand similarity. Cycles and oversized graphs are rejected explicitly.
 */
export function assessControlGraph(rootId: string, reviews: readonly ControlReview[]): Assessment {
    if (reviews.length > 2048)
        throw Error('Control graph exceeds 2,048 reviews');
    const byId = new Map<string, ControlReview>();
    for (const review of reviews) {
        if (typeof review.id !== 'string' || !review.id || review.id.length > 256 || typeof review.label !== 'string' || !review.label || review.label.length > 512 || byId.has(review.id))
            throw Error('Invalid or duplicate control identity');
        if (review.complete !== undefined && typeof review.complete !== 'boolean')
            throw Error('Assessment completeness must be boolean');
        if (review.level !== null && !isDLevel(review.level))
            throw Error('Unsupported D level');
        if (review.dependencies !== undefined && (!Array.isArray(review.dependencies) || Array.from(review.dependencies).some(id => typeof id !== 'string' || id.length === 0 || id.length > 256)))
            throw Error('Invalid control dependencies');
        if ((review.dependencies?.length ?? 0) > 64)
            throw Error('Too many direct dependencies');
        if (review.reviewedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt) || !Number.isFinite(Date.parse(review.reviewedAt)) || new Date(review.reviewedAt).toISOString().slice(0, 10) !== review.reviewedAt))
            throw Error('Use an ISO review date');
        byId.set(review.id, review);
    }
    const memo = new Map<string, Assessment>(), active = new Set<string>();
    const visit = (id: string, depth: number): Assessment => {
        if (depth > 64)
            throw Error('Control path exceeds 64 levels');
        if (active.has(id))
            throw Error('Cyclic control dependency');
        const cached = memo.get(id);
        if (cached)
            return cached;
        const r = byId.get(id);
        if (!r)
            return assessment(null, { unresolved: [id] });
        active.add(id);
        const own = assessment(r.level, { complete: r.complete, reviewedAt: r.reviewedAt, unresolved: r.level === null || r.complete === false ? [r.label] : [] });
        const result = composeAssessments([own, ...(r.dependencies ?? []).map(dep => visit(dep, depth + 1))]);
        active.delete(id);
        memo.set(id, result);
        return result;
    };
    return visit(rootId, 0);
}
export function safeEvidenceUrl(value: string): string | null { try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
}
catch {
    return null;
} }
