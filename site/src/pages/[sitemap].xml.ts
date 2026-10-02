/**
 * /sitemap.xml, the sitemap index: one sitemap per locale, each with hreflang
 * alternates. Sitemaps hold absolute addresses only, so the build writes them
 * only when it knows the public address (PUBLIC_SITE_URL).
 */
import type {APIRoute} from 'astro';
import {sitemapIndex} from '../server/agents.ts';
import {textFile} from '../server/http.ts';
import {SITE_URL} from '../server/origin.ts';

export function getStaticPaths() {
  return SITE_URL ? [{params: {sitemap: 'sitemap'}}] : [];
}

export const GET: APIRoute = () => textFile(sitemapIndex(SITE_URL), 'application/xml; charset=utf-8');
