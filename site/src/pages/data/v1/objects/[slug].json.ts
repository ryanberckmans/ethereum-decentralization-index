/** One record in full. Old slugs and raw EDI IDs redirect to the current slug. */
import type {APIRoute} from 'astro';
import {EXPORTS} from '../../../../model/urls.ts';
import {objectExport, SCHEMA_VERSION} from '../../../../server/exports.ts';
import {jsonResponse, siteOrigin} from '../../../../server/http.ts';
import {catalog, evaluationDateFor} from '../../../../server/site.ts';

export const GET: APIRoute = ({params, url, redirect}) => {
  const slug = params.slug ?? '';
  const resolved = slug.length <= 256 ? catalog.resolveObject(slug) : ({kind: 'missing'} as const);
  if (resolved.kind === 'redirect') return redirect(EXPORTS.object(resolved.slug), 301);
  if (resolved.kind === 'missing') return jsonResponse({schemaVersion: SCHEMA_VERSION, error: 'not-found', message: 'No EDI record has this slug.'}, {status: 404, maxAge: 300});
  return jsonResponse(objectExport(resolved.value, evaluationDateFor(), siteOrigin(url)));
};
