/** Values that depend on the evaluation date, kept for every later EDI change date. */
import type {Segment} from '../model/view-types.ts';
import {catalog} from './site.ts';

/**
 * `compute` evaluated on `date` and on each later EDI change date, keeping a
 * new segment only when the value changes. Rendered with <Dated>, a cached
 * page or a tab left open past a deadline still shows the right list or count.
 */
export function datedValues<T>(date: string, compute: (date: string) => T, key: (value: T) => string = value => JSON.stringify(value)): Segment<T>[] {
  const out: Segment<T>[] = [{from: date, value: compute(date)}];
  for (const change of catalog.changeDates) {
    if (change <= date) continue;
    const value = compute(change);
    if (key(value) !== key(out[out.length - 1].value)) out.push({from: change, value});
  }
  return out;
}

/** Records whose complete EDI mechanism assessment is D0 on `date`, in the editor's order. */
export function completeD0(date: string): string[] {
  return catalog.objects
    .filter(object => {
      const state = catalog.rawOn(object.id, date).mechanism;
      return state.status === 'assessed' && state.effectiveLevel === 0;
    })
    .map(object => object.id);
}
