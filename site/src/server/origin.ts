/**
 * The site's public address. The build reads it from PUBLIC_SITE_URL for the
 * addresses that must be absolute: social card images, language alternates,
 * structured data, sitemaps, and the links in exports and agent files.
 * Without it the build still works: links are relative to whichever host
 * serves the files, and the sitemaps, which must be absolute, are not built.
 */

/** An origin such as https://directory.example.org, or '' when the value is empty. */
export function siteUrl(value: string | undefined): string {
  const text = value?.trim();
  if (!text) return '';
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`PUBLIC_SITE_URL is not a URL: ${text}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`PUBLIC_SITE_URL must start with https:// (got ${url.protocol})`);
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password)
    throw new Error(`PUBLIC_SITE_URL must be an origin such as https://directory.example.org; the site is served from the root of its host (got ${text})`);
  return url.origin;
}

export const SITE_URL = siteUrl(import.meta.env?.PUBLIC_SITE_URL as string | undefined);

/** A site address as absolute as the build can make it: relative when the public address is unknown. */
export function siteHref(path: string): string {
  return `${SITE_URL}${path}`;
}
