/** The directory as CSV, one row per EDI record, formula-safe. */
import type {APIRoute} from 'astro';
import {directoryCsv} from '../../../server/exports.ts';
import {textFile} from '../../../server/http.ts';
import {SITE_URL} from '../../../server/origin.ts';
import {EVALUATION_DATE} from '../../../server/site.ts';

export const GET: APIRoute = () => textFile(directoryCsv(EVALUATION_DATE, SITE_URL), 'text/csv; charset=utf-8; header=present');
