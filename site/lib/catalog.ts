import {registry,registryAssessment,reviewTiming} from '@/vendor/edi/dist/registry/index.js';
import type {Profile,Role} from './schema';
import {utcToday} from './edition';
import {networkIdentity} from './networks';
export {registry,registryAssessment,reviewTiming};
export const slugFor=(id:string)=>id.replaceAll(':','--');
export const idFor=(slug:string)=>registry.entities.find(e=>slugFor(e.id)===slug)?.id;
export function roleFor(id:string,kind:string,profiles:Profile[]):Role {
 const p=profiles.find(p=>p.id===id);if(p)return p.role;
 if(kind==='chain')return 'network';
 if(kind==='asset')return /usd|dai|eurc/.test(id)?'money':'assets';
 if(/uniswap|curve|balancer|aerodrome|pancake|1inch/.test(id))return 'exchange';
 if(/aave|compound|liquity|morpho|spark|fluid/.test(id))return 'lending';
 if(/stak|lido|rocket|eigen|restak|ether-fi|frax-ether/.test(id))return 'staking';
 if(/usd|dai|eurc/.test(id))return 'money';
 return kind==='asset'?'assets':'infrastructure';
}
/**
 * @cc [label:product] edi-is-authority
 * Mechanism and position assessments MUST come from the pinned EDI functions at
 * the evaluation date. Editorial fields MUST NOT supply or promote a D grade.
 */
export function catalog(profiles:Profile[],asOf=utcToday()){
 return registry.entities.map(e=>({id:e.id,slug:slugFor(e.id),name:profiles.find(p=>p.id===e.id)?.title||e.name,kind:e.kind,role:roleFor(e.id,e.kind,profiles),aliases:e.aliases,scope:e.scope,reason:e.reason,controls:e.controls,dependencies:e.dependencies,addresses:e.canonicalAddresses||{},reviewedAt:e.reviewedAt,assessment:registryAssessment(e.id,asOf),position:registryAssessment(e.id,asOf,{scope:'position'}),positionReview:e.positionReview||null,timing:reviewTiming(e,asOf),profile:profiles.find(p=>p.id===e.id)||null,networks:networkIds(e),evidenceUrls:e.evidenceUrls}));
}

export function networkIds(e:typeof registry.entities[number]):string[]{
 if(e.kind==='chain')return [networkIdentity(e)];
 return [...new Set([...Object.keys(e.canonicalAddresses||{}),...(e.id==='native-eth'?['1']:[])])];
}
export const NETWORKS=[...new Map(registry.entities.filter(e=>e.kind==='chain').map(e=>[networkIdentity(e),e.name])).entries()];
export type CatalogRow=ReturnType<typeof catalog>[number];
export interface Filters {q:string;role:string;kind:string;network:string;grade:string;floor:string;review:string;story:string;sort:string;page:number;ids:string[]}
export const DEFAULT_FILTERS:Filters={q:'',role:'all',kind:'all',network:'all',grade:'all',floor:'all',review:'all',story:'all',sort:'curated',page:1,ids:[]};
export function parseFilters(p:URLSearchParams):Filters{
 const choose=(k:string,values:string[])=>values.includes(p.get(k)||'')?p.get(k)!:'all';
 return {q:(p.get('q')||'').slice(0,200),role:choose('role',['money','exchange','lending','settlement','network','staking','assets','infrastructure']),kind:choose('kind',['chain','asset','protocol']),network:choose('network',[...NETWORKS.map(([id])=>id),'unbound']),grade:choose('grade',Array.from({length:10},(_,i)=>String(i))),floor:choose('floor',Array.from({length:10},(_,i)=>String(i))),review:choose('review',['complete','partial','unknown','overdue','permanent']),story:choose('story',['yes']),sort:['curated','alphabetical','reviewed','gradeAsc','gradeDesc'].includes(p.get('sort')||'')?p.get('sort')!:'curated',page:Math.max(1,Math.min(100,Number.parseInt(p.get('page')||'1')||1)),ids:[...new Set((p.get('ids')||'').slice(0,500).split(',').filter(id=>registry.entities.some(e=>e.id===id)))].slice(0,4)};
}
export function filterQuery(f:Filters){const p=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(k==='ids'){if(f.ids.length)p.set(k,f.ids.join(','));}else if(v!==DEFAULT_FILTERS[k as keyof Filters])p.set(k,String(v));});return p.toString();}
export function invalidFilterValues(p:URLSearchParams){
 const parsed=parseFilters(p);
 for(const [key,value] of p){
  if(key==='panel'){if(value!=='filters')return true;continue}
  if(!Object.hasOwn(DEFAULT_FILTERS,key)||p.getAll(key).length>1)return true;
  const normalized=parsed[key as keyof Filters];
  if((Array.isArray(normalized)?normalized.join(','):String(normalized))!==value)return true;
 }
 return false;
}
const order=['uniswap-v4','usdc','morpho-blue','buidl','weth9','base','uniswap-v2','seaport-v1.6','paxg','native-eth','pyusd','uniswap-v3'];
/**
 * @cc [label:product] complete-grade-filter
 * Exact-grade filters include assessed mechanisms only. Floors and unknowns MUST
 * remain separate from complete grades, including when sorting by grade.
 */
