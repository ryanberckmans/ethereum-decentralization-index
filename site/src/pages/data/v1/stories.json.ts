/** Stories with their thesis, objects, evidence and plain text. */
import type {APIRoute} from 'astro';
import {storiesExport} from '../../../server/exports.ts';
import {jsonResponse, siteOrigin} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = ({url}) => jsonResponse(storiesExport(evaluationDateFor(), siteOrigin(url)));
