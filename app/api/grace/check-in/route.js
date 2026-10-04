import { NextResponse } from 'next/server';
import { getSession, dbInsert, dbAdminSelect } from '@/lib/supabase-rest';

import {checkinPayload,persistCheckin} from '@/lib/grace/check-in.mjs';

export async function POST(req){
  if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid request origin.'},{status:403});
  try{
  const session=await getSession();
  if(!session?.profile?.is_active||session.profile.role!=='client'||!session.profile.client_id) return NextResponse.json({error:'Authentication required.'},{status:401});
  let body,payload;
  try{body=await req.json();payload=checkinPayload(body);}catch{return NextResponse.json({error:'Invalid check-in values.'},{status:400});}
  const created=await persistCheckin(session,payload,dbInsert);
  // Portal-originated operational signals enter the same GraceFlow event spine.
  try{
    const flows=await dbAdminSelect('workflow_instances',`entity_type=eq.client&entity_id=eq.${encodeURIComponent(session.profile.client_id)}&status=eq.active&select=id&order=updated_at.desc&limit=1`);
    if(flows?.[0]?.id) await dbInsert('workflow_events',{workflow_instance_id:flows[0].id,event_type:'grace_checkin_submitted',source_channel:'client_portal',actor_type:'client',actor_id:session.profile.client_id,summary:'Client completed a Grace check-in',metadata:{mood_score:payload.mood_score,craving_level:payload.craving_level,coping_tool:payload.coping_tool}});
  }catch{}
  return NextResponse.json({ok:true,confirmed:true,...created},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:'Check-in could not be confirmed. Please try again.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
}
