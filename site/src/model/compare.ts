/**
 * Comparison rules. Objects are compared field by field; numbers are put
 * side by side only when an editor placed them in the same comparison group
 * AND their unit, kind of quantity, time basis, chain scope and rate period
 * all match. Otherwise each number is shown on its own with the reasons.
 * Nothing is summed, averaged or scored.
 */
import type {Observation} from '../content/schema.ts';
import {daysBetween} from './dates.ts';
import {cleanText} from './query.ts';

export type Reason =
  | {kind: 'group'}
  | {kind: 'unit'}
  | {kind: 'measure'}
  | {kind: 'timeBasis'}
  | {kind: 'dates'; days: number}
  | {kind: 'chains'}
  | {kind: 'multichain'}
  | {kind: 'rate'};

export interface ComparedGroup {
  group: string;
  /** Per object, in object order: its latest observations in the group (more than one when it has several on that date). */
  cells: Observation[][];
  /** The metric, when every observation in the row has the same one. */
  metric?: string;
  comparable: boolean;
  reasons: Reason[];
}

export interface ObservationComparison {
  groups: ComparedGroup[];
  /** Per object, observations outside any shared group (shown on their own). */
  separate: Observation[][];
}

function timeBasis(observation: Observation): string {
  return observation.interval ? `interval:${observation.interval.start}/${observation.interval.end}` : `asOf:${observation.asOf ?? ''}`;
}

function chains(observation: Observation): string {
  return Array.isArray(observation.chainIds) ? [...observation.chainIds].sort((a, b) => a - b).join(',') : observation.chainIds;
}

/** Why two observations cannot be compared directly; empty when they can. */
export function incompatibility(a: Observation, b: Observation): Reason[] {
  const reasons: Reason[] = [];
  if (!a.comparisonGroup || a.comparisonGroup !== b.comparisonGroup) reasons.push({kind: 'group'});
  if (a.unit !== b.unit) reasons.push({kind: 'unit'});
  if (a.measure !== b.measure) reasons.push({kind: 'measure'});
  if (a.chainIds === 'multichain-unsplit' || b.chainIds === 'multichain-unsplit') reasons.push({kind: 'multichain'});
  else if (chains(a) !== chains(b)) reasons.push({kind: 'chains'});
  if ((a.ratePeriod ?? '') !== (b.ratePeriod ?? '')) reasons.push({kind: 'rate'});
  if (Boolean(a.interval) !== Boolean(b.interval)) reasons.push({kind: 'timeBasis'});
  else if (timeBasis(a) !== timeBasis(b)) {
    const days = Math.abs(daysBetween(a.asOf ?? a.interval!.end, b.asOf ?? b.interval!.end));
    reasons.push(days ? {kind: 'dates', days} : {kind: 'timeBasis'});
  }
  return reasons;
}

const dateOf = (observation: Observation) => observation.asOf ?? observation.interval?.end ?? '';

/**
 * Lines up observations about the compared objects. A group appears when at
 * least two objects have an observation in it; each object contributes its
 * latest observations in the group. Everything else is listed per object,
 * newest first.
 */
export function compareObservations(objectIds: readonly string[], observations: readonly Observation[]): ObservationComparison {
  const about = objectIds.map(id => observations.filter(o => o.subjectId === id));
  const groupIds = [...new Set(about.flat().flatMap(o => (o.comparisonGroup ? [o.comparisonGroup] : [])))];
  const groups: ComparedGroup[] = [];
  const used = new Set<string>();
  for (const group of groupIds) {
    const cells = about.map(list => {
      const inGroup = list.filter(o => o.comparisonGroup === group);
      const latest = inGroup.reduce((best, o) => (dateOf(o) > best ? dateOf(o) : best), '');
      return inGroup.filter(o => dateOf(o) === latest);
    });
    if (cells.filter(cell => cell.length).length < 2) continue;
    const all = cells.flat();
    const reasons = new Map<string, Reason>();
    for (const other of all.slice(1)) for (const reason of incompatibility(all[0], other)) reasons.set(JSON.stringify(reason), reason);
    for (const o of all) used.add(o.id);
    const metrics = new Set(all.map(o => o.metric));
    groups.push({group, cells, ...(metrics.size === 1 ? {metric: all[0].metric} : {}), comparable: reasons.size === 0, reasons: [...reasons.values()]});
  }
  const newestFirst = (a: Observation, b: Observation) => dateOf(b).localeCompare(dateOf(a));
  return {groups, separate: about.map(list => list.filter(o => !used.has(o.id)).sort(newestFirst))};
}

export type CompareView = 'table' | 'stacked';

export interface CompareParams {
  ids: string[];
  /** Inputs that are not EDI records (shown back to the reader, never resolved by name). */
  unknown: string[];
  /** True when more objects were asked for than can be compared. */
  truncated: boolean;
  view: CompareView | null;
  /** Set when the request should be redirected to its canonical form. */
  canonical: string;
}

const clean = (value: string) => cleanText(value).replace(/ /g, '');

/**
 * Reads ?ids=a,b,c (also repeated ids=), plus the add, left/right and view
 * controls of the compare form. `resolve` maps an EDI ID or a profile slug to
 * the EDI ID; anything else is reported, never guessed.
 */
export function parseCompareParams(params: URLSearchParams, resolve: (value: string) => string | undefined, max: number): CompareParams {
  const raw = params.getAll('ids').flatMap(value => value.split(',')).map(clean).filter(Boolean).slice(0, 32);
  const ids: string[] = [];
  const unknown: string[] = [];
  for (const value of raw) {
    const id = value.length <= 256 ? resolve(value) : undefined;
    if (!id) unknown.push(value.slice(0, 80));
    else if (!ids.includes(id)) ids.push(id);
  }
  const add = clean(params.get('add') ?? '');
  const added = add ? resolve(add) : undefined;
  if (add && !added) unknown.push(add.slice(0, 80));
  if (added && !ids.includes(added)) ids.push(added);
  let truncated = ids.length > max;
  ids.splice(max);
  // A chosen pair moves to the front, so a phone shows those two side by side.
  const left = resolve(clean(params.get('left') ?? ''));
  const right = resolve(clean(params.get('right') ?? ''));
  const pair = [left, right].filter((id, i, all): id is string => id !== undefined && ids.includes(id) && all.indexOf(id) === i);
  const ordered = [...pair, ...ids.filter(id => !pair.includes(id))];
  const viewParam = params.get('view');
  const view: CompareView | null = viewParam === 'stacked' || viewParam === 'table' ? viewParam : null;
  if (params.getAll('ids').join(',').length > 2048) truncated = true;
  const query = [ordered.length ? `ids=${ordered.map(id => encodeURIComponent(id).replace(/%3A/gi, ':')).join(',')}` : '', view ? `view=${view}` : ''].filter(Boolean).join('&');
  return {ids: ordered, unknown, truncated, view, canonical: query};
}
