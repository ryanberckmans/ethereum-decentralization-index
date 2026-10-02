/** One locale's sitemap, written when the build knows the public address (see ../[sitemap].xml.ts). */
import type {APIRoute} from 'astro';
import {LOCALES, type Locale} from '../../config.ts';
import {localeSitemap} from '../../server/agents.ts';
import {textFile} from '../../server/http.ts';
import {SITE_URL} from '../../server/origin.ts';

export function getStaticPaths() {
  return SITE_URL ? LOCALES.map(locale => ({params: {locale}})) : [];
}

export const GET: APIRoute = ({params}) => textFile(localeSitemap(SITE_URL, params.locale as Locale), 'application/xml; charset=utf-8');
