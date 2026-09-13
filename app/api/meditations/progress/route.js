import {NextResponse} from 'next/server';
import {getSession,dbInsert,dbUpdate,dbSelect} from '@/lib/supabase-rest';

export async function POST(req){
  const session=await getSession();
  if(!session?.user?.id) return NextResponse.json({error:'Authentication required.'},{status:401});
  const body=await req.json();
  const action=String(body?.action||'');
  const meditationId=String(body?.meditation_id||'');
  if(!['save','complete','open'].includes(action)||!meditationId) return NextResponse.json({error:'Invalid meditation action.'},{status:400});

  const published=await dbSelect('meditations',`id=eq.${encodeURIComponent(meditationId)}&status=eq.published&clinical_review_status=eq.approved&spiritual_review_status=eq.approved&select=id`,session.token).catch(()=>[]);
  if(!published?.[0]) return NextResponse.json({error:'Meditation unavailable.'},{status:404});

  const existing=await dbSelect('meditation_progress',`user_id=eq.${encodeURIComponent(session.user.id)}&meditation_id=eq.${encodeURIComponent(meditationId)}&select=id,saved,opened_at,completed_at`,session.token).catch(()=>[]);
  const now=new Date().toISOString();
  const patch=action==='save'?{saved:true,updated_at:now}:action==='complete'?{completed_at:now,opened_at:existing?.[0]?.opened_at||now,updated_at:now}:{opened_at:existing?.[0]?.opened_at||now,updated_at:now};

  let rows;
  if(existing?.[0]?.id){
    rows=await dbUpdate('meditation_progress',`id=eq.${encodeURIComponent(existing[0].id)}`,patch,{admin:false,token:session.token});
  }else{
    rows=await dbInsert('meditation_progress',{user_id:session.user.id,meditation_id:meditationId,saved:action==='save',opened_at:now,completed_at:action==='complete'?now:null,created_at:now,updated_at:now},{admin:false,token:session.token});
  }
  if(!rows?.[0]?.id) return NextResponse.json({error:'The action could not be confirmed.'},{status:503});
  return NextResponse.json({ok:true,confirmed:true,id:rows[0].id,action});
}
