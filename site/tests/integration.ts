import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {catalog,filterRows,parseFilters,filterQuery,DEFAULT_FILTERS,invalidFilterValues,NETWORKS,registry,registryAssessment} from '@/lib/catalog';
import {EDITION,evaluationDay} from '@/lib/edition';
import {directoryExport,directoryCSV,csvCell,observationsExport} from '@/lib/exports';
import {decodeConfiguration} from '@/lib/directory-tools';
import {validateEditorial,validateEvidence,validDate} from '@/lib/validate-content';
import {LOCALES,type Editorial,type UI} from '@/lib/schema';
import {displayedLevel,levelLabel,safeEvidenceUrl} from '@/vendor/edi/dist/core/index.js';
import {validateRegistry,findReview,reviewTiming} from '@/vendor/edi/dist/registry/index.js';
const read=<T,>(path:string):T=>JSON.parse(readFileSync(path,'utf8'));
const ed=read<Editorial>('content/en.json'),ui=read<UI>('content/ui/en.json');
const day='2026-10-02',rows=catalog(ed.profiles,day);
const filters=(input:string)=>parseFilters(new URLSearchParams(input));
test('the vendored package is byte-identical to its full pinned source tree',()=>{
 const source=read<{commit:string;files:{path:string;gitBlobSha:string}[]}>('vendor/PROVENANCE.json');
 assert.equal(source.commit,EDITION.ediCommit);assert.equal(source.files.length,18);
 for(const f of source.files){const body=readFileSync('vendor/edi/'+f.path);assert.equal(createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex'),f.gitBlobSha,f.path)}
 assert.equal(createHash('sha256').update(readFileSync('vendor/edi/data/control-registry.json')).digest('hex'),EDITION.ediRegistrySha256);
 validateRegistry();assert.equal(rows.length,118);
});
test('all languages preserve evidence identities and complete content; invalid candidates fail closed',()=>{
 validateEvidence();for(const l of LOCALES)validateEditorial(read('content/'+l+'.json'),read('content/ui/'+l+'.json'),ed,ui);
 const bad=structuredClone(ed);bad.stories[0].objectIds=['invented-identity'];assert.throws(()=>validateEditorial(bad,ui,ed,ui),/Unknown story object/);
 const override=structuredClone(ed);(override.profiles[0] as unknown as Record<string,unknown>).grade=0;assert.throws(()=>validateEditorial(override,ui,ed,ui),/override/);
 assert.equal(ed.stories[0].objectIds[0],'uniswap-v2');assert.equal(validDate('2026-02-31'),false);
});
test('the complete/floor/unknown distinction survives searching and sorting',()=>{
 const hits=filterRows(rows,filters('q=Uniswap'));for(const id of ['uniswap-v1','uniswap-v2','uniswap-v3','uniswap-v4','uniswap','token:uniswap'])assert(hits.some(r=>r.id===id),id);
 assert.equal(rows.find(r=>r.id==='uniswap')!.assessment.status,'unreviewed');
 const glm=rows.find(r=>r.id==='token:golem')!;assert.equal(glm.assessment.status,'unreviewed');assert.equal(displayedLevel(glm.assessment),null);assert.equal(levelLabel(glm.assessment),'D?');
 const d0=filterRows(rows,filters('grade=0'));assert.equal(d0.length,17);assert(!d0.some(r=>r.id==='token:golem'));
 const liquity=rows.find(r=>r.id==='liquity-v1')!;assert.equal(liquity.assessment.status,'partial');assert((liquity.assessment.knownFloor??0)>0);assert(!d0.includes(liquity));assert.equal(rows.find(r=>r.id==='wsteth')!.assessment.knownFloor,3);assert.notEqual(rows.find(r=>r.id==='wsteth')!.assessment.status,'assessed');
 assert(filterRows(rows,filters('floor=2')).some(r=>r.id==='liquity-v1'));
 for(const sort of ['gradeAsc','gradeDesc']){const result=filterRows(rows,filters('sort='+sort));const firstIncomplete=result.findIndex(r=>r.assessment.status!=='assessed');assert(result.slice(firstIncomplete).every(r=>r.assessment.status!=='assessed'))}
});
test('exact addresses remain bound to their recorded chain; every network is filterable',()=>{
 const weth=findReview('weth9')!.canonicalAddresses!['1'];
 assert.deepEqual(filterRows(rows,filters('q=1:'+weth)).map(r=>r.id),['weth9']);assert.equal(filterRows(rows,filters('q=8453:'+weth)).length,0);
 const morpho=findReview('morpho-blue')!.canonicalAddresses!['1'];assert.equal(filterRows(rows,filters('q=8453:'+morpho)).length,0);
 for(const [network] of NETWORKS)assert.equal(filters('network='+network).network,network);
 for(const [id,network] of [['native-eth','1'],['ethereum','1'],['base','8453'],['arbitrum','42161'],['optimism','10']])assert(filterRows(rows,filters('network='+network)).some(r=>r.id===id));
});
test('a mechanism does not become an unreviewed user position or editorial relationship grade',()=>{
 for(const row of rows)assert.deepEqual(row.assessment,registryAssessment(row.id,day));
 for(const id of ['uniswap-v4','morpho-blue','seaport-v1.6']){const r=rows.find(r=>r.id===id)!;assert.equal(r.assessment.effectiveLevel,0);assert.notEqual(r.position.status,'assessed')}
 const out=directoryExport(day).objects.find(r=>r.id==='weth9')!;assert.equal(out.position.coverage,'no-separate-position-review');assert.equal(out.position.review,null);
 const csv=directoryCSV(day);assert(csv.includes('"canonical_position_projection_status","position_coverage"'));assert(csv.split('\r\n').find(line=>line.startsWith('"weth9",'))!.includes('"no-separate-position-review"'));
 assert(observationsExport().contextualSubjects.every(s=>s.ediCoverage===null));
});
test('monthly expiry preserves floors and dates; permanent D0 and server date floor behave correctly',()=>{
 const base=findReview('base')!,due=reviewTiming(base,day).dueAt!;
 const later=catalog(ed.profiles,'2027-01-01').find(r=>r.id==='base')!;
 assert.equal(registryAssessment('base',day).status,'assessed');assert.notEqual(later.assessment.status,'assessed');assert.equal(later.reviewedAt,base.reviewedAt);assert.equal(later.assessment.knownFloor,6);assert.equal(later.timing.overdue,true);
 assert(registryAssessment('base',due).status!=='assessed');
 assert.equal(registryAssessment('weth9','2030-01-01').effectiveLevel,0);assert.equal(reviewTiming(findReview('weth9')!,'2030-01-01').permanent,true);
 assert.equal(evaluationDay('2025-01-01',day),day);assert.equal(evaluationDay('2026-99-99',day),day);assert.equal(evaluationDay('2026-10-03',day),'2026-10-03');
});
test('bounded configuration and URL round trips keep intent, with rejected writes inert',()=>{
 const f=filters('q=Uniswap&network=1&grade=0&sort=alphabetical&ids=weth9,usdc&page=2');assert.deepEqual(parseFilters(new URLSearchParams(filterQuery(f))),f);
 assert.equal(filters('q='+('x'.repeat(400))).q.length,200);assert.equal(filters('ids=uniswap,weth9,usdc,base,buidl,weth9').ids.length,4);
 const prior=structuredClone(f);assert.throws(()=>decodeConfiguration({ids:['weth9','made-up']},f));assert.throws(()=>decodeConfiguration({page:Infinity},f));assert.throws(()=>decodeConfiguration({grade:'D0'},f));assert.deepEqual(f,prior);
 assert.equal(decodeConfiguration({q:'USDC',grade:'all'},f).q,'USDC');assert.equal(decodeConfiguration({q:'USDC'},f).page,1);assert.equal(decodeConfiguration({ids:['usdc']},f).page,2);assert(invalidFilterValues(new URLSearchParams('grade=99')));assert(!invalidFilterValues(new URLSearchParams(filterQuery(f))));assert(filterRows(rows,filters('q=Geld'),undefined,{money:'Geld'}).length>0);
});
test('exports and evidence preserve bounds, units, times and safe navigation',()=>{
 for(const s of ['=SUM(A1:A2)',' +1','\t@cmd','-1'])assert(csvCell(s).startsWith('"\''));assert.equal(csvCell('a"b'),'"a""b"');
 for(const url of ['javascript:alert(1)','data:text/html,x','file:///etc/passwd','https://user:pass@example.com'])assert.equal(safeEvidenceUrl(url),null);
 const o=observationsExport().observations;const coinbase=o.find(o=>o.id==='coinbase-originations-2026')!;assert.equal(coinbase.measure,'flow');assert.equal(coinbase.comparator,'gt');assert.equal(coinbase.unit,'USDC');assert.deepEqual(coinbase.chainIds,[8453]);assert.equal(coinbase.asOf,'2026-04-14');
 const flash=o.find(o=>o.id==='v2-flash-2020')!;assert.equal(flash.interval,undefined);assert.equal(flash.asOf,'2020-12-31');
 assert.equal(o.find(o=>o.id==='morpho-deposits-2024')!.measure,'stock');
});
test('local filtering stays comfortably below the 100ms provisional budget on this runner',()=>{
 const queries=['q=uniswap','q=oracle&floor=6','grade=0','network=1&sort=alphabetical'];
 const start=performance.now();for(let i=0;i<400;i++)filterRows(rows,filters(queries[i%queries.length]));
 const average=(performance.now()-start)/400;console.log('Runner filter average: '+average.toFixed(3)+' ms (not a phone benchmark)');assert(average<100);
});
