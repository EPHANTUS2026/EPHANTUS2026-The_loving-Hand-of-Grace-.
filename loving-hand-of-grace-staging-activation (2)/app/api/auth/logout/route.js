import { NextResponse } from 'next/server';
export async function POST(req){const r=NextResponse.redirect(new URL('/login',req.url),303);r.cookies.set('lhg_access','',{path:'/',maxAge:0});r.cookies.set('lhg_refresh','',{path:'/',maxAge:0});return r}
