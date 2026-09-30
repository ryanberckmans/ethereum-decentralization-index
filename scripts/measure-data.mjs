import {readFile,readdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {root,readRegistry} from './registry-files.mjs';

async function files(path){
 const entries=await readdir(new URL(path,root),{withFileTypes:true});
 return (await Promise.all(entries.map(e=>e.isDirectory()?files(path+'/'+e.name):[path+'/'+e.name]))).flat();
}
async function measure(paths){
 const data=await Promise.all(paths.map(path=>readFile(new URL(path,root))));
 return {files:paths.length,bytes:data.reduce((s,b)=>s+b.length,0),gzipBytes:gzipSync(Buffer.concat(data),{level:9}).length};
}
const {text,database}=await readRegistry();
const compact=JSON.stringify(database),pretty=JSON.stringify(database,null,2)+'\n';
const formats=Object.fromEntries([['committedRecordLines',text],['compactJson',compact],['prettyJson',pretty]].map(([id,value])=>[id,{bytes:Buffer.byteLength(value),gzipBytes:gzipSync(value,{level:9}).length}]));
console.log(JSON.stringify({records:database.entities.length,formats,
 latestSnapshot:await measure(['data/latest.json']),
 canonicalResearch:await measure(['data/control-registry.json','data/refresh-hints.json']),
 coverageInputsAndReport:await measure(['data/coverage-input.json','data/mapped-l1-coverage.json']),
 refreshApparatus:await measure([...(await files('scripts')),...(await files('src/registry')),...(await files('src/core')),...(await files('tests')).filter(p=>/registry|pipeline/.test(p)), 'data/rubric.json','docs/data.md','docs/refresh.md','tsconfig.json']),
 lockfile:await measure(['package-lock.json'])
},null,2));
