import { NextResponse } from 'next/server';
import { authorised, field, nullable } from '@/lib/route-auth';
import { dbSelect, dbInsert, dbUpdate } from '@/lib/supabase-rest';
const roles=['admissions','clinician','counsellor','administrator','super_admin'];
export async function POST(req,{params}){
 const s=await authorised(roles); if(!s)return NextResponse.json({error:'Forbidden'},{status:403});
 const rows=await dbSelect('admissions',`id=eq.${encodeURIComponent(params.id)}&select=*`,s.token); const a=rows?.[0];
 if(!a)return NextResponse.json({error:'Admission not found'},{status:404});
 if(a.client_id)return NextResponse.redirect(new URL(`/staff/clients/${a.client_id}`,req.url),303);
 const fd=await req.formData(); const legalName=field(fd,'legal_name',160)||a.enquiry_name; if(!legalName)return NextResponse.json({error:'Client name is required'},{status:400});
 const code=`LHG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
 const client=(await dbInsert('clients',{client_code:code,legal_name:legalName,preferred_name:nullable(field(fd,'preferred_name',100)),date_of_birth:nullable(field(fd,'date_of_birth',20)),phone:a.enquiry_phone||nullable(field(fd,'phone',40)),email:a.enquiry_email||nullable(field(fd,'email',160)),admission_stage:a.stage,primary_programme:nullable(field(fd,'primary_programme',120)),preferred_language:field(fd,'preferred_language',40)||'English',assigned_staff_id:a.assigned_staff_id||null},{token:s.token,admin:false}))?.[0];
 await dbUpdate('admissions',`id=eq.${encodeURIComponent(a.id)}`,{client_id:client.id,updated_at:new Date().toISOString()},{token:s.token,admin:false});
 const flows=await dbSelect('workflow_instances',`entity_type=eq.admission&entity_id=eq.${encodeURIComponent(a.id)}&status=eq.active&select=id,metadata`,s.token);
 let flow=flows?.[0];
 if(flow) await dbUpdate('workflow_instances',`id=eq.${flow.id}`,{metadata:{...(flow.metadata||{}),client_id:client.id,client_code:code},updated_at:new Date().toISOString()},{token:s.token,admin:false});
 else flow=(await dbInsert('workflow_instances',{workflow_key:'recovery_journey',entity_type:'admission',entity_id:a.id,current_state:a.stage,status:'active',metadata:{reference:a.reference,client_id:client.id,client_code:code}},{token:s.token,admin:false}))?.[0];
 if(flow?.id) await dbInsert('workflow_tasks',{workflow_instance_id:flow.id,task_type:'client_record',title:'Complete linked client record and stage requirements',assigned_role:'counsellor',status:'queued',payload:{client_id:client.id,admission_id:a.id}},{token:s.token,admin:false});
 await dbInsert('audit_log',{actor_auth_user_id:s.user.id,actor_profile_id:s.profile.id,action:'client_record_created',entity_type:'client',entity_id:client.id,after_state:{client_code:code,admission_stage:a.stage},reason:`Created from ${a.reference}`});
 return NextResponse.redirect(new URL(`/staff/clients/${client.id}`,req.url),303);
}
