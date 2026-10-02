/**
 * Every dynamic response passes through here: URL normalization and the
 * language choice for the bare root, then security and caching headers.
 * Static files get the same headers from public/_headers.
 */
import {defineMiddleware} from 'astro:middleware';
import {isLocale} from './config.ts';
import {negotiateLocale, routeRedirect} from './server/routing.ts';

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'accelerometer=(), browsing-topics=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
};

/** Adds `defaults` where the route set nothing, and always sets `replace`. */
function withHeaders(response: Response, defaults: Record<string, string>, replace: Record<string, string> = {}): Response {
  const apply = (target: Response) => {
    for (const [name, value] of Object.entries(defaults)) if (!target.headers.has(name)) target.headers.set(name, value);
    for (const [name, value] of Object.entries(replace)) target.headers.set(name, value);
    return target;
  };
  try {
    return apply(response);
  } catch {
    // Some responses (redirects, fetched bodies) have immutable headers; copy them.
    return apply(new Response(response.body, response));
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const {url, request, cookies} = context;
  const https = url.protocol === 'https:';
  const security = https ? {...SECURITY_HEADERS, 'strict-transport-security': 'max-age=31536000; includeSubDomains'} : SECURITY_HEADERS;

  const redirect = routeRedirect(url, () => negotiateLocale(cookies.get('edi-lang')?.value, request.headers.get('accept-language')));
  if (redirect) {
    return new Response(null, {
      status: redirect.status,
      headers: {
        ...security,
        location: redirect.location,
        'cache-control': redirect.negotiated ? 'private, max-age=0' : 'public, max-age=86400',
        ...(redirect.negotiated ? {vary: 'accept-language, cookie'} : {}),
      },
    });
  }

  const response = await next();
  const type = response.headers.get('content-type') ?? '';
  const extra: Record<string, string> = {...security};
  const replace: Record<string, string> = {};
  if (type.startsWith('text/html')) {
    if (!/charset/i.test(type)) replace['content-type'] = 'text/html; charset=utf-8';
    const segment = url.pathname.split('/')[1];
    if (isLocale(segment)) extra['content-language'] = segment;
    // Pages show EDI results for the UTC date; the page script corrects a copy kept past midnight.
    extra['cache-control'] = response.status === 200 ? 'public, max-age=300' : 'public, max-age=60';
  }
  return withHeaders(response, extra, replace);
});
