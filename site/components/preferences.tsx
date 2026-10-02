"use client";
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Choice} from './choice';
import {LOCALES,LANGUAGE_NAMES,type Locale,type UI} from '@/lib/schema';
export function Preferences({locale,t}:{locale:Locale;t:UI}){
 const [theme,setTheme]=useState('system');const path=usePathname();
 useEffect(()=>{try{setTheme(localStorage.getItem('edi-theme')||'system');localStorage.setItem('edi-language',locale)}catch{}document.documentElement.lang=locale;document.cookie='edi-language='+locale+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');},[locale]);
 useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{let choice='system';try{choice=localStorage.getItem('edi-theme')||'system'}catch{}document.documentElement.dataset.theme=choice==='system'?(media.matches?'dark':'light'):choice;document.documentElement.classList.toggle('dark',document.documentElement.dataset.theme==='dark');};media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[]);
 function changeTheme(value:string){setTheme(value);try{localStorage.setItem('edi-theme',value)}catch{}const mode=value==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):value;document.documentElement.dataset.theme=mode;document.documentElement.classList.toggle('dark',mode==='dark');}
 return <div className="preferences"><Choice label={t.language} value={locale} options={LOCALES.map(l=>[l,LANGUAGE_NAMES[l]])} onChange={l=>{const parts=path.split('/');parts[1]=l;location.assign(parts.join('/')+location.search)}}/><Choice label={t.theme} value={theme} options={['system','light','dark'].map(x=>[x,t[x]])} onChange={changeTheme}/></div>;
}
