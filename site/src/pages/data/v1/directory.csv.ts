/** The directory as CSV, one row per EDI record, formula-safe. */
import type {APIRoute} from 'astro';
import {directoryCsv} from '../../../server/exports.ts';
import {csvResponse, siteOrigin} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = ({url}) => {
  const date = evaluationDateFor();
  return csvResponse(directoryCsv(date, siteOrigin(url)), `edi-directory-${date}.csv`);
};
