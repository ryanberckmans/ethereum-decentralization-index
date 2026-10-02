/** Every EDI record with its EDI results for today's UTC date. */
import type {APIRoute} from 'astro';
import {directoryExport} from '../../../server/exports.ts';
import {jsonResponse, siteOrigin} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = ({url}) => jsonResponse(directoryExport(evaluationDateFor(), siteOrigin(url)));
