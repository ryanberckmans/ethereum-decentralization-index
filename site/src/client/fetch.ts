/**
 * Loads one of the site's own data files.
 *
 * @cc [label:security] bounded-external-work
 * The directory, compare and not-found pages load only the active locale's
 * data files, from the same origin, without credentials, abandoned after 15
 * seconds and rejected unless they have the expected version. There are no
 * third-party calls on the visitor path (the CSP's connect-src is 'self').
 */
export async function fetchSiteJson<T extends {version: number}>(url: string): Promise<T> {
  if (new URL(url, location.href).origin !== location.origin) throw new Error('Only the site’s own files are loaded');
  const response = await fetch(url, {credentials: 'same-origin', signal: AbortSignal.timeout(15_000)});
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const value = (await response.json()) as T;
  if (value?.version !== 1) throw new Error('Unexpected data format');
  return value;
}
