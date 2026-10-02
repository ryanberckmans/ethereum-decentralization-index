import {siteOrigin} from '@/lib/site-origin';
import {LOCALES} from '@/lib/schema';
import {registry,slugFor} from '@/lib/catalog';
import ed from '@/content/en.json';
export function GET(){const origin=siteOrigin();if(!origin)return new Response('A canonical origin is required before publication.',{status:503,headers:{'Content-Type':'text/plain'}});const paths=['','stories','methodology','changes','collections/d0','collections/global-economy',...registry.entities.map(e=>'objects/'+slugFor(e.id)),...ed.stories.map(s=>'stories/'+s.id)];const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+LOCALES.flatMap(l=>paths.map(p=>'<url><loc>'+origin+'/'+l+(p?'/'+p:'')+'</loc></url>')).join('')+'</urlset>';return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}})}
