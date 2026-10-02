/** Public guidance for agents: scope, how to read grades and dates, how to cite, and the data files. */
import type {APIRoute} from 'astro';
import {agentsMd} from '../server/agents.ts';
import {textFile} from '../server/http.ts';
import {SITE_URL} from '../server/origin.ts';
import {EVALUATION_DATE} from '../server/site.ts';

export const GET: APIRoute = () => textFile(agentsMd(SITE_URL, EVALUATION_DATE), 'text/markdown; charset=utf-8');
