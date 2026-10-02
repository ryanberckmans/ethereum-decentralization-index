/** Public guidance for agents: scope, how to read grades and dates, how to cite, and the data endpoints. */
import type {APIRoute} from 'astro';
import {agentsMd} from '../server/agents.ts';
import {datedMaxAge, siteOrigin, textResponse} from '../server/http.ts';
import {evaluationDateFor} from '../server/site.ts';

export const GET: APIRoute = ({url}) => textResponse(agentsMd(siteOrigin(url), evaluationDateFor()), 'text/markdown; charset=utf-8', {maxAge: datedMaxAge()});
