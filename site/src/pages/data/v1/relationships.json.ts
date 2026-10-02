/** Typed, sourced editorial connections. */
import type {APIRoute} from 'astro';
import {relationshipsExport} from '../../../server/exports.ts';
import {jsonResponse} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonResponse(relationshipsExport(evaluationDateFor()));
