/**
 * The read model, built once per build from the validated edition.
 * Server-only: the edition module refuses to load in browser bundles.
 */
import bundle from 'virtual:edi-edition';
import {createCatalog} from '../model/catalog.ts';
import {maxDate, utcToday} from '../model/dates.ts';

export const catalog = createCatalog(bundle);

/**
 * The UTC date EDI is evaluated for at `now`. EDI cannot be asked about a
 * date before its own registry, so a skewed clock never produces an error.
 */
export function evaluationDateFor(now: Date = new Date()): string {
  return maxDate(utcToday(now), catalog.registryDate);
}

/**
 * The date every page and file of this build is evaluated for: the day it is
 * built (UTC). Pages also carry EDI's later results, and the browser shows the
 * one for the reader's date; the files list the dates results change on.
 */
export const EVALUATION_DATE = evaluationDateFor();
