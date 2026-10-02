import {createRequire} from 'node:module';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {build}=require('esbuild');
const temp=await mkdtemp(join(tmpdir(),'edi-check-'));
try{
 const outfile=join(temp,'check.mjs');
 await build({entryPoints:['tests/integration.ts'],outfile,bundle:true,platform:'node',format:'esm',target:'node22',alias:{'@':process.cwd()},logLevel:'warning'});
 const result=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'});
 process.exitCode=result.status??1;
}finally{await rm(temp,{recursive:true,force:true})}
