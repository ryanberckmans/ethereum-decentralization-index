/** Crawling rules, and the sitemap index when the build knows the public address. */
import type {APIRoute} from 'astro';
import {robotsTxt} from '../server/agents.ts';
import {textFile} from '../server/http.ts';
import {SITE_URL} from '../server/origin.ts';

export const GET: APIRoute = () => textFile(robotsTxt(SITE_URL), 'text/plain; charset=utf-8');
