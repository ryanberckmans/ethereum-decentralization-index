import Link from 'next/link';
import {headers} from 'next/headers';
import {getUI} from '@/lib/i18n';
import {LOCALES,type Locale} from '@/lib/schema';
export default async function NotFound(){
 const candidate=(await headers()).get('x-directory-locale') as Locale;
 const locale=LOCALES.includes(candidate)?candidate:'en';const t=await getUI(locale);
 return <main className="page"><p className="eyebrow">Ethereum Directory · 404</p><h1>{t.notFound}</h1><Link className="button" href={'/'+locale}>{t.backDirectory}</Link></main>;
}
