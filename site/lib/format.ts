import type {Locale} from './schema';
export function date(value:string,locale:Locale){return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));}
export function amount(value:string,unit:string,locale:Locale){return new Intl.NumberFormat(locale,{style:unit==='USD'?'currency':'decimal',currency:unit==='USD'?'USD':undefined,notation:'compact',maximumFractionDigits:2}).format(Number(value))+(unit!=='USD'?' '+unit:'');}