export function filterRows(rows:CatalogRow[],f:Filters,collection?:string,lexicon:Record<string,string>={}){
 const q=f.q.toLocaleLowerCase().trim();const address=q.match(/^(?:(\d+):)?(0x[a-f0-9]{40})$/);
 const match=(r:CatalogRow)=>`${r.id} ${r.name} ${r.aliases.join(' ')} ${r.role} ${lexicon[r.role==='network'?'networkRole':r.role]||''} ${r.profile?.tags.join(' ')||''} ${r.profile?.summary||''} ${r.reason} ${r.controls.join(' ')} ${r.scope} ${Object.entries(r.addresses).map(([c,a])=>c+':'+a).join(' ')}`.toLowerCase();
 let result=rows.filter(r=>{
 const a=r.assessment;
 if(collection==='d0'&&!(a.status==='assessed'&&a.effectiveLevel===0))return false;
 if(collection==='global-economy'&&!r.profile?.global)return false;
 if(q&&(address?!Object.entries(r.addresses).some(([c,a])=>(!address[1]||address[1]===c)&&a.toLowerCase()===address[2]):!q.split(/\s+/).every(w=>match(r).includes(w))))return false;
 return (f.role==='all'||r.role===f.role)&&(f.kind==='all'||r.kind===f.kind)&&(f.network==='all'||(f.network==='unbound'?r.networks.length===0:r.networks.includes(f.network)))&&(f.grade==='all'||a.status==='assessed'&&a.effectiveLevel===Number(f.grade))&&(f.floor==='all'||(a.effectiveLevel??a.knownFloor??-1)>=Number(f.floor))&&(f.review==='all'||f.review==='complete'&&a.status==='assessed'||f.review==='partial'&&a.status==='partial'||f.review==='unknown'&&a.status==='unreviewed'||f.review==='overdue'&&r.timing.overdue||f.review==='permanent'&&r.timing.permanent)&&(f.story==='all'||!!r.profile?.storyIds.length);
 });
 const rank=(r:CatalogRow)=>q&&(r.id===q||r.name.toLowerCase()===q||r.aliases.some(a=>a.toLowerCase()===q))?-1000:order.includes(r.id)?order.indexOf(r.id):100;
 result=result.sort((a,b)=>{if(f.sort==='alphabetical')return a.name.localeCompare(b.name);if(f.sort==='reviewed')return b.reviewedAt.localeCompare(a.reviewedAt);if(f.sort.startsWith('grade')){const aa=a.assessment,bb=b.assessment;if(aa.status!=='assessed'||bb.status!=='assessed')return (aa.status==='assessed'?-1:0)+(bb.status==='assessed'?1:0)||a.name.localeCompare(b.name);return ((aa.effectiveLevel??0)-(bb.effectiveLevel??0))*(f.sort==='gradeDesc'?-1:1)||a.name.localeCompare(b.name);}return rank(a)-rank(b)||a.name.localeCompare(b.name);});
 return result;
}
