/** The sitemap index: one sitemap per locale, each with hreflang alternates. */
import type {APIRoute} from 'astro';
import {sitemapIndex} from '../server/agents.ts';
import {siteOrigin, textResponse} from '../server/http.ts';

export const GET: APIRoute = ({url}) => textResponse(sitemapIndex(siteOrigin(url)), 'application/xml; charset=utf-8');
