import { NextResponse } from 'next/server';
import { getSession, dbSelect, dbUpdate, dbInsert } from '@/lib/supabase-rest';
const clinicalRoles=['clinician','clinical_director','doctor','psychologist'];
const allowedRoles=['counsellor',...clinicalRoles,'admissions','administrator','super_admin'];
const next={enquiry:['screening'],screening:['assessment'],assessment:['admission_ready'],admission_ready:['admitted'],admitted:['treatment'],treatment:['discharge'],discharge:['aftercare'],aftercare:['closed']};
const transitionRoles={screening:['admissions','counsellor',...clinicalRoles,'administrator','super_admin'],assessment:['admissions',...clinicalRoles,'administrator','super_admin'],admission_ready:['admissions',...clinicalRoles,'administrator','super_admin'],admitted:['admissions',...clinicalRoles,'administrator','super_admin'],treatment:['counsellor',...clinicalRoles,'administrator','super_admin'],discharge:[...clinicalRoles,'administrator','super_admin'],aftercare:[...clinicalRoles,'administrator','super_admin'],closed:[...clinicalRoles,'administrator','super_admin']};
const taskFor={
 screening:{type:'admissions_screening',title:'Complete screening summary',role:'admissions'},
 assessment:{type:'admissions_assessment',title:'Complete assessment and programme recommendation',role:'clinician'},
 admission_ready:{type:'admission_preparation',title:'Confirm client record and prepare admission',role:'admissions'},
 admitted:{type:'care_plan',title:'Create active care plan',role:'counsellor'},
 treatment:{type:'care_delivery',title:'Deliver care plan, sessions and scheduled reviews',role:'counsellor'},
 discharge:{type:'discharge_handoff',title:'Complete discharge handoff and aftercare plan',role:'clinician'},
 aftercare:{type:'aftercare_followup',title:'Run aftercare reviews and follow-up cadence',role:'counsellor'},
 closed:{type:'journey_close',title:'Archive completed recovery journey',role:'administrator'}
};
async function prerequisites(a,to,token){
 if(to==='assessment'&&!a.screening_summary)return 'Complete the screening summary before assessment.';
 if(to==='admission_ready'&&!a.assessment_summary)return 'Complete the assessment summary before marking admission ready.';
 if(to==='admitted'&&!a.client_id)return 'Create and link the client record before admission.';
 if(to==='treatment'){
   const plans=await dbSelect('care_plans',`client_id=eq.${encodeURIComponent(a.client_id)}&status=eq.active&select=id`,token);
   if(!plans?.length)return 'Create an active care plan before treatment begins.';
 }
 if(to==='discharge'){
   const d=await dbSelect('discharge_plans',`client_id=eq.${encodeURIComponent(a.client_id)}&select=id,status`,token);
   if(!d?.length||!['ready_for_review','approved','completed'].includes(d[0].status))return 'Prepare a discharge plan and move it to review/approved status first.';
 }
 if(to==='aftercare'){
   const d=await dbSelect('discharge_plans',`client_id=eq.${encodeURIComponent(a.client_id)}&select=id,status`,token);
   if(!d?.length||!['approved','completed'].includes(d[0].status))return 'An authorised clinician must approve the discharge plan before aftercare begins.';
   const p=await dbSelect('aftercare_plans',`client_id=eq.${encodeURIComponent(a.client_id)}&select=id,status`,token);
   if(!p?.length)return 'Create an aftercare plan before transitioning to aftercare.';
 }
 if(to==='closed'){
   const p=await dbSelect('aftercare_plans',`client_id=eq.${encodeURIComponent(a.client_id)}&select=id,status`,token);
   if(!p?.length||p[0].status!=='completed')return 'Complete the aftercare plan before closing the journey.';
 }
 return null;
}
export async function POST(req){
 const s=await getSession(); if(!s?.profile || !allowedRoles.includes(s.profile.role)) return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const ct=req.headers.get('content-type')||''; let admissionId,to,reason,returnTo;
  if(ct.includes('form')){const fd=await req.formData();admissionId=String(fd.get('admissionId')||'');to=String(fd.get('to')||'');reason=String(fd.get('reason')||'');returnTo=String(fd.get('returnTo')||'');}
  else ({admissionId,to,reason,returnTo}=await req.json());
  const rows=await dbSelect('admissions',`id=eq.${encodeURIComponent(admissionId)}&select=*`,s.token); const a=rows?.[0]; if(!a)return NextResponse.json({error:'Not found'},{status:404});
  if(!(next[a.stage]||[]).includes(to)) return NextResponse.json({error:`Invalid transition ${a.stage} → ${to}`},{status:409});
  if(!(transitionRoles[to]||[]).includes(s.profile.role)){const message='Your role cannot approve this GraceFlow transition.';if(returnTo)return NextResponse.redirect(new URL(`${returnTo}?blocked=${encodeURIComponent(message)}`,req.url),303);return NextResponse.json({error:message},{status:403});}
  const blocked=await prerequisites(a,to,s.token); if(blocked){if(returnTo)return NextResponse.redirect(new URL(`${returnTo}?blocked=${encodeURIComponent(blocked)}`,req.url),303);return NextResponse.json({error:blocked},{status:409});}
  const now=new Date().toISOString(); const updated=await dbUpdate('admissions',`id=eq.${encodeURIComponent(a.id)}`,{stage:to,updated_at:now},{token:s.token,admin:false});
  if(a.client_id){const clientPatch={admission_stage:to,updated_at:now};if(to==='admitted')clientPatch.admission_date=new Date().toISOString().slice(0,10);if(to==='aftercare')clientPatch.discharge_date=new Date().toISOString().slice(0,10);await dbUpdate('clients',`id=eq.${encodeURIComponent(a.client_id)}`,clientPatch,{token:s.token,admin:false});}
  let flows=await dbSelect('workflow_instances',`entity_type=eq.admission&entity_id=eq.${encodeURIComponent(a.id)}&status=eq.active&select=id,current_state,metadata`,s.token);let flow=flows?.[0];
  if(!flow&&a.client_id){flows=await dbSelect('workflow_instances',`entity_type=eq.client&entity_id=eq.${encodeURIComponent(a.client_id)}&status=eq.active&select=id,current_state,metadata`,s.token);flow=flows?.[0];}
  if(!flow) flow=(await dbInsert('workflow_instances',{workflow_key:'recovery_journey',entity_type:'admission',entity_id:a.id,current_state:to,status:to==='closed'?'completed':'active',metadata:{reference:a.reference,client_id:a.client_id||null}},{token:s.token,admin:false}))?.[0];
  else await dbUpdate('workflow_instances',`id=eq.${flow.id}`,{current_state:to,status:to==='closed'?'completed':'active',metadata:{...(flow.metadata||{}),client_id:a.client_id||flow.metadata?.client_id||null},updated_at:now},{token:s.token,admin:false});
  if(flow?.id){await dbUpdate('workflow_tasks',`workflow_instance_id=eq.${flow.id}&status=in.(queued,active,blocked)`,{status:'completed',completed_at:now},{token:s.token,admin:false});const t=taskFor[to];if(t&&to!=='closed')await dbInsert('workflow_tasks',{workflow_instance_id:flow.id,task_type:t.type,title:t.title,assigned_role:t.role,status:'queued',payload:{admission_id:a.id,client_id:a.client_id||null,state:to}},{token:s.token,admin:false});}
  await dbInsert('audit_log',{actor_auth_user_id:s.user.id,actor_profile_id:s.profile.id,action:'graceflow_transition',entity_type:'admission',entity_id:a.id,before_state:{stage:a.stage},after_state:{stage:to},reason:String(reason||'Approved workflow transition').slice(0,500)});
  if(returnTo)return NextResponse.redirect(new URL(returnTo,req.url),303);
  return NextResponse.json({ok:true,admission:updated?.[0]});
 }catch(e){return NextResponse.json({error:e?.message||'Transition failed'},{status:500})}
}
