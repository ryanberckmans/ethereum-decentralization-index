import {registry} from './catalog';
import {claims,observations} from './evidence';
import {relationships,contextualSubjects} from './relationships';
import {safeEvidenceUrl} from '@/vendor/edi/dist/core/index.js';
import type {Editorial,UI} from './schema';
function ensure(value:unknown,message:string):asserts value{if(!value)throw new Error(message)}
function unique(values:string[],name:string){ensure(new Set(values).size===values.length,'Duplicate '+name)}
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value}
/** Validations run before adopting a candidate edition; failure leaves the prior files/build untouched. */
export function validateEditorial(ed:Editorial,ui:UI,reference:Editorial,referenceUI:UI){
 const ids=new Set(registry.entities.map(e=>e.id));
 const storyIds=new Set(reference.stories.map(s=>s.id));
 const claimIds=new Set(claims.map(c=>c.id));
 const obsIds=new Set(observations.map(o=>o.id));
 const relIds=new Set(relationships.map(r=>r.id));
 unique(ed.profiles.map(p=>p.id),'profile');unique(ed.stories.map(s=>s.id),'story');
 ensure(ed.profiles.length===reference.profiles.length&&ed.stories.length===reference.stories.length,'Incomplete locale');
 ensure(Object.keys(ui).sort().join('|')===Object.keys(referenceUI).sort().join('|'),'Incomplete UI keys');
 ensure(Object.values(ui).every(v=>typeof v==='string'&&v.trim()),'Empty UI text');
 const expectedProfileIds=new Set(reference.profiles.map(p=>p.id));
 for(const p of ed.profiles){
  ensure(ids.has(p.id)&&expectedProfileIds.has(p.id),'Unknown profile '+p.id);
  ensure(p.title&&p.summary&&p.enables&&p.boundary,'Empty profile');
  ensure(p.storyIds.every(id=>storyIds.has(id)),'Unknown profile story');
  for(const field of ['grade','tier','assessment','reviewedAt','knownFloor'])ensure(!(field in p),'Editorial grade or review override');
 }
 for(const s of ed.stories){
  ensure(storyIds.has(s.id),'Unknown story');
  ensure(s.title&&s.subtitle&&s.sections.length&&s.sections.every(p=>p.heading&&p.body),'Empty story');
  ensure(s.objectIds.every(id=>ids.has(id)),'Unknown story object');
  ensure(s.claimIds.length&&s.claimIds.every(id=>claimIds.has(id)),'Unknown story claim');
  ensure(s.observationIds.every(id=>obsIds.has(id)),'Unknown observation');
  ensure(s.relationshipIds.length===s.connection.length&&s.relationshipIds.every(id=>relIds.has(id)&&relationships.find(r=>r.id===id)!.storyIds.includes(s.id)),'Unknown story relationship');
  const ref=reference.stories.find(x=>x.id===s.id)!;
  for(const key of ['objectIds','claimIds','observationIds','relationshipIds','collection','state'] as const)ensure(JSON.stringify(s[key])===JSON.stringify(ref[key]),'Locale changed evidence identity');
 }
 ensure(ed.methodology.length===reference.methodology.length&&ed.methodology.every(p=>p.title&&p.body),'Incomplete methodology');
 ensure(ed.collectionDescriptions.d0&&ed.collectionDescriptions['global-economy'],'Missing collections');
}
export function validateEvidence(){
 const ids=new Set(registry.entities.map(e=>e.id)),claimIds=new Set(claims.map(c=>c.id));
 unique(claims.map(c=>c.id),'claim');unique(observations.map(o=>o.id),'observation');unique(relationships.map(r=>r.id),'relationship');unique(contextualSubjects.map(s=>s.id),'contextual subject');
 for(const c of claims){ensure(safeEvidenceUrl(c.url),'Unsafe evidence URL');ensure(validDate(c.date),'Invalid claim date');ensure(c.subjects.every(id=>ids.has(id)),'Unknown claim subject')}
 for(const o of observations){
  ensure(ids.has(o.subjectId),'Unknown observation subject');ensure(/^\d+(\.\d+)?$/.test(o.value)&&Number.isFinite(Number(o.value)),'Invalid decimal');
  ensure(validDate(o.asOf)&&o.scope&&o.metric&&o.unit,'Missing observation basis');
  if(o.interval)ensure(validDate(o.interval.start)&&validDate(o.interval.end)&&o.interval.start<=o.interval.end,'Invalid interval');
  ensure(['eq','gt'].includes(o.comparator),'Missing observation comparator');
  ensure(o.chainIds.length&&o.chainIds.every(c=>Number.isInteger(c)&&c>0),'Invalid chain scope');
  ensure(o.claimIds.length&&o.claimIds.every(c=>claimIds.has(c)),'Unknown observation claim');
 }
 const allIds=new Set([...ids,...contextualSubjects.map(s=>s.id)]);
 for(const s of contextualSubjects)ensure(!ids.has(s.id)&&s.id.startsWith('context:'),'Contextual/EDI namespace collision');
 for(const r of relationships){ensure(allIds.has(r.from)&&allIds.has(r.to),'Unknown relationship subject');ensure(r.claimIds.length&&r.claimIds.every(id=>claimIds.has(id)),'Unevidenced relationship');ensure((r.type as string)!=='edi-dependency','Editorial control dependency')}
}
