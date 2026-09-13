import { NextResponse } from 'next/server';
import { getSession, dbInsert } from '@/lib/supabase-rest';
import { moduleMap } from '@/lib/graceflow-enterprise';

const staffRoles=['counsellor','clinician','admissions','finance','administrator','manager','super_admin','hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service'];
const clean=(v,n=500)=>String(v||'').trim().slice(0,n);
function ref(module){return `${module.replace(/[^a-z]/gi,'').slice(0,4).toUpperCase()}-${Date.now().toString().slice(-8)}`}
export async function POST(req){
 const session=await getSession(); if(!session?.profile?.is_active||!staffRoles.includes(session.profile.role)) return NextResponse.json({error:'Staff authentication required.'},{status:403});
 const ct=req.headers.get('content-type')||''; const body=ct.includes('application/json')?await req.json():Object.fromEntries((await req.formData()).entries());
 const module=clean(body.module,40), info=moduleMap[module]; if(!info)return NextResponse.json({error:'Unknown GraceFlow module.'},{status:400});
 const recordType=clean(body.record_type,80); if(!info.types.includes(recordType))return NextResponse.json({error:'Unsupported record type.'},{status:400});
 const title=clean(body.title,160); if(!title)return NextResponse.json({error:'Title is required.'},{status:400});
 const reference=ref(module); const amount=body.amount?Number(body.amount):null;
 try{
  const rec=(await dbInsert('enterprise_records',{module,record_type:recordType,reference,title,status:'new',priority:clean(body.priority,20)||'routine',owner_staff_id:session.profile.staff_id||null,amount:Number.isFinite(amount)?amount:null,currency:'KES',due_at:body.due_at?`${clean(body.due_at,10)}T17:00:00+03:00`:null,data:{details:clean(body.details,3000),created_by_role:session.profile.role,source:'staff_portal'}}))?.[0];
  const flow=(await dbInsert('workflow_instances',{workflow_key:`${module}_${recordType}`,entity_type:'enterprise_record',entity_id:rec.id,current_state:'created',status:'active',metadata:{module,record_type:recordType,reference,source:'staff_portal'}}))?.[0];
  if(flow?.id){
    await dbInsert('workflow_events',{workflow_instance_id:flow.id,event_type:'record_created',source_channel:'staff_portal',actor_type:'staff',actor_id:session.profile.staff_id||null,summary:`${title} created`,metadata:{module,record_type:recordType,reference}});
    await dbInsert('workflow_tasks',{workflow_instance_id:flow.id,task_type:`${module}_review`,title:`Review ${title}`,assigned_staff_id:session.profile.staff_id||null,status:'queued',due_at:body.due_at?`${clean(body.due_at,10)}T17:00:00+03:00`:null,payload:{record_id:rec.id,module,reference}});
  }
  await dbInsert('audit_log',{action:'enterprise_record_created',entity_type:'enterprise_record',entity_id:rec.id,actor_profile_id:session.profile.id,after_state:{module,record_type:recordType,reference,status:'new'},reason:'Created through staff GraceFlow workspace'});
  if(!ct.includes('application/json')) return NextResponse.redirect(new URL(`/staff/graceflow/${module}`,req.url),303);
  return NextResponse.json({ok:true,record:rec,workflow_id:flow?.id},{status:201});
 }catch(e){return NextResponse.json({error:e.message||'Unable to create workflow record.'},{status:500})}
}
