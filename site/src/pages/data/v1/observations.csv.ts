/** Dated editorial figures as CSV, formula-safe. */
import type {APIRoute} from 'astro';
import {observationsCsv} from '../../../server/exports.ts';
import {csvResponse} from '../../../server/http.ts';
import {catalog} from '../../../server/site.ts';

export const GET: APIRoute = () => csvResponse(observationsCsv(), `edi-observations-${catalog.edition.id}.csv`, {maxAge: 3600});
