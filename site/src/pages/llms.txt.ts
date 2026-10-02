/** A concise index of the site and its data for language models (llmstxt.org). */
import type {APIRoute} from 'astro';
import {llmsTxt} from '../server/agents.ts';
import {textFile} from '../server/http.ts';
import {SITE_URL} from '../server/origin.ts';
import {EVALUATION_DATE} from '../server/site.ts';

export const GET: APIRoute = () => textFile(llmsTxt(SITE_URL, EVALUATION_DATE), 'text/plain; charset=utf-8');
