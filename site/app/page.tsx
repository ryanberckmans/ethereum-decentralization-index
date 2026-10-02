import { redirect } from "next/navigation";
import {cookies} from 'next/headers';
import {LOCALES,type Locale} from '@/lib/schema';
export default async function Home() { const candidate=(await cookies()).get('edi-language')?.value as Locale;redirect('/'+(LOCALES.includes(candidate)?candidate:'en')); }
