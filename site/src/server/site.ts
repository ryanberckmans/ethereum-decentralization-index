/**
 * The Worker's read model, built once per isolate from the validated edition.
 * Server-only: the edition module refuses to load in browser bundles.
 */
import bundle from 'virtual:edi-edition';
import {createCatalog} from '../model/catalog.ts';
import {maxDate, utcToday} from '../model/dates.ts';

export const catalog = createCatalog(bundle);

/**
 * The UTC date a request is evaluated for. EDI cannot be asked about a date
 * before its own registry, so a skewed clock never produces an error.
 */
export function evaluationDateFor(now: Date = new Date()): string {
  return maxDate(utcToday(now), catalog.registryDate);
}
