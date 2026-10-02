/** Dated editorial figures with their unit, time basis, scope and sources. */
import type {APIRoute} from 'astro';
import {observationsExport} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(observationsExport(EVALUATION_DATE));
