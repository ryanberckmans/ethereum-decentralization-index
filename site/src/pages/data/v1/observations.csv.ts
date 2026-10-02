/** Dated editorial figures as CSV, formula-safe. */
import type {APIRoute} from 'astro';
import {observationsCsv} from '../../../server/exports.ts';
import {textFile} from '../../../server/http.ts';

export const GET: APIRoute = () => textFile(observationsCsv(), 'text/csv; charset=utf-8; header=present');
