import { NextResponse } from 'next/server';
import { getSession, dbInsert, dbAdminSelect } from '@/lib/supabase-rest';

export async function POST(req){
  const session=await getSession();
  if(!session?.profile?.client_id) return NextResponse.json({error:'Authentication required.'},{status:401});
  const body=await req.json();
  const mood=Number(body?.mood);
  const craving=Number(body?.craving);
  if(!Number.isInteger(mood)||mood<1||mood>5||!Number.isInteger(craving)||craving<0||craving>10){
    return NextResponse.json({error:'Invalid check-in values.'},{status:400});
  }
  await dbInsert('grace_checkins',{client_id:session.profile.client_id,mood_score:mood,craving_level:craving,coping_tool:body?.coping||null,note:body?.note||null},{admin:false,token:session.token});
  // Portal-originated operational signals enter the same GraceFlow event spine.
  try{
    const flows=await dbAdminSelect('workflow_instances',`entity_type=eq.client&entity_id=eq.${encodeURIComponent(session.profile.client_id)}&status=eq.active&select=id&order=updated_at.desc&limit=1`);
    if(flows?.[0]?.id) await dbInsert('workflow_events',{workflow_instance_id:flows[0].id,event_type:'grace_checkin_submitted',source_channel:'client_portal',actor_type:'client',actor_id:session.profile.client_id,summary:'Client completed a Grace check-in',metadata:{mood_score:mood,craving_level:craving,coping_tool:body?.coping||null}});
  }catch{}
  return NextResponse.json({ok:true});
}
