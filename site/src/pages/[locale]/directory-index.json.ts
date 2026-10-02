/**
 * The compact directory index for one locale, loaded by the directory island.
 * It is valid for every date (entries carry their EDI timelines), so a
 * versioned URL can be cached as immutable.
 */
import type {APIRoute} from 'astro';
import {isLocale} from '../../config.ts';
import {catalog} from '../../server/site.ts';
import {indexFor} from '../../server/directory.ts';

export const GET: APIRoute = ({params, url}) => {
  const {locale} = params;
  if (!isLocale(locale)) return new Response('Not found', {status: 404});
  const versioned = url.searchParams.get('v') === catalog.edition.id;
  return new Response(JSON.stringify(indexFor(locale)), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  });
};
