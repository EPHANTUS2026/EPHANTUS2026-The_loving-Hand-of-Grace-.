import { randomUUID } from 'crypto';
import { dbInsert, dbAdminSelect } from '@/lib/supabase-rest';

const ACTIONS = {
  request_callback: { workflowKey:'grace_callback', title:'Grace callback request', taskType:'callback', assignedRole:'admissions' },
  admissions_contact: { workflowKey:'grace_admissions_contact', title:'Grace admissions contact request', taskType:'admissions_contact', assignedRole:'admissions' },
  family_support_contact: { workflowKey:'grace_family_support', title:'Grace family support request', taskType:'family_support_contact', assignedRole:'family_liaison' },
  appointment_request: { workflowKey:'grace_appointment_request', title:'Grace appointment request', taskType:'appointment_request', assignedRole:'admissions' },
  aftercare_contact: { workflowKey:'grace_aftercare_contact', title:'Grace aftercare contact request', taskType:'aftercare_contact', assignedRole:'aftercare_coordinator' },
};

const clean=(value,max=240)=>String(value??'').trim().slice(0,max);
export const listGraceActions=()=>Object.keys(ACTIONS);

export async function createGraceFlowAction(input={}){
  const {action,consent}=input;
  const spec=ACTIONS[action];
  if(!spec) throw new Error('Unsupported Grace action.');
  if(consent!==true) throw new Error('Explicit consent is required before Grace creates a request.');

  const phone=clean(input.phone,40);
  const email=clean(input.email,160);
  if(!phone&&!email) throw new Error('A phone number or email address is required.');

  const requestId=randomUUID();
  const context=clean(input.context,80)||'visitor';
  const contact={name:clean(input.name,120)||null,phone:phone||null,email:email||null};

  const instanceRows=await dbInsert('workflow_instances',{
    workflow_key:spec.workflowKey,entity_type:'grace_request',entity_id:requestId,
    current_state:'requested',status:'active',
    metadata:{source:'grace',context,action,consent:true,contact}
  });
  const instance=instanceRows?.[0];
  if(!instance?.id) throw new Error('GraceFlow did not confirm the workflow request.');

  await dbInsert('workflow_events',{
    workflow_instance_id:instance.id,event_type:'grace.request_created',source_channel:'grace',
    actor_type:'assistant',summary:`Grace created ${action} after user consent.`,
    metadata:{request_id:requestId,action,context}
  });

  const taskRows=await dbInsert('workflow_tasks',{
    workflow_instance_id:instance.id,task_type:spec.taskType,title:spec.title,
    assigned_role:spec.assignedRole,status:'queued',
    payload:{request_id:requestId,source:'grace',context,contact,note:clean(input.note,500)||null,consent:true}
  });
  const task=taskRows?.[0];
  if(!task?.id) throw new Error('GraceFlow did not confirm the staff task.');

  await dbInsert('audit_log',{
    action:'graceflow.request_created',entity_type:'grace_request',entity_id:requestId,
    after_state:{workflow_instance_id:instance.id,task_id:task.id,action,status:'queued'},
    reason:'Created by Grace after explicit user consent.'
  });

  const savedInstance=(await dbAdminSelect('workflow_instances',`id=eq.${encodeURIComponent(instance.id)}&select=id,workflow_key,current_state,status,entity_id`))?.[0];
  const savedTask=(await dbAdminSelect('workflow_tasks',`id=eq.${encodeURIComponent(task.id)}&select=id,status,assigned_role,title`))?.[0];
  if(!savedInstance||!savedTask) throw new Error('The system of record could not confirm the GraceFlow request.');

  return {confirmed:true,requestId,workflowInstanceId:savedInstance.id,workflow:savedInstance.workflow_key,state:savedInstance.current_state,status:savedTask.status,taskId:savedTask.id,assignedRole:savedTask.assigned_role,message:'Your request has been recorded and queued for the appropriate team. GraceFlow confirmed it in the system of record.'};
}
