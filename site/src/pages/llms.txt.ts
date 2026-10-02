/** A concise index of the site and its data for language models (llmstxt.org). */
import type {APIRoute} from 'astro';
import {llmsTxt} from '../server/agents.ts';
import {datedMaxAge, siteOrigin, textResponse} from '../server/http.ts';
import {evaluationDateFor} from '../server/site.ts';

export const GET: APIRoute = ({url}) => textResponse(llmsTxt(siteOrigin(url), evaluationDateFor()), 'text/plain; charset=utf-8', {maxAge: datedMaxAge()});
