import { NextResponse } from 'next/server';
export function middleware(req){
  const protectedPrefixes=['/portal','/family','/staff','/admin','/graceflow','/account'];
  if(protectedPrefixes.some(p=>req.nextUrl.pathname.startsWith(p)) && !req.cookies.get('lhg_access')?.value){
    return NextResponse.redirect(new URL(['/staff','/admin','/graceflow'].some(p=>req.nextUrl.pathname.startsWith(p))?'/staff-login':'/login',req.url));
  }
  return NextResponse.next();
}
export const config={matcher:['/portal/:path*','/family/:path*','/staff/:path*','/admin/:path*','/graceflow/:path*','/account/:path*']};
