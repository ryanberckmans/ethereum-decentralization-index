import {locales as ediLocales} from '@/vendor/edi/dist/core/index.js';
import type {Editorial,Locale,UI} from './schema';
export async function getUI(locale:Locale):Promise<UI>{const ui=(await import(`../content/ui/${locale}.json`)).default;const semantic=ediCopy(locale);return {...ui,ediUnknown:semantic.unknownBody,...Object.fromEntries(semantic.tiers.map((tier,i)=>['ediTierDef_'+i,tier.definition]))};}
export async function getEditorial(locale:Locale):Promise<Editorial>{return (await import(`../content/${locale}.json`)).default;}
export const ediCopy=(locale:Locale)=>ediLocales[locale==='pt-BR'?'pt':locale==='zh-CN'?'zh':locale];
export {date,amount} from './format';
