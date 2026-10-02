/**
 * What the compare page loads besides the directory index: each record's
 * limits and the figures it can line up, formatted for one locale.
 */
import type {APIRoute} from 'astro';
import {LOCALES, type Locale} from '../../config.ts';
import {compareData} from '../../server/compare-data.ts';

export function getStaticPaths() {
  return LOCALES.map(locale => ({params: {locale}}));
}

export const GET: APIRoute = ({params}) =>
  new Response(JSON.stringify(compareData(params.locale as Locale)), {headers: {'content-type': 'application/json; charset=utf-8'}});
