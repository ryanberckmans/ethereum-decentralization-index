import {NextResponse,type NextRequest} from 'next/server';
import {LOCALES,type Locale} from './lib/schema';
export function middleware(request:NextRequest){
 const candidate=request.nextUrl.pathname.split('/')[1] as Locale;
 const headers=new Headers(request.headers);
 headers.set('x-directory-locale',LOCALES.includes(candidate)?candidate:'en');
 return NextResponse.next({request:{headers}});
}
