import {readFile, mkdir, rename, writeFile, unlink, open} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
export const root = new URL('../', import.meta.url);
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const today = () => new Date().toISOString().slice(0, 10);
export function argument(name, fallback, args = process.argv.slice(2)) {
  return args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
}
export async function readRegistry() {
  const text = await readFile(new URL('data/control-registry.json', root), 'utf8');
  if (Buffer.byteLength(text) > 2 * 1024 * 1024) throw new Error('Registry exceeds 2 MiB');
  return {text, database: JSON.parse(text), digest: sha256(text)};
}
/** Stable keys, with one complete research record on each diffable line. */
export function renderRegistry(database) {
  const {entities, ...metadata} = database;
  return JSON.stringify({...metadata, entities: []}, null, 2).replace('"entities": []',
    `"entities": [\n${[...entities].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(entity => `    ${JSON.stringify(entity)}`).join(',\n')}\n  ]`) + '\n';
}
export async function atomicWrite(relative, value) {
  const path = new URL(relative, root), temporary = new URL(`${relative}.${randomUUID()}.tmp`, root);
  await mkdir(new URL('.', path), {recursive: true});
  try {
    await writeFile(temporary, value, {mode: 0o644, flag: 'wx'});
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch(error => {if (error.code !== 'ENOENT') throw error;});
  }
}
/** Exclusive cooperative writer; a crash leaves a visible lock for deliberate recovery. */
export async function withRegistryLock(action, path = new URL('work/registry-apply.lock',root)) {
  await mkdir(new URL('.',path),{recursive:true});
  let handle;
  try {handle=await open(path,'wx',0o600);} catch(error) {
    if(error.code==='EEXIST')throw new Error('Registry writer lock exists; reconcile the prior run before removing it');
    throw error;
  }
  try {
    await handle.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n');
    return await action();
  } finally {await handle.close();await unlink(path);}
}
