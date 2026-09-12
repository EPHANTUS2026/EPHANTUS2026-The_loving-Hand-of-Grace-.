import { dbInsert } from '@/lib/supabase-rest';
function clean(v,n=500){return String(v||'').trim().slice(0,n)}
export async function POST(request){
  let body; try{body=await request.json()}catch{return Response.json({ok:false,error:'Invalid request'},{status:400})}
  const name=clean(body.name,120), phone=clean(body.phone,40), email=clean(body.email,160), forWhom=clean(body.forWhom,80), message=clean(body.message,3000), consent=clean(body.consent,10);
  if(!name||!phone||!email||!forWhom||!message||consent!=='yes') return Response.json({ok:false,error:'Missing required fields'},{status:400});
  try{
    const reference=`ADM-${Date.now().toString().slice(-8)}`;
    const rows=await dbInsert('admissions',{reference,enquiry_name:name,enquiry_phone:phone,enquiry_email:email,source:`website:${forWhom}`,stage:'enquiry',priority:'routine',screening_summary:message,next_action:'Private screening contact'});
    const admission=rows?.[0];
    if(admission?.id){
      const flow=(await dbInsert('workflow_instances',{workflow_key:'recovery_journey',entity_type:'admission',entity_id:admission.id,current_state:'enquiry',status:'active',metadata:{reference,source:'website_contact'}}))?.[0];
      if(flow?.id){
        await dbInsert('workflow_events',{workflow_instance_id:flow.id,event_type:'enquiry_submitted',source_channel:'website',actor_type:'visitor',summary:`Website enquiry received for ${forWhom}`,metadata:{reference,consent:true}});
        await dbInsert('workflow_tasks',{workflow_instance_id:flow.id,task_type:'admissions_screening',title:'Contact enquirer and complete private screening',assigned_role:'admissions',status:'queued',payload:{admission_id:admission.id,reference}});
      }
    }
    await dbInsert('audit_log',{action:'website_enquiry_received',entity_type:'admission',entity_id:admission?.id||reference,after_state:{reference,stage:'enquiry',source:forWhom},reason:'Consent captured on public enquiry form'});
    return Response.json({ok:true,reference},{status:201});
  }catch{
    return Response.json({ok:false,error:'Admissions service is temporarily unavailable. Please contact the centre directly.'},{status:503});
  }
}
