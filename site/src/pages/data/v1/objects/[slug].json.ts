/** One record in full, at its current slug. */
import type {APIRoute} from 'astro';
import {objectExport} from '../../../../server/exports.ts';
import {jsonFile} from '../../../../server/http.ts';
import {SITE_URL} from '../../../../server/origin.ts';
import {catalog, EVALUATION_DATE} from '../../../../server/site.ts';

export function getStaticPaths() {
  return catalog.objects.map(object => ({params: {slug: object.slug}, props: {id: object.id}}));
}

export const GET: APIRoute = ({props}) => jsonFile(objectExport(catalog.object((props as {id: string}).id)!, EVALUATION_DATE, SITE_URL));
