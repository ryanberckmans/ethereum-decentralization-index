/**
 * Bodies for the generated files. The build writes each one to a file whose
 * extension tells a static host its type; caching and cross-origin headers
 * are the host's (docs/hosting.md).
 */
export function jsonFile(body: unknown): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {headers: {'content-type': 'application/json; charset=utf-8'}});
}

export function textFile(body: string, contentType: string): Response {
  return new Response(body, {headers: {'content-type': contentType}});
}
