/** Every EDI record with its EDI results for the build's evaluation date, and the later results EDI's review dates bring. */
import type {APIRoute} from 'astro';
import {directoryExport} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {SITE_URL} from '../../../server/origin.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(directoryExport(EVALUATION_DATE, SITE_URL));
