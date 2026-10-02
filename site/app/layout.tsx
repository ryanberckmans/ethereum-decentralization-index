import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {LOCALES,type Locale} from '@/lib/schema';
import './globals.css';
export const metadata:Metadata={title:'Ethereum Directory',description:'Exact economic objects, useful infrastructure and the institutions connecting to Ethereum.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
const themeScript="try{var t=localStorage.getItem('edi-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.classList.toggle('dark',d)}catch(e){}";
export default async function RootLayout({children}:{children:React.ReactNode}){const value=(await headers()).get('x-directory-locale') as Locale;const locale=LOCALES.includes(value)?value:'en';return <html lang={locale} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
