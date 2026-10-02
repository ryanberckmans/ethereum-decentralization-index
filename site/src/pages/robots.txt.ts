import type {APIRoute} from 'astro';
import {robotsTxt} from '../server/agents.ts';
import {siteOrigin, textResponse} from '../server/http.ts';

export const GET: APIRoute = ({url}) => textResponse(robotsTxt(siteOrigin(url)), 'text/plain; charset=utf-8', {maxAge: 86400});
