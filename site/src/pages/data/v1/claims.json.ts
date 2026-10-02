/** Sourced claims with their evidence state. */
import type {APIRoute} from 'astro';
import {claimsExport} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(claimsExport(EVALUATION_DATE));
