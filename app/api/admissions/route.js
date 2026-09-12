import { NextResponse } from 'next/server';
import { dbInsert } from '@/lib/supabase-rest';
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
export async function POST(req){
 try{
  const b=await req.json(); const name=clean(b.name,120), phone=clean(b.phone,40), email=clean(b.email,160);
  if(!name || (!phone && !email)) return NextResponse.json({error:'Name and either phone or email are required.'},{status:400});
  const ref=`ADM-${Date.now().toString().slice(-8)}`;
  const admission=(await dbInsert('admissions',{reference:ref,enquiry_name:name,enquiry_phone:phone||null,enquiry_email:email||null,source:'website',stage:'enquiry',priority:'routine',next_action:'Private screening contact'}))?.[0];
  if(admission?.id){
    const flow=(await dbInsert('workflow_instances',{workflow_key:'recovery_journey',entity_type:'admission',entity_id:admission.id,current_state:'enquiry',status:'active',metadata:{reference:ref,source:'website'}}))?.[0];
    if(flow?.id){
      await dbInsert('workflow_events',{workflow_instance_id:flow.id,event_type:'admission_enquiry_created',source_channel:'website',actor_type:'visitor',summary:'Admission enquiry entered GraceFlow',metadata:{admission_id:admission.id,reference:ref}});
      await dbInsert('workflow_tasks',{workflow_instance_id:flow.id,task_type:'admissions_screening',title:'Contact enquirer and complete private screening',assigned_role:'admissions',status:'queued',payload:{admission_id:admission.id,reference:ref}});
    }
  }
  await dbInsert('audit_log',{action:'admission_enquiry_created',entity_type:'admission',entity_id:admission?.id||ref,after_state:{reference:ref,stage:'enquiry'},reason:'Website enquiry'});
  return NextResponse.json({ok:true,reference:ref},{status:201});
 }catch(e){return NextResponse.json({error:'Admissions service is not configured yet.'},{status:503})}
}
