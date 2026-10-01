import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registry,validateRegistry,findReview,findReviewByAddress,addReviewMonth,reviewQueue,reviewTiming,registryAssessment} from '../dist/registry/index.js';
import {sha256} from '../scripts/registry-files.mjs';
import {buildCoverage} from '../scripts/coverage.mjs';

const clone=()=>structuredClone(registry);
test('bundled reviews and compact snapshot reproduce the exact canonical data',async()=>{
 const raw=await readFile(new URL('../data/control-registry.json',import.meta.url),'utf8');
 assert.deepEqual(registry,JSON.parse(raw));validateRegistry();
 const latest=JSON.parse(await readFile(new URL('../data/latest.json',import.meta.url),'utf8'));
 assert.equal(latest.registrySha256,sha256(raw));assert.equal(latest.entityCount,registry.entities.length);
 for(const row of latest.reviews){const value=registryAssessment(row.id,latest.asOf);assert.equal(row.level,value.effectiveLevel);assert.equal(row.floor,value.knownFloor);assert.equal(row.status,value.status);}
 assert.ok(Object.isFrozen(registry.entities[0]));
});
test('exact Uniswap deployments are D0 forever; brand and unresolved v4 positions are not certified',()=>{
 for(const id of ['uniswap-v1','uniswap-v2','uniswap-v3','uniswap-v4']){
  const entity=findReview(id);assert.equal(registryAssessment(id,'2099-01-01').effectiveLevel,0);assert.equal(reviewTiming(entity,'2099-01-01').dueAt,null);
 }
 assert.equal(registryAssessment('uniswap','2026-09-29').effectiveLevel,null);
 assert.equal(registryAssessment('uniswap-v4','2026-09-29',{scope:'position'}).status,'unreviewed');
 assert.equal(registryAssessment('token:uniswap','2026-09-29').effectiveLevel,1);
 assert.ok(reviewQueue('2026-10-01').some(t=>t.id==='uniswap-v4'&&t.scope==='position-dependencies'));
 assert.ok(!reviewQueue('2099-01-01').some(t=>t.id==='uniswap-v4'&&t.scope==='mechanism'));
});
test('monthly expiry preserves established restrictions and wrappers inherit their backing',()=>{
 const before=registryAssessment('usdc','2026-09-29'),after=registryAssessment('usdc','2026-10-01');
 assert.equal(before.effectiveLevel,9);assert.equal(after.effectiveLevel,null);assert.equal(after.knownFloor,9);assert.equal(after.status,'partial');
 assert.equal(findReview('usdc').reviewedAt,'2026-09-08');
 const wrapper=findReview('wsteth');assert.equal(reviewTiming(wrapper,'2026-10-01').permanent,false);assert.ok(registryAssessment('wsteth','2026-09-29').knownFloor>=3);
 assert.equal(registryAssessment('token:aerodrome-finance','2026-09-29').knownFloor,6);
 assert.equal(registryAssessment('token:optimism','2026-09-29').knownFloor,5);
 assert.equal(registryAssessment('token:arbitrum','2026-09-29').knownFloor,4);
});
test('repeated bundled lookups reuse derived reviews without changing any result',()=>{
 const ids=[...registry.entities.map(e=>e.id),'unknown'];
 for(const asOf of ['2026-09-29','2026-10-01','2027-06-01','2099-01-01']){const db=clone();
  for(const scope of ['mechanism','position'])for(const id of ids){const fresh=registryAssessment(id,asOf,{scope,database:db});assert.deepEqual(registryAssessment(id,asOf,{scope}),fresh,`${id} ${asOf} ${scope}`);assert.deepEqual(registryAssessment(id,asOf,{scope}),fresh);}
 }
 const db=clone();assert.equal(registryAssessment('usdc','2026-09-29',{database:db}).effectiveLevel,9);db.entities.find(e=>e.id==='usdc').proposedTier=8;assert.equal(registryAssessment('usdc','2026-09-29',{database:db}).effectiveLevel,8);
 for(let i=0;i<2;i++)assert.throws(()=>registryAssessment('usdc','2026-09-01'),/future/);
});
test('calendar deadlines clamp month ends and explicit dates cannot postpone a restudy',()=>{
 assert.equal(addReviewMonth('2026-01-31'),'2026-02-28');assert.equal(addReviewMonth('2028-01-31'),'2028-02-29');
 assert.throws(()=>addReviewMonth('2026-02-31'),/ISO/);
 const db=clone(),entity=db.entities.find(e=>e.id==='usdc');entity.nextReviewAt='2027-01-01';
 assert.equal(reviewTiming(entity,'2026-09-29',db).dueAt,'2026-10-08');assert.throws(()=>validateRegistry(db),/monthly review date/);
});
test('deployment lookup never matches a ticker, another chain or a similar address',()=>{
 const link=findReview('token:chainlink'),address=link.canonicalAddresses['1'];
 assert.equal(findReviewByAddress(1,address.toUpperCase().replace('0X','0x')).id,link.id);
 assert.equal(findReview('LINK'),undefined);assert.equal(findReviewByAddress(10,address),undefined);
 assert.equal(findReviewByAddress(1,address.slice(0,-1)+'b'),undefined);
 assert.equal(findReview('ethereum').kind,'chain');assert.equal(findReview('asset:ethereum').id,'native-eth');
 assert.equal(reviewTiming(findReview('token:1inch'),'2099-01-01').permanent,true);
 assert.equal(registryAssessment('token:golem','2026-09-29').effectiveLevel,null);
});
test('invalid evidence, ambiguous aliases, stronger floors and cycles cannot certify permanent D0',()=>{
 for(const mutate of [
  db=>{db.entities.find(e=>e.id==='weth9').knownFloor=1;},
  db=>{db.entities.find(e=>e.id==='usdc').aliases.push('ethereum');},
  db=>{db.entities.find(e=>e.id==='weth9').evidenceUrls=['https://user:password@example.org'];},
  db=>{db.entities.find(e=>e.id==='usdc').dependencies=['usdc'];}
 ]){const db=clone();mutate(db);assert.throws(()=>validateRegistry(db));}
});
test('coverage regenerates from conserved holdings and retains the position uncertainty',async()=>{
 const input=JSON.parse(await readFile(new URL('../data/coverage-input.json',import.meta.url),'utf8'));
 const committed=JSON.parse(await readFile(new URL('../data/mapped-l1-coverage.json',import.meta.url),'utf8'));
 assert.deepEqual(buildCoverage(input,registry,registry.lastUpdatedAt),committed);
 assert.ok(Math.abs(committed.locatedUsd-input.holdings.reduce((s,h)=>s+h.usd,0))<0.0001);
 assert.ok(committed.completePositionUsd<=committed.completeMechanismUsd);
 assert.ok(committed.completePositionShare<1);assert.equal(committed.protocols,21);
 const duplicate=structuredClone(input);duplicate.holdings.push(duplicate.holdings[0]);assert.throws(()=>buildCoverage(duplicate,registry,registry.lastUpdatedAt),/Duplicate/);
});
