/** Sourced claims with their evidence state. */
import type {APIRoute} from 'astro';
import {claimsExport} from '../../../server/exports.ts';
import {jsonResponse} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonResponse(claimsExport(evaluationDateFor()));
