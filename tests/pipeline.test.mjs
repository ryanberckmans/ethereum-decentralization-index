import test from 'node:test';
import assert from 'node:assert/strict';
import {registry} from '../dist/registry/index.js';
import {applyCandidate} from '../scripts/apply-reviews.mjs';
import {collectContractEvidence,contractEvidenceUrl,evidenceCacheUrl} from '../scripts/fetch-contract-evidence.mjs';
import {withRegistryLock} from '../scripts/registry-files.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const asOf=registry.lastUpdatedAt,checks=['identity','implementation','authorities','timing','exits','dependencies'];
const target=i=>({id:`test-${i}`,chainId:1,address:'0x'+i.toString(16).padStart(40,'0')});
test('namespaced token identities remain local checkpoint files',()=>{
 const url=evidenceCacheUrl({...target(1),id:'token:uniswap'},new URL('file:///tmp/evidence/'));
 assert.equal(url.protocol,'file:');assert.equal(url.pathname,'/tmp/evidence/token:uniswap-1.json');
 assert.throws(()=>evidenceCacheUrl({...target(1),id:'../escape'},new URL('file:///tmp/evidence/')),/identity/);
});
function response(t){return Response.json({chainId:'1',address:t.address,runtimeMatch:'exact_match',runtimeBytecode:{onchainBytecode:'0x6000'},sources:{'Token.sol':{content:'reviewable code'}},compilation:{name:'Token'},proxyResolution:{isProxy:false}});}
test('concurrent writers are refused and a failed acceptance releases its lock',async()=>{
 const directory=await mkdtemp(tmpdir()+'/edi-lock-'),path=pathToFileURL(directory+'/lock');
 try {
  await withRegistryLock(async()=>{await assert.rejects(()=>withRegistryLock(async()=>{},path),/lock exists/);},path);
  await assert.rejects(()=>withRegistryLock(async()=>{throw new Error('validation failed');},path),/validation failed/);
  assert.equal(await withRegistryLock(async()=>42,path),42);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('accepted research requires every check; stale or incomplete candidates cannot mutate data',()=>{
 const db=structuredClone(registry),before=JSON.stringify(db),record={...db.entities.find(e=>e.id==='usdc'),reviewedAt:asOf,nextReviewAt:'2026-10-01',reviewChecks:checks};
 const candidate={schemaVersion:1,baseRegistrySha256:'base',asOf,records:[record]};
 assert.throws(()=>applyCandidate(db,candidate,'changed'),/stale/);
 assert.throws(()=>applyCandidate(db,{...candidate,records:[{...record,reviewChecks:['identity']}]},'base'),/attestation/);
 assert.equal(JSON.stringify(db),before);
 const next=applyCandidate(db,candidate,'base');assert.equal(next.entities.find(e=>e.id==='usdc').reviewedAt,asOf);assert.equal(JSON.stringify(db),before);
});
test('permanent D0 is changed only through a named evidence correction',()=>{
 const db=structuredClone(registry),record={...db.entities.find(e=>e.id==='weth9'),reviewedAt:asOf,reviewChecks:checks};
 const candidate={schemaVersion:1,baseRegistrySha256:'base',asOf,records:[record]};
 assert.throws(()=>applyCandidate(db,candidate,'base'),/explicit evidence correction/);
 assert.equal(applyCandidate(db,{...candidate,corrections:{weth9:'Added source-matched runtime proof; immutable deployment unchanged.'}},'base').entities.find(e=>e.id==='weth9').reviewedAt,asOf);
});
test('position dependency research advances without renewing its permanent D0 core',()=>{
 const db=structuredClone(registry),prior=db.entities.find(e=>e.id==='morpho-blue');
 const positionReview={...prior.positionReview,reviewedAt:'2026-10-01',nextReviewAt:'2026-11-01'};
 const candidate={schemaVersion:1,baseRegistrySha256:'base',asOf:'2026-10-01',records:[],positionReviews:[{id:prior.id,positionReview,reviewChecks:checks}]};
 assert.throws(()=>applyCandidate(db,{...candidate,positionReviews:[{id:prior.id,positionReview,reviewChecks:['identity']}]},'base'),/position research attestation/);
 const next=applyCandidate(db,candidate,'base').entities.find(e=>e.id===prior.id);
 assert.equal(next.reviewedAt,prior.reviewedAt);assert.equal(next.positionReview.reviewedAt,'2026-10-01');assert.equal(next.positionReview.status,'unresolved');
});
test('an incomplete restudy preserves its old review date, due date and known restriction',()=>{
 const db=structuredClone(registry),prior=db.entities.find(e=>e.id==='usdc');
 const record={...prior,assessment:'lower-bound',tierBound:true,researchAttemptedAt:'2026-10-02',reviewChecks:['identity']};
 const candidate={schemaVersion:1,baseRegistrySha256:'base',asOf:'2026-10-02',records:[record]};
 const next=applyCandidate(db,candidate,'base').entities.find(e=>e.id==='usdc');
 assert.equal(next.reviewedAt,prior.reviewedAt);assert.equal(next.nextReviewAt,prior.nextReviewAt);assert.equal(next.proposedTier,9);
 assert.throws(()=>applyCandidate(db,{...candidate,records:[{...record,proposedTier:0,knownFloor:0}]},'base'),/weakens/);
 db.entities.find(e=>e.id==='wsteth').knownFloor=0;
 const wrapper={...db.entities.find(e=>e.id==='wsteth'),dependencies:[],assessment:'lower-bound',tierBound:true,researchAttemptedAt:candidate.asOf};
 assert.throws(()=>applyCandidate(db,{...candidate,records:[wrapper]},'base'),/dependency floor/);
});
test('source collection deduplicates deployments, bounds concurrency/budget and checkpoints each result',async()=>{
 const reviewedAt=registry.entities.find(e=>e.id==='usdc').reviewedAt;
 const targets=[target(1),target(2),target(1),target(3),target(4)],seen=[];let active=0,maxActive=0;
 const result=await collectContractEvidence(targets,{asOf,requestBudget:3,maxConcurrency:2,
  fetchImpl:async url=>{active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setImmediate(resolve));active--;const t=targets.find(t=>url.includes(t.address));return response(t);},onResult:async r=>seen.push(r.id)});
 assert.equal(result.requests,3);assert.equal(result.remaining.length,1);assert.equal(seen.length,3);assert.ok(maxActive<=2);
 assert.ok(result.results.every(r=>r.status==='collected'));assert.match(result.results[0].warning,/not proof of immutability/);
 assert.equal(registry.entities.find(e=>e.id==='usdc').reviewedAt,reviewedAt);
});
test('rate limits, oversized bodies and mismatched identities are failures with no retry',async()=>{
 let calls=0;const result=await collectContractEvidence([target(1),target(2),target(3)],{asOf,maxBodyBytes:500,
  fetchImpl:async url=>{calls++;if(url.includes(target(1).address))return new Response('',{status:429,headers:{'retry-after':'60'}});
   if(url.includes(target(2).address))return Response.json({content:'x'.repeat(600)});return response(target(99));}});
 assert.equal(calls,3);assert.ok(result.results.every(r=>r.status==='failed'));
 assert.match(result.results[0].error,/429.*retry later/);assert.match(result.results[1].error,/body limit/);assert.match(result.results[2].error,/Invalid or unverified/);
 assert.throws(()=>contractEvidenceUrl(1,'https://example.org'),/identity/);
 await assert.rejects(()=>collectContractEvidence([target(1)],{asOf,requestBudget:129}),/budget/);
});
