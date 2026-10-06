import {NextResponse} from 'next/server';
import {authRequest} from '@/lib/staff-accounts/service';
import {dbAdminSelect,dbRpc} from '@/lib/supabase-rest';
export async function POST(req){const headers={'Cache-Control':'no-store'};
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid request origin.'},{status:403,headers});
 try{const text=await req.text();if(text.length>12000)throw new Error();const {token,password}=JSON.parse(text);if(typeof token!=='string'||token.length>10000||typeof password!=='string'||password.length<12||password.length>128)return NextResponse.json({error:'Use a password between 12 and 128 characters.'},{status:400,headers});
 const user=await authRequest('/user',{method:'GET',token});if(!user.email_confirmed_at)throw new Error();
 const rows=await dbAdminSelect('staff_account_invitations',`auth_user_id=eq.${encodeURIComponent(user.id)}&status=eq.pending&select=id&limit=1`);if(!rows.length)throw new Error();
 await authRequest('/user',{method:'PUT',token,body:{password}});
 await dbRpc('staff_account_activate',{p_user:user.id});
 const res=NextResponse.json({ok:true},{headers});res.cookies.set('lhg_access',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});return res;
 }catch{return NextResponse.json({error:'Invitation unavailable or expired. Contact the administrator to check its status.'},{status:400,headers});}}
