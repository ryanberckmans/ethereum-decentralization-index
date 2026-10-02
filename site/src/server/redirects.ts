/**
 * Addresses that lead to a page under another name: old slugs listed in
 * content/redirects.yaml, and raw EDI IDs or default slugs that differ from a
 * page's slug (seaport-v1.6 → seaport-v1-6). The build writes a small
 * redirect page at each, so they keep working on any static host and without
 * scripts. Names a file system cannot hold safely (EDI IDs with a colon) and
 * capitalized variants are resolved by the not-found page instead.
 */
import bundle from 'virtual:edi-edition';
import {defaultObjectSlug} from '../content/vocab.ts';
import type {Resolved} from '../model/catalog.ts';
import {catalog} from './site.ts';

const SAFE = /^[a-z0-9][a-z0-9._-]{0,127}$/;

function alternates<T extends {slug: string}>(candidates: readonly string[], resolve: (slug: string) => Resolved<T>): Map<string, string> {
  const out = new Map<string, string>();
  for (const candidate of candidates) {
    if (!SAFE.test(candidate) || out.has(candidate)) continue;
    const resolved = resolve(candidate);
    if (resolved.kind === 'redirect') out.set(candidate, resolved.slug);
  }
  return out;
}

/** Other names of object pages, each with the slug it leads to. */
export function objectRedirects(): Map<string, string> {
  const candidates = [...Object.keys(bundle.content.redirects.objects), ...catalog.objects.flatMap(object => [object.id, defaultObjectSlug(object.id)])];
  return alternates(candidates, slug => catalog.resolveObject(slug));
}

/** Other names of story pages, each with the slug it leads to. */
export function storyRedirects(): Map<string, string> {
  const candidates = [...Object.keys(bundle.content.redirects.stories), ...catalog.stories.map(story => story.id)];
  return alternates(candidates, slug => catalog.resolveStory(slug));
}
