/**
 * The compact directory index for one locale, loaded by the directory,
 * compare and not-found pages. It is valid for every date (entries carry
 * their EDI timelines), so only a new edition changes it.
 */
import type {APIRoute} from 'astro';
import {LOCALES, type Locale} from '../../config.ts';
import {indexFor} from '../../server/directory.ts';

export function getStaticPaths() {
  return LOCALES.map(locale => ({params: {locale}}));
}

export const GET: APIRoute = ({params}) =>
  new Response(JSON.stringify(indexFor(params.locale as Locale)), {headers: {'content-type': 'application/json; charset=utf-8'}});
