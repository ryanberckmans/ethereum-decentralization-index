/** Dated editorial figures with their unit, time basis, scope and sources. */
import type {APIRoute} from 'astro';
import {observationsExport} from '../../../server/exports.ts';
import {jsonResponse} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonResponse(observationsExport(evaluationDateFor()));
