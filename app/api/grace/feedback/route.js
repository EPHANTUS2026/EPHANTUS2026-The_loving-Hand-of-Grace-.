import {NextResponse} from 'next/server';
import {getSession,dbInsert} from '@/lib/supabase-rest';

const sentiments=new Set(['helpful','not_helpful','report']);
const reasons=new Set(['','Incorrect','Not relevant','Hard to understand','Too long','Too short','Felt impersonal','Source problem','Potentially unsafe','Privacy concern','Inappropriate','Broken source','Other']);

export async function POST(req){
  try{
    const body=await req.json();
    const sentiment=String(body?.sentiment||'');
    const reason=String(body?.reason||'').slice(0,80);
    if(!sentiments.has(sentiment)||!reasons.has(reason)) return NextResponse.json({error:'Invalid feedback.'},{status:400});
    const session=await getSession();
    const rows=await dbInsert('grace_response_feedback',{
      user_id:session?.user?.id||null,
      sentiment,
      reason:reason||null,
      has_sources:Boolean(body?.has_sources)
    });
    if(!rows?.[0]?.id) return NextResponse.json({error:'Feedback could not be confirmed.'},{status:503});
    return NextResponse.json({ok:true,confirmed:true,id:rows[0].id});
  }catch{
    return NextResponse.json({error:'Feedback could not be recorded.'},{status:503});
  }
}
