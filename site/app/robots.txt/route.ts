import {siteOrigin} from '@/lib/site-origin';
export function GET(){const origin=siteOrigin();return new Response('User-agent: *\nAllow: /\n'+(origin?'Sitemap: '+origin+'/sitemap.xml\n':''),{headers:{'Content-Type':'text/plain; charset=utf-8'}})}
