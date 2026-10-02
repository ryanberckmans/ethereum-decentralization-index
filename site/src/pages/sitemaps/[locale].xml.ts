import type {APIRoute} from 'astro';
import {isLocale} from '../../config.ts';
import {localeSitemap} from '../../server/agents.ts';
import {siteOrigin, textResponse} from '../../server/http.ts';

export const GET: APIRoute = ({params, url}) => {
  const {locale} = params;
  if (!isLocale(locale)) return new Response('Not found', {status: 404, headers: {'content-type': 'text/plain; charset=utf-8'}});
  return textResponse(localeSitemap(siteOrigin(url), locale), 'application/xml; charset=utf-8');
};
