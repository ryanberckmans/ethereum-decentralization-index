/** Response helpers for data endpoints. */
import {msUntilUtcMidnight} from '../model/dates.ts';

/** The public origin: PUBLIC_SITE_URL when configured, else the request's own. */
export function siteOrigin(url: URL): string {
  return (import.meta.env.PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') || url.origin;
}

/** A response that depends on the UTC date may be cached for at most an hour, and never past midnight UTC. */
export function datedMaxAge(now: Date = new Date()): number {
  return Math.max(0, Math.min(3600, Math.floor(msUntilUtcMidnight(now) / 1000)));
}

const COMMON = {
  'x-content-type-options': 'nosniff',
  // Public, credential-free data: any site or agent may read it.
  'access-control-allow-origin': '*',
};

export function jsonResponse(body: unknown, {status = 200, maxAge = datedMaxAge()}: {status?: number; maxAge?: number} = {}): Response {
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    status,
    headers: {...COMMON, 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}`},
  });
}

export function csvResponse(body: string, filename: string, {maxAge = datedMaxAge()}: {maxAge?: number} = {}): Response {
  return new Response(body, {
    headers: {
      ...COMMON,
      'content-type': 'text/csv; charset=utf-8; header=present',
      'content-disposition': `attachment; filename="${filename.replace(/[^\w.-]/g, '_')}"`,
      'cache-control': `public, max-age=${maxAge}`,
    },
  });
}

export function textResponse(body: string, contentType: string, {maxAge = 3600}: {maxAge?: number} = {}): Response {
  return new Response(body, {headers: {...COMMON, 'content-type': contentType, 'cache-control': `public, max-age=${maxAge}`}});
}
