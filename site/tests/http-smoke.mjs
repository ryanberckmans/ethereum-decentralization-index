// Direct requests to the built fetch handler: these are server/content checks,
// not browser, layout, hydration, accessibility or deployed-Cloudflare tests.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import handler from '../dist/server/index.js';
const out=process.env.EDI_QA_OUTPUT;
const context={props:{},waitUntil(p){p.catch(()=>{})},passThroughOnException(){}};
const request=(path,headers={})=>handler.fetch(new Request('https://validation.invalid'+path,{headers}),{},context);
let count=0;
for(const locale of ['en','es','pt-BR','fr','de','zh-CN','ja','ko']){
 const response=await request('/'+locale);assert.equal(response.status,200,locale);
 const html=await response.text();assert(html.includes('lang="'+locale+'"'),locale+' SSR language');
 assert(html.includes('Uniswap v4')&&html.includes('USDC'),locale+' populated SSR');
 assert(response.headers.get('content-security-policy')?.includes("object-src 'none'"));
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 if(out&&locale==='en'){await mkdir(out,{recursive:true});await writeFile(out+'/directory-response.html',html)}
 count++;
}
for(const path of ['/en?q=Uniswap&grade=0','/en/objects/uniswap-v4','/en/objects/morpho-blue','/en/objects/weth9','/en/objects/usdc','/en/objects/token--golem','/fr/stories/morpho-distribution','/de/collections/d0','/zh-CN/collections/global-economy','/ja/methodology','/ko/compare?ids=usdc,weth9,morpho-blue,base','/pt-BR/changes']){
 const response=await request(path);assert.equal(response.status,200,path);const html=await response.text();assert(html.includes('<main'),path);count++;
}
for(const path of ['/en/objects/not-real','/de/stories/not-real','/en/not-real','/data/source.zip','/en/objects/weth9/extra']){
 const response=await request(path);assert.equal(response.status,404,path);await response.text();count++;
}
const root=await request('/',{cookie:'edi-language=ja'});assert([307,308].includes(root.status));assert.equal(root.headers.get('location'),'/ja');count++;
const json=await request('/data/directory.json');assert.equal(json.status,200);const data=await json.json();assert.equal(data.objects.length,118);assert.equal(data.edition.ediCommit,'60c755565f285c379af7e23c20f50adc59eac57d');count++;
const csv=await request('/data/directory.csv');assert.equal(csv.status,200);assert((await csv.text()).includes('"position_coverage"'));count++;
const evidence=await request('/data/observations.json');assert.equal(evidence.status,200);const observations=await evidence.json();assert.equal(observations.observations.length,3);assert.equal(observations.relationships.length,12);count++;
const sitemap=await request('/sitemap.xml');assert.equal(sitemap.status,503);await sitemap.text();count++;
const robots=await request('/robots.txt');assert.equal(robots.status,200);assert(!(await robots.text()).includes('undefined'));count++;
process.env.SITE_URL='https://directory.example';
const configuredMap=await request('/sitemap.xml');assert.equal(configuredMap.status,200);const xml=await configuredMap.text();assert(xml.includes('<loc>https://directory.example/en</loc>'));assert(xml.includes('/ja/objects/weth9'));count++;
const configuredPage=await request('/en/objects/weth9');const head=await configuredPage.text();assert(head.includes('rel="canonical" href="https://directory.example/en/objects/weth9"'));count++;delete process.env.SITE_URL;
const files=JSON.parse(await readFile('dist/client/vinext-client-entry-manifest.json','utf8'));
console.log(JSON.stringify({requestsPassed:count,workerFetch:typeof handler.fetch,clientManifestKeys:Object.keys(files)}));
