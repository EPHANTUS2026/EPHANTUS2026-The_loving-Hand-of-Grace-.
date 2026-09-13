import {NextResponse} from 'next/server';
import {getSession,dbInsert,dbUpdate,dbSelect} from '@/lib/supabase-rest';

const modes=new Set(['recite','quiet','reflect','secular']);

export async function POST(req){
  const body=await req.json();
  const action=String(body?.action||'');
  const mode=String(body?.mode||'recite');
  if(!['start','complete'].includes(action)||!modes.has(mode)) return NextResponse.json({error:'Invalid prayer session action.'},{status:400});
  const session=await getSession().catch(()=>null);
  const userId=session?.user?.id||null;
  const now=new Date().toISOString();

  if(action==='start'){
    if(!userId) return NextResponse.json({ok:true,confirmed:true,anonymous:true});
    const rows=await dbInsert('guided_prayer_sessions',{user_id:userId,prayer_type:'serenity_prayer',mode,started_at:now},{admin:false,token:session.token});
    if(!rows?.[0]?.id) return NextResponse.json({error:'The session could not be confirmed.'},{status:503});
    return NextResponse.json({ok:true,confirmed:true,id:rows[0].id});
  }

  if(!userId) return NextResponse.json({ok:true,confirmed:true,anonymous:true});
  const rows=await dbSelect('guided_prayer_sessions',`user_id=eq.${encodeURIComponent(userId)}&prayer_type=eq.serenity_prayer&completed_at=is.null&select=id&order=started_at.desc&limit=1`,session.token).catch(()=>[]);
  if(!rows?.[0]?.id) return NextResponse.json({error:'No active prayer session was found.'},{status:404});
  const saved=await dbUpdate('guided_prayer_sessions',`id=eq.${encodeURIComponent(rows[0].id)}`,{completed_at:now},{admin:false,token:session.token});
  if(!saved?.[0]?.id) return NextResponse.json({error:'Completion could not be confirmed.'},{status:503});
  return NextResponse.json({ok:true,confirmed:true,id:saved[0].id});
}
