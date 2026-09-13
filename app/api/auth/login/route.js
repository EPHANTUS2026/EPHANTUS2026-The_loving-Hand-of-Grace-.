import { NextResponse } from 'next/server';
import { signIn } from '@/lib/supabase-rest';
export async function POST(req){
  const form=await req.formData(); const email=String(form.get('email')||'').trim(); const password=String(form.get('password')||'');
  try{
    const data=await signIn(email,password);
    const res=NextResponse.redirect(new URL('/api/auth/route-user',req.url),303);
    res.cookies.set('lhg_access',data.access_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:data.expires_in||3600});
    if(data.refresh_token) res.cookies.set('lhg_refresh',data.refresh_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
    return res;
  }catch{return NextResponse.redirect(new URL('/login?error=1',req.url),303)}
}
