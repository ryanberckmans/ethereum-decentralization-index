import {readFile,stat,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {gzipSync} from 'node:zlib';
const require=createRequire(import.meta.resolve('vite/package.json'));
const {init,parse}=require('es-module-lexer');await init;
const html=await readFile(process.argv[2],'utf8');
const client=resolve('dist/client');
const refs=[...new Set(html.match(/\/_next\/static\/[^"\\<> ]+\.js/g)||[])];
const seen=new Set(),files=[];
async function walk(path){
 if(seen.has(path))return;seen.add(path);
 if(!path.startsWith(client+'/'))throw new Error('Unexpected module path');
 const body=await readFile(path);files.push({path:path.slice(client.length+1),bytes:body.length,gzip:gzipSync(body).length});
 const [imports]=parse(body.toString());
 for(const imp of imports)if(imp.d===-1&&imp.n){const next=imp.n.startsWith('/')?resolve(client,'.'+imp.n):resolve(dirname(path),imp.n);if((await stat(next).catch(()=>null))?.isFile())await walk(next)}
}
for(const ref of refs)await walk(resolve(client,'.'+ref));
const result={basis:'Built English directory HTML references and transitive static JS imports, gzip per file; excludes dynamic modules not referenced by the initial response.',javascriptFiles:files.length,javascriptGzipBytes:files.reduce((a,b)=>a+b.gzip,0),javascriptRawBytes:files.reduce((a,b)=>a+b.bytes,0),htmlGzipBytes:gzipSync(html).length,largest:files.sort((a,b)=>b.gzip-a.gzip).slice(0,8)};
console.log(JSON.stringify(result,null,2));
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n');
