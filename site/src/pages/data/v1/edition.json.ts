/** The edition manifest: provenance, evaluation date and the list of exports. */
import type {APIRoute} from 'astro';
import {editionManifest} from '../../../server/exports.ts';
import {jsonResponse, siteOrigin} from '../../../server/http.ts';
import {evaluationDateFor} from '../../../server/site.ts';

export const GET: APIRoute = ({url}) => jsonResponse(editionManifest(evaluationDateFor(), siteOrigin(url)));
