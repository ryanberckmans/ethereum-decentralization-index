import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {assertReviewDate, reviewTiming, validateRegistry} from '../dist/registry/index.js';
import {argument, readRegistry, root, sha256, today} from './registry-files.mjs';

export function contractEvidenceUrl(chainId, address) {
  if (!Number.isSafeInteger(chainId) || chainId <= 0 || !/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('Invalid contract identity');
  return `https://sourcify.dev/server/v2/contract/${chainId}/${address}?fields=sources,metadata,compilation,runtimeBytecode,proxyResolution,deployment`;
}
/** The ./ prefix keeps namespaced entity IDs from becoming URL schemes. */
export function evidenceCacheUrl(target,directory) {
  if (!/^[a-z0-9][a-z0-9:._-]{0,255}$/.test(target.id) || !Number.isSafeInteger(target.chainId) || target.chainId<=0) throw new Error('Invalid cache identity');
  return new URL(`./${target.id}-${target.chainId}.json`,directory);
}
async function boundedJson(response, limit) {
  if (!response.ok) throw new Error(`Source HTTP ${response.status}${response.headers.get('retry-after') ? '; retry later: '+response.headers.get('retry-after') : ''}`);
  if (!/application\/json/i.test(response.headers.get('content-type') ?? '')) throw new Error('Source is not JSON');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) {await reader.cancel(); throw new Error('Source body limit');}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
/**
 * @cc [label:operations] bounded-source-collection
 * One fixed-provider request per unique deployment, no retries, at most four in
 * flight and at most the supplied budget. Collection never changes a rating or review date.
 */
export async function collectContractEvidence(targets, {asOf, requestBudget = 32, maxConcurrency = 4, maxBodyBytes = 4 * 1024 * 1024, timeoutMs = 20000, fetchImpl = globalThis.fetch, onResult = async () => {}} = {}) {
  assertReviewDate(asOf);
  if (!Number.isInteger(requestBudget) || requestBudget < 1 || requestBudget > 128 || !Number.isInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 4 || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20000 || !Number.isInteger(maxBodyBytes) || maxBodyBytes < 1 || maxBodyBytes > 4 * 1024 * 1024) throw new Error('Invalid collection budget');
  const unique = new Map();
  for (const target of targets) {
    const url = contractEvidenceUrl(target.chainId,target.address);
    const key = `${target.chainId}:${target.address.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key,{...target,url});
  }
  const selected = [...unique.values()].slice(0,requestBudget), results = []; let cursor = 0;
  async function worker() {
    for (;;) {
      const index = cursor++; if (index >= selected.length) return;
      const target = selected[index]; let result;
      try {
        const response = await fetchImpl(target.url,{redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{accept:'application/json'}});
        const value = await boundedJson(response,maxBodyBytes);
        if (String(value.chainId) !== String(target.chainId) || value.address?.toLowerCase() !== target.address.toLowerCase() || !['match','exact_match'].includes(value.runtimeMatch) || !value.sources || !Object.keys(value.sources).length || Object.values(value.sources).some(source => typeof source.content !== 'string') || !/^0x(?:[0-9a-fA-F]{2})+$/.test(value.runtimeBytecode?.onchainBytecode ?? '')) throw new Error('Invalid or unverified source response');
        const sources = Object.fromEntries(Object.entries(value.sources).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0));
        result = {id:target.id,chainId:target.chainId,address:target.address,checkedAt:asOf,url:target.url,status:'collected',
          runtimeSha256:sha256(Buffer.from(value.runtimeBytecode.onchainBytecode.slice(2),'hex')),
          sourcesSha256:sha256(JSON.stringify(sources)),contractName:value.compilation?.name ?? '',
          providerProxyDetected:value.proxyResolution?.isProxy ?? null,
          warning:'A negative proxy lookup is not proof of immutability. Inspect the compiled target, reachable code and live roles.',evidence:value};
      } catch (error) {result={id:target.id,chainId:target.chainId,address:target.address,checkedAt:asOf,url:target.url,status:'failed',error:String(error.message).slice(0,250)};}
      results[index] = result;
      await onResult(result);
    }
  }
  await Promise.all(Array.from({length:Math.min(maxConcurrency,selected.length)},worker));
  return {requests: selected.length, remaining: [...unique.values()].slice(requestBudget).map(({id,chainId,address})=>({id,chainId,address})), results};
}
if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const {database} = await readRegistry(), asOf = argument('as-of',today());
  validateRegistry(database); assertReviewDate(asOf);
  const ids = argument('ids','').split(',').filter(Boolean), all = process.argv.includes('--all');
  const targets = database.entities.filter(entity => {
    const timing = reviewTiming(entity,asOf,database);
    return !timing.permanent && (all || timing.overdue) && (!ids.length || ids.includes(entity.id));
  }).flatMap(entity=>Object.entries(entity.canonicalAddresses ?? {}).map(([chainId,address])=>({id:entity.id,chainId:Number(chainId),address})));
  const directory = new URL('work/latest-evidence/',root); await mkdir(directory,{recursive:true});
  const pending = [];
  for (const target of targets) {
    const file = evidenceCacheUrl(target,directory);
    let prior; try {prior = JSON.parse(await readFile(file,'utf8'));} catch {}
    // Resume skips successes and failures from this date. A later dated run can retry.
    if (prior?.checkedAt !== asOf || prior.address?.toLowerCase() !== target.address.toLowerCase()) pending.push(target);
  }
  const result = await collectContractEvidence(pending,{asOf,requestBudget:Number(argument('limit','32')),onResult:async value=>{
    const file = evidenceCacheUrl(value,directory), temp = new URL(file.href+'.tmp');
    await writeFile(temp,JSON.stringify(value)+'\n',{mode:0o600}); await rename(temp,file);
    console.log(JSON.stringify({id:value.id,chainId:value.chainId,status:value.status,...(value.error?{error:value.error}:{})}));
  }});
  console.log(JSON.stringify({asOf,requests:result.requests,remaining:result.remaining,ratingsChanged:false}));
  if(result.results.some(value=>value.status==='failed'))process.exitCode=1;
}
