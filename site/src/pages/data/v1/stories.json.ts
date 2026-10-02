/** Stories with their thesis, objects, evidence and plain text. */
import type {APIRoute} from 'astro';
import {storiesExport} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {SITE_URL} from '../../../server/origin.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(storiesExport(EVALUATION_DATE, SITE_URL));
