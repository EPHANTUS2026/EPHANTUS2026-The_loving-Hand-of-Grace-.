import {NextResponse} from 'next/server';
import {getSession,dbInsert} from '@/lib/supabase-rest';

export async function POST(req){
  try{
    const session=await getSession();
    if(!session?.user?.id) return NextResponse.json({error:'Sign in to save this response.'},{status:401});
    const body=await req.json();
    const responseText=String(body?.response_text||'').trim();
    if(!responseText||responseText.length>12000) return NextResponse.json({error:'Invalid response.'},{status:400});
    const sources=Array.isArray(body?.sources)?body.sources.slice(0,20):[];
    const context=String(body?.context||'grace').slice(0,80);
    const rows=await dbInsert('saved_grace_responses',{
      user_id:session.user.id,
      response_text:responseText,
      sources,
      context
    },{admin:false,token:session.token});
    if(!rows?.[0]?.id) return NextResponse.json({error:'Save could not be confirmed.'},{status:503});
    return NextResponse.json({ok:true,confirmed:true,id:rows[0].id,created_at:rows[0].created_at});
  }catch{
    return NextResponse.json({error:'Response could not be saved.'},{status:503});
  }
}
