/** The edition manifest: provenance, evaluation date and the list of exports. */
import type {APIRoute} from 'astro';
import {editionManifest} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {SITE_URL} from '../../../server/origin.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(editionManifest(EVALUATION_DATE, SITE_URL));
