"use client";
import {useEffect,useLayoutEffect,useRef} from 'react';
import {flushSync} from 'react-dom';
import {configurationSchema,decodeConfiguration} from '@/lib/directory-tools';
import type {Filters} from '@/lib/catalog';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Options={filters:Filters;read:()=>unknown;change:(filters:Filters)=>void};
export function useDirectoryTools(options:Options){
 const latest=useRef(options);useLayoutEffect(()=>{latest.current=options});
 useEffect(()=>{
  const context=(document as Document&{modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tools:Tool[]=[
   {name:'read_directory_state',description:'Read the visible Ethereum Directory query, filters, selection, dated EDI results and page links.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new TypeError('Expected an empty object');return latest.current.read()}},
   {name:'configure_directory',description:'Set directory filters and up to four comparison IDs; update the visible results and shareable URL. This only configures the reading view.',inputSchema:configurationSchema,annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){const next=decodeConfiguration(input,latest.current.filters);flushSync(()=>latest.current.change(next));return latest.current.read()}},
  ];
  for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>console.warn('Optional directory agent tool registration unavailable'));}catch{console.warn('Optional directory agent tool registration unavailable')}}
  return()=>lifecycle.abort();
 },[]);
}
