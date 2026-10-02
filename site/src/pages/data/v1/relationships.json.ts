/** Typed, sourced editorial connections. */
import type {APIRoute} from 'astro';
import {relationshipsExport} from '../../../server/exports.ts';
import {jsonFile} from '../../../server/http.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => jsonFile(relationshipsExport(EVALUATION_DATE));
