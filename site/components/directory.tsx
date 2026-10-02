"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {Search,SlidersHorizontal,X} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Sheet,SheetContent,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {Choice} from './choice';
import {Badge} from './badge';
import {catalog,filterRows,filterQuery,parseFilters,invalidFilterValues,DEFAULT_FILTERS,NETWORKS,type Filters} from '@/lib/catalog';
import type {Locale,Profile,Story,UI} from '@/lib/schema';
import {utcToday,evaluationDay} from '@/lib/edition';
import {date} from '@/lib/format';
import {useDirectoryTools} from './directory-tools';
import {contextualSubjects} from '@/lib/relationships';
const roles=['money','exchange','lending','settlement','network','staking','assets','infrastructure'];
export function Directory({locale,t,profiles,stories,initial,asOf,collection,initialInvalid=false}:{locale:Locale;t:UI;profiles:Profile[];stories:Pick<Story,'id'|'title'|'subtitle'|'objectIds'|'collection'>[];initial:Filters;asOf:string;collection?:string;initialInvalid?:boolean}){
 const [filters,setFilters]=useState(initial),[day,setDay]=useState(asOf),[open,setOpen]=useState(false),[draft,setDraft]=useState(initial),[notice,setNotice]=useState(''),[invalid,setInvalid]=useState(initialInvalid);
 const typing=useRef(false);const search=useRef<HTMLInputElement>(null);
 const rows=useMemo(()=>catalog(profiles,day),[profiles,day]);const found=useMemo(()=>filterRows(rows,filters,collection,t),[rows,filters,collection]);
 const page=Math.min(filters.page,Math.max(1,Math.ceil(found.length/12)));const visible=found.slice((page-1)*12,page*12);
 const base=`/${locale}${collection?'/collections/'+collection:''}`;
 function change(next:Partial<Filters>,replace=false){const f={...filters,...next};if(!('page'in next)&&Object.keys(next).some(k=>k!=='ids'))f.page=1;typing.current=false;setFilters(f);setInvalid(false);const qs=filterQuery(f);history[replace?'replaceState':'pushState']({...history.state,ediSheet:false},'',base+(qs?'?'+qs:''));}
 useEffect(()=>{const pop=()=>{const p=new URLSearchParams(location.search),f=parseFilters(p);setFilters(f);setInvalid(invalidFilterValues(p));typing.current=false;setOpen(p.get('panel')==='filters');setDraft(f)};const dateChange=()=>setDay(evaluationDay(utcToday(),asOf));const key=(e:KeyboardEvent)=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)){e.preventDefault();search.current?.focus()}};window.addEventListener('popstate',pop);document.addEventListener('visibilitychange',dateChange);window.addEventListener('pageshow',dateChange);document.addEventListener('keydown',key);dateChange();setOpen(new URLSearchParams(location.search).get('panel')==='filters');const saved=history.state?.ediReturn;if(saved){requestAnimationFrame(()=>{document.getElementById(saved.id)?.focus({preventScroll:true});scrollTo(0,saved.y)})}const timer=setInterval(dateChange,60000);return()=>{window.removeEventListener('popstate',pop);document.removeEventListener('visibilitychange',dateChange);window.removeEventListener('pageshow',dateChange);document.removeEventListener('keydown',key);clearInterval(timer)}},[]);
 function openSheet(){setDraft(filters);const p=new URLSearchParams(location.search);p.set('panel','filters');history.pushState({...history.state,ediSheet:true},'','?'+p);setOpen(true)}
 function closeSheet(){setOpen(false);if(history.state?.ediSheet){history.back()}else{const p=new URLSearchParams(location.search);p.delete('panel');history.replaceState(history.state,'',base+(p.size?'?'+p:''))}}
 useDirectoryTools({filters,change,read:()=>({url:location.href,evaluatedAt:day,filters,count:found.length,page,results:visible.map(r=>({id:r.id,name:r.name,scope:r.scope,mechanism:r.assessment,profile:'/'+locale+'/objects/'+r.slug}))})});
 const controls=(f:Filters,set:(n:Partial<Filters>)=>void)=><>
  <Choice label={t.kind} value={f.kind} options={['all','asset','protocol','chain'].map(v=>[v,t[v]])} onChange={v=>set({kind:v})}/>
  <Choice label={t.network} value={f.network} options={[["all",t.all],...NETWORKS.map(([id,label])=>[id,id==="1"?t.mainnet:label] as [string,string]),["unbound",t.unspecified]]} onChange={v=>set({network:v})}/>
  <Choice label={t.grade} value={f.grade} options={[["all",t.all],...Array.from({length:10},(_,i)=>[String(i),'D'+i] as [string,string])]} onChange={v=>set({grade:v})}/>
  <Choice label={t.floor} value={f.floor} options={[["all",t.all],...Array.from({length:10},(_,i)=>[String(i),'≥ D'+i] as [string,string])]} onChange={v=>set({floor:v})}/>
  <Choice label={t.review} value={f.review} options={['all','complete','partial','unknown','overdue','permanent'].map(v=>[v,t[v]])} onChange={v=>set({review:v})}/>
  <label className="check-label"><Checkbox checked={f.story==='yes'} onCheckedChange={v=>set({story:v?'yes':'all'})}/>{t.withStory}</label>
 </>;
 const selected=rows.filter(r=>filters.ids.includes(r.id));
 const storyMatches=filters.q?stories.filter(s=>(s.title+' '+s.subtitle+' '+s.objectIds.join(' ')).toLowerCase().includes(filters.q.toLowerCase())):[];
 const collectionRows=filterRows(rows,{...DEFAULT_FILTERS},collection);
 const contextMatches=filters.q?contextualSubjects.filter(s=>s.kind!=='illustration'&&s.name.toLowerCase().includes(filters.q.toLowerCase())):[];
 const active=['role','kind','network','grade','floor','review','story'].filter(k=>filters[k as keyof Filters]!=='all').length;
 return <div className="directory-workspace">
  <aside className="filter-rail"><h2 className="eyebrow">{t.role}</h2><div className="role-list">{['all',...roles].map(role=><button key={role} className={filters.role===role?'role active':'role'} onClick={()=>change({role})}><span>{t[role==='network'?'networkRole':role]}</span><span className="small">{role==='all'?collectionRows.length:collectionRows.filter(r=>r.role===role).length}</span></button>)}</div><div className="rail-fields">{controls(filters,change)}</div><button className="text-button" onClick={()=>change({...DEFAULT_FILTERS,ids:filters.ids})}>{t.clear}</button><p className="rail-note">{t.notSafety}</p><Link href={`/${locale}/methodology`} className="underlined">{t.methodology}</Link></aside>
  <section className="results-area" aria-label={t.directory}>
   {invalid&&<p role="status" className="small">{t.invalidLink}</p>}
   <form role="search" className="search-bar" action={base} onSubmit={e=>{e.preventDefault();typing.current=false;search.current?.blur()}}><Search size={22} aria-hidden/><input ref={search} name="q" aria-label={t.search} placeholder={t.searchPlaceholder} value={filters.q} maxLength={200} onChange={e=>{change({q:e.target.value},typing.current);typing.current=true}}/>{filters.q&&<button type="button" className="icon-button" aria-label={t.clear} onClick={()=>{change({q:''});search.current?.focus()}}><X size={18}/></button>}<button className="button search-submit" type="submit">{t.searchAction}</button><span className="shortcut" aria-hidden>/</span></form>
   <div className="results-toolbar"><p role="status"><strong>{found.length}</strong> {t.objects}{active>0&&<> · {active} {t.filters.toLowerCase()}</>}</p><button className="button mobile-filter" onClick={openSheet}><SlidersHorizontal size={17}/>{t.filters}{active>0?' ('+active+')':''}</button><Choice label={t.sort} value={filters.sort} options={['curated','alphabetical','reviewed','gradeAsc','gradeDesc'].map(v=>[v,t[v]])} onChange={v=>change({sort:v})}/></div>
   {storyMatches.length>0&&<div className="story-search"><h2 className="small">{t.storyMatches}</h2>{storyMatches.map(s=><Link key={s.id} href={`/${locale}/stories/${s.id}`}>{s.title}</Link>)}</div>}
   {contextMatches.length>0&&<div className="story-search"><h2 className="small">{t.contextMatches}</h2>{contextMatches.map(s=><Link key={s.id} href={`/${locale}/stories/${s.storyIds[0]}`}>{s.name}</Link>)}<p className="small muted">{t.contextCoverage}</p></div>}
   <Table className="directory-table"><TableHeader><TableRow><TableHead className="select-cell"><span className="sr-only">{t.compare}</span></TableHead><TableHead>{t.object}</TableHead><TableHead className="role-cell">{t.role}</TableHead><TableHead>{t.mechanism}</TableHead><TableHead className="date-cell">{t.researchDate}</TableHead></TableRow></TableHeader><TableBody>{visible.map(r=><TableRow key={r.id} data-selected={filters.ids.includes(r.id)}>
    <TableCell className="select-cell"><Checkbox aria-label={(filters.ids.includes(r.id)?t.removeCompare:t.addCompare)+' '+r.name} checked={filters.ids.includes(r.id)} onCheckedChange={v=>{if(v&&filters.ids.length>=4){setNotice(t.compareLimit);return}setNotice('');change({ids:v?[...filters.ids,r.id]:filters.ids.filter(id=>id!==r.id)})}}/></TableCell>
    <TableCell className="object-cell"><Link href={`/${locale}/objects/${r.slug}`} prefetch={false} className="object-link" id={"result-"+r.id} onClick={()=>history.replaceState({...history.state,ediReturn:{id:"result-"+r.id,y:scrollY}},"",location.href)}><span className={'monogram role-'+r.role} aria-hidden>{r.name.slice(0,2).toUpperCase()}</span><span><strong>{r.name}</strong><span className="row-description">{r.profile?.summary||t.basic+' · '+t[r.kind]}</span><span className="row-meta">{t[r.kind]} · {r.networks.includes('1')?t.mainnet:r.kind==='chain'?r.name:t.mechanismScope}</span></span></Link></TableCell>
    <TableCell className="role-cell">{t[r.role==='network'?'networkRole':r.role]}</TableCell><TableCell className="grade-cell"><Badge assessment={r.assessment} t={t}/>{r.timing.overdue&&<span className="overdue small">{t.overdue}</span>}</TableCell><TableCell className="date-cell"><time dateTime={r.reviewedAt}>{date(r.reviewedAt,locale)}</time><span className="small muted">{r.timing.permanent?t.permanent:t[r.assessment.status==='assessed'?'complete':r.assessment.status==='partial'?'partial':'unknown']}</span></TableCell>
   </TableRow>)}</TableBody></Table>
   {found.length===0&&<div className="empty-state"><h2>{t.noResults}</h2><p>{t.tryClear}</p><button className="button" onClick={()=>change({...DEFAULT_FILTERS,ids:filters.ids})}>{t.clear}</button></div>}
   {found.length>12&&<nav className="pagination" aria-label={t.page}><button className="button" disabled={page===1} onClick={()=>{change({page:page-1});search.current?.scrollIntoView({block:'center'})}}>{t.prev}</button><span>{t.page} {page} {t.of} {Math.ceil(found.length/12)}</span><button className="button" disabled={page*12>=found.length} onClick={()=>{change({page:page+1});search.current?.scrollIntoView({block:'center'})}}>{t.next}</button></nav>}
   <p className="small muted evaluation-note">{t.evaluated} {date(day,locale)} · {t.dateUTC}</p><noscript><p>{t.noJs}</p></noscript>
  </section>
  <Sheet open={open} onOpenChange={value=>value?openSheet():closeSheet()}><SheetContent className="filter-sheet" showCloseButton={false}><SheetTitle>{t.filters}</SheetTitle><SheetDescription>{filterRows(rows,draft,collection,t).length} {t.results}</SheetDescription><Choice label={t.role} value={draft.role} options={['all',...roles].map(v=>[v,t[v==='network'?'networkRole':v]])} onChange={v=>setDraft({...draft,role:v})}/>{controls(draft,n=>setDraft({...draft,...n}))}<div className="sheet-actions"><button className="button" onClick={()=>setDraft({...DEFAULT_FILTERS,ids:filters.ids})}>{t.clear}</button><button className="button primary" onClick={()=>{change(draft,true);setOpen(false)}}>{t.apply}</button><SheetClose className="button">{t.close}</SheetClose></div></SheetContent></Sheet>
  {selected.length>0&&<div className="compare-tray"><div><strong>{selected.length} {t.selected}</strong><span>{selected.map(r=>r.name).join(' · ')}</span></div><Link className="button primary" href={`/${locale}/compare?ids=${encodeURIComponent(filters.ids.join(','))}`}>{t.compare}</Link><button className="icon-button" aria-label={t.clear} onClick={()=>change({ids:[]})}><X size={18}/></button></div>}<div className="notice" role="status">{notice}</div>
 </div>;
}
