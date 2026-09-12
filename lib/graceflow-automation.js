import {dbAdminSelect,dbInsert,dbUpdate} from './supabase-rest';
import {dispatchConnector} from './connectors';

const BLOCKING = new Set(['task','approval','delay','form']);
const SAFE_MODULES = new Set(['purchase','inventory','hr','helpdesk','timesheets','project','crm','sign','accounting','discuss','documents','field-service','email-marketing','care']);

export function compareValue(actual,operator,expected){
 if(operator==='exists') return actual!==undefined&&actual!==null&&actual!=='';
 if(operator==='not_exists') return actual===undefined||actual===null||actual==='';
 if(operator==='equals') return String(actual??'')===String(expected??'');
 if(operator==='not_equals') return String(actual??'')!==String(expected??'');
 if(operator==='contains') return String(actual??'').toLowerCase().includes(String(expected??'').toLowerCase());
 if(operator==='gt') return Number(actual)>Number(expected);
 if(operator==='gte') return Number(actual)>=Number(expected);
 if(operator==='lt') return Number(actual)<Number(expected);
 if(operator==='lte') return Number(actual)<=Number(expected);
 if(operator==='in') return Array.isArray(expected)&&expected.map(String).includes(String(actual));
 return false;
}

export function getPath(obj,path){return String(path||'').split('.').filter(Boolean).reduce((v,k)=>v?.[k],obj)}
export function conditionsMatch(conditions,ctx){return (conditions||[]).every(c=>compareValue(getPath(ctx,c.field),c.operator||'equals',c.value))}
function edgeFrom(graph,id,ctx){
 const candidates=(graph.edges||[]).filter(e=>e.from===id);
 return candidates.find(e=>!e.condition||conditionsMatch(e.condition,ctx)) || null;
}
function nodeById(graph,id){return (graph.nodes||[]).find(n=>n.id===id)}
function firstNode(graph){return (graph.nodes||[]).find(n=>n.type==='start') || graph.nodes?.[0]}

export async function publishedVersionForDefinition(definitionId){
 const rows=await dbAdminSelect('workflow_definition_versions',`workflow_definition_id=eq.${definitionId}&status=eq.published&select=*&order=version.desc&limit=1`);
 return rows?.[0]||null;
}

export async function startWorkflow({definition,version,payload={},source='staff_portal',entityType='automation',entityId}){
 const entity=entityId||crypto.randomUUID();
 const start=firstNode(version.graph||{});
 const instances=await dbInsert('workflow_instances',{workflow_key:definition.workflow_key,entity_type:entityType,entity_id:entity,current_state:start?.id||'start',status:'active',definition_version_id:version.id,engine_status:'running',engine_cursor:start?.id||null,metadata:{automation:true,input:payload,source}});
 const instance=instances[0];
 const runs=await dbInsert('workflow_engine_runs',{workflow_instance_id:instance.id,definition_version_id:version.id,trigger_type:source,trigger_payload:payload,status:'running'});
 await dbInsert('workflow_events',{workflow_instance_id:instance.id,event_type:'automation_started',source_channel:source,actor_type:'system',summary:`${definition.name} started`,metadata:{workflow_key:definition.workflow_key}});
 return executeFrom({instance,run:runs[0],definition,version,payload,nodeId:start?.id});
}

export async function executeFrom({instance,run,definition,version,payload,nodeId}){
 const graph=version.graph||{nodes:[],edges:[]}; const ctx={input:payload,instance,definition}; let current=nodeId; let steps=0;
 while(current && steps++<50){
  const node=nodeById(graph,current); if(!node) throw new Error(`Workflow node ${current} not found`);
  const execRows=await dbInsert('workflow_node_executions',{engine_run_id:run.id,workflow_instance_id:instance.id,node_id:node.id,node_type:node.type,status:'started',input:ctx}); const exec=execRows[0];
  try{
   const result=await executeNode(node,{...ctx,workflowInstanceId:instance.id});
   await dbUpdate('workflow_node_executions',`id=eq.${exec.id}`,{status:result.wait?'waiting':'completed',output:result.output||{},finished_at:result.wait?null:new Date().toISOString()});
   if(result.wait){
    await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{current_state:node.id,engine_cursor:node.id,engine_status:'waiting',next_wake_at:result.nextWakeAt||null,updated_at:new Date().toISOString()});
    await dbUpdate('workflow_engine_runs',`id=eq.${run.id}`,{status:'waiting',metrics:{steps}});
    return {instanceId:instance.id,status:'waiting',node:node.id};
   }
   if(node.type==='end'){
    await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{current_state:node.id,engine_cursor:null,engine_status:'completed',status:'completed',updated_at:new Date().toISOString()});
    await dbUpdate('workflow_engine_runs',`id=eq.${run.id}`,{status:'completed',finished_at:new Date().toISOString(),metrics:{steps}});
    await dbInsert('workflow_events',{workflow_instance_id:instance.id,event_type:'automation_completed',source_channel:'engine',actor_type:'system',summary:`${definition.name} completed`});
    return {instanceId:instance.id,status:'completed'};
   }
   ctx.last=result.output||{};
   const edge=node.type==='condition' ? edgeFrom(graph,node.id,{...ctx,last:result.output}) : edgeFrom(graph,node.id,ctx);
   current=edge?.to||null;
  }catch(error){
   await dbUpdate('workflow_node_executions',`id=eq.${exec.id}`,{status:'failed',error:error.message,finished_at:new Date().toISOString()});
   await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{engine_status:'failed',updated_at:new Date().toISOString()});
   await dbUpdate('workflow_engine_runs',`id=eq.${run.id}`,{status:'failed',error:error.message,finished_at:new Date().toISOString()});
   throw error;
  }
 }
 throw new Error('Workflow exceeded maximum execution depth or has no terminal path.');
}

async function executeNode(node,ctx){
 const cfg=node.config||{};
 if(node.type==='start'||node.type==='end') return {output:{ok:true}};
 if(node.type==='condition') return {output:{matched:conditionsMatch(cfg.conditions||[],ctx)}};
 if(node.type==='task'){
  let minutes=Number(cfg.dueMinutes||0),slaPolicyId=null;
  if(cfg.useSla!==false){const slas=await dbAdminSelect('workflow_sla_policies',`enabled=eq.true&workflow_definition_id=eq.${ctx.definition.id}&select=*&order=created_at.desc&limit=1`);if(slas?.[0]){minutes=Number(slas[0].target_minutes);slaPolicyId=slas[0].id;}}
  const due=minutes?new Date(Date.now()+minutes*60000).toISOString():null;
  await dbInsert('workflow_tasks',{workflow_instance_id:ctx.workflowInstanceId,task_type:cfg.taskType||'automation_task',title:node.title||'Workflow task',assigned_role:cfg.assignedRole||null,status:'queued',due_at:due,payload:{nodeId:node.id,automation:true,slaPolicyId}});
  return {wait:true,output:{taskCreated:true,slaPolicyId}};
 }
 if(node.type==='approval'){
  let approverRole=cfg.approverRole||'manager',count=Math.max(1,Number(cfg.minApprovals||1));
  const actionKey=cfg.actionKey||cfg.approvalType||'default_approval'; const amount=Number(getPath(ctx,'input.amount')||0);
  const rules=await dbAdminSelect('workflow_approval_matrix_rules',`enabled=eq.true&workflow_definition_id=eq.${ctx.definition.id}&action_key=eq.${encodeURIComponent(actionKey)}&select=*&order=priority.asc`);
  const rule=(rules||[]).find(r=>(r.amount_min==null||amount>=Number(r.amount_min))&&(r.amount_max==null||amount<=Number(r.amount_max))&&conditionsMatch(r.conditions||[],ctx));
  if(rule){approverRole=rule.approver_role||approverRole;count=Math.max(1,Number(rule.min_approvals||count));}
  for(let i=0;i<count;i++) await dbInsert('workflow_approvals',{workflow_instance_id:ctx.workflowInstanceId,approval_type:actionKey,assigned_role:approverRole,status:'pending'});
  return {wait:true,output:{approvalsCreated:count,approverRole}};
 }
 if(node.type==='notification'){
  await dbInsert('workflow_notifications',{workflow_instance_id:ctx.workflowInstanceId,role:cfg.role||null,staff_id:cfg.staffId||null,module:cfg.module||ctx.definition.module,severity:cfg.severity||'info',title:node.title||'GraceFlow notification',body:cfg.body||'',action_url:cfg.actionUrl||'/staff/graceflow'});
  return {output:{notified:true}};
 }
 if(node.type==='delay'){
  const minutes=Math.max(1,Number(cfg.minutes||60)); return {wait:true,nextWakeAt:new Date(Date.now()+minutes*60000).toISOString(),output:{delayMinutes:minutes}};
 }
 if(node.type==='create_record'){
  if(!SAFE_MODULES.has(cfg.module)) throw new Error('Unsupported target module');
  const ref=`GF-${Date.now().toString(36).toUpperCase()}`;
  const rows=await dbInsert('enterprise_records',{module:cfg.module,record_type:cfg.recordType||'automation_record',reference:ref,title:cfg.title||node.title||'Automated record',status:cfg.status||'new',priority:cfg.priority||'routine',data:{createdByGraceFlow:true,sourceWorkflow:ctx.definition.workflow_key}});
  return {output:{recordId:rows[0]?.id,reference:ref}};
 }
 if(node.type==='connector'){
  try{
   const result=await dispatchConnector({connectorKey:cfg.connector||'email',action:cfg.action||'send',payload:{...(cfg.payload||{}),workflowInput:ctx.input},workflowInstanceId:ctx.workflowInstanceId});
   return {output:{connectorExecuted:true,...result}};
  }catch(error){
   await dbInsert('workflow_retry_jobs',{workflow_instance_id:ctx.workflowInstanceId,node_id:node.id,payload:{connector:cfg.connector||'email',action:cfg.action||'send',connectorPayload:{...(cfg.payload||{}),workflowInput:ctx.input}},status:'queued',attempt:0,max_attempts:Number(cfg.maxAttempts||5),next_attempt_at:new Date(Date.now()+60000).toISOString(),last_error:error.message});
   return {wait:true,nextWakeAt:new Date(Date.now()+60000).toISOString(),output:{connectorQueuedForRetry:true,error:error.message}};
  }
 }
 if(node.type==='subflow'){
  if(!cfg.workflowDefinitionId) throw new Error('Subflow workflow definition is required');
  const defs=await dbAdminSelect('workflow_definitions',`id=eq.${cfg.workflowDefinitionId}&status=eq.active&select=*&limit=1`);const childDef=defs?.[0];if(!childDef)throw new Error('Subflow definition not found or inactive');
  const childVersion=await publishedVersionForDefinition(childDef.id);if(!childVersion)throw new Error('Subflow has no published version');
  const child=await startWorkflow({definition:childDef,version:childVersion,payload:{...ctx.input,parentWorkflowInstanceId:ctx.workflowInstanceId},source:'subflow',entityType:'subflow'});
  return cfg.waitForCompletion&&child.status!=='completed'?{wait:true,output:{childWorkflowInstanceId:child.instanceId,childStatus:child.status}}:{output:{childWorkflowInstanceId:child.instanceId,childStatus:child.status}};
 }
 if(node.type==='form'){
  const forms=await dbAdminSelect('workflow_forms',`form_key=eq.${encodeURIComponent(cfg.formKey||'')}&status=eq.published&select=*&limit=1`);if(!forms?.length)throw new Error('Published workflow form not found');
  await dbInsert('workflow_tasks',{workflow_instance_id:ctx.workflowInstanceId,task_type:'form_request',title:node.title||forms[0].name,assigned_role:cfg.assignedRole||null,status:'queued',payload:{nodeId:node.id,formId:forms[0].id,formKey:forms[0].form_key}});
  return {wait:true,output:{formRequested:true,formId:forms[0].id}};
 }
 if(node.type==='route') return {output:{route:cfg.route||'default'}};
 throw new Error(`Unsupported workflow node type: ${node.type}`);
}

export async function matchAndStartEvent({eventName,module,payload={},source='api'}){
 const triggers=await dbAdminSelect('workflow_triggers',`enabled=eq.true&trigger_type=eq.event&event_name=eq.${encodeURIComponent(eventName)}&select=*`);
 const matched=[];
 for(const trigger of triggers||[]){
  if(trigger.source_module&&trigger.source_module!==module) continue;
  if(!conditionsMatch(trigger.conditions||[],{input:payload,module,eventName})) continue;
  const defs=await dbAdminSelect('workflow_definitions',`id=eq.${trigger.workflow_definition_id}&status=eq.active&select=*&limit=1`); const def=defs?.[0]; if(!def)continue;
  const version=await publishedVersionForDefinition(def.id); if(!version)continue;
  matched.push(await startWorkflow({definition:def,version,payload,source,entityType:'event'}));
 }
 return matched;
}


export async function resumeWorkflow(instanceId,resumePayload={}){
 const rows=await dbAdminSelect('workflow_instances',`id=eq.${instanceId}&select=*&limit=1`); const instance=rows?.[0]; if(!instance)throw new Error('Workflow instance not found');
 const defs=await dbAdminSelect('workflow_definitions',`workflow_key=eq.${encodeURIComponent(instance.workflow_key)}&select=*&limit=1`); const definition=defs?.[0]; if(!definition)throw new Error('Workflow definition not found');
 const versions=await dbAdminSelect('workflow_definition_versions',`id=eq.${instance.definition_version_id}&select=*&limit=1`); const version=versions?.[0]; if(!version)throw new Error('Workflow version not found');
 const graph=version.graph||{nodes:[],edges:[]}; const edge=edgeFrom(graph,instance.engine_cursor,{input:instance.metadata?.input||{},resume:resumePayload,instance,definition});
 if(!edge){await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{engine_status:'completed',status:'completed',engine_cursor:null,next_wake_at:null,updated_at:new Date().toISOString()});return {instanceId:instance.id,status:'completed'};}
 const runs=await dbInsert('workflow_engine_runs',{workflow_instance_id:instance.id,definition_version_id:version.id,trigger_type:'resume',trigger_payload:resumePayload,status:'running'});
 await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{engine_status:'running',next_wake_at:null,updated_at:new Date().toISOString()});
 await dbInsert('workflow_events',{workflow_instance_id:instance.id,event_type:'automation_resumed',source_channel:'engine',actor_type:'system',summary:`${definition.name} resumed`,metadata:{fromNode:instance.engine_cursor}});
 return executeFrom({instance:{...instance,engine_status:'running'},run:runs[0],definition,version,payload:instance.metadata?.input||{},nodeId:edge.to});
}

export async function processEngineTick(){
 const now=new Date().toISOString(); let scheduled=0,awakened=0,escalated=0;
 const schedules=await dbAdminSelect('workflow_schedules',`enabled=eq.true&next_run_at=lte.${encodeURIComponent(now)}&select=*&limit=100`);
 for(const s of schedules||[]){
  const defs=await dbAdminSelect('workflow_definitions',`id=eq.${s.workflow_definition_id}&status=eq.active&select=*&limit=1`); const def=defs?.[0]; if(!def)continue; const version=await publishedVersionForDefinition(def.id); if(!version)continue;
  await startWorkflow({definition:def,version,payload:s.payload||{},source:'schedule',entityType:'schedule'}); scheduled++;
  const next=nextSchedule(s); await dbUpdate('workflow_schedules',`id=eq.${s.id}`,{last_run_at:now,next_run_at:next,enabled:s.cadence==='once'?false:s.enabled});
 }
 const waking=await dbAdminSelect('workflow_instances',`engine_status=eq.waiting&next_wake_at=lte.${encodeURIComponent(now)}&select=*&limit=100`);
 for(const instance of waking||[]){try{await resumeWorkflow(instance.id,{reason:'timer_elapsed'});awakened++;}catch{await dbUpdate('workflow_instances',`id=eq.${instance.id}`,{engine_status:'failed',updated_at:now});}}
 const overdue=await dbAdminSelect('workflow_tasks',`status=in.(queued,in_progress,blocked)&due_at=lt.${encodeURIComponent(now)}&select=id,workflow_instance_id,title,assigned_role,due_at,payload&limit=200`);
 for(const task of overdue||[]){
  const exists=await dbAdminSelect('workflow_notifications',`workflow_instance_id=eq.${task.workflow_instance_id}&title=eq.${encodeURIComponent('SLA breach: '+task.title)}&select=id&limit=1`);
  if(!exists?.length){
   let role='manager'; const slaId=task.payload?.slaPolicyId;
   if(slaId){const rules=await dbAdminSelect('workflow_escalation_rules',`enabled=eq.true&sla_policy_id=eq.${slaId}&threshold=eq.breach&select=*&order=created_at.asc&limit=1`);if(rules?.[0]?.target_role)role=rules[0].target_role;}
   await dbInsert('workflow_notifications',{workflow_instance_id:task.workflow_instance_id,role,severity:'critical',title:`SLA breach: ${task.title}`,body:`Task overdue since ${task.due_at}`,action_url:'/staff/graceflow'}); escalated++;
  }
 }
 const retries=await dbAdminSelect('workflow_retry_jobs',`status=eq.queued&next_attempt_at=lte.${encodeURIComponent(now)}&select=*&limit=100`);
 let retried=0,deadLettered=0;
 for(const job of retries||[]){
  try{
   const p=job.payload||{};await dispatchConnector({connectorKey:p.connector,action:p.action||'send',payload:p.connectorPayload||{},workflowInstanceId:job.workflow_instance_id});
   await dbUpdate('workflow_retry_jobs',`id=eq.${job.id}`,{status:'completed',attempt:Number(job.attempt||0)+1,updated_at:now});retried++;
   if(job.workflow_instance_id)await resumeWorkflow(job.workflow_instance_id,{reason:'connector_retry_completed',nodeId:job.node_id});
  }catch(error){
   const attempt=Number(job.attempt||0)+1;
   if(attempt>=Number(job.max_attempts||5)){
    await dbUpdate('workflow_retry_jobs',`id=eq.${job.id}`,{status:'dead_letter',attempt,last_error:error.message,updated_at:now});
    await dbInsert('workflow_dead_letters',{workflow_instance_id:job.workflow_instance_id,node_id:job.node_id,source_type:'retry_job',source_id:job.id,payload:job.payload||{},error:error.message});deadLettered++;
   }else{
    const delay=Math.min(60,Math.pow(2,attempt));await dbUpdate('workflow_retry_jobs',`id=eq.${job.id}`,{attempt,last_error:error.message,next_attempt_at:new Date(Date.now()+delay*60000).toISOString(),updated_at:now});
   }
  }
 }
 return {scheduled,awakened,escalated,retried,deadLettered,at:now};
}

function nextSchedule(s){
 const base=new Date(); const n=new Date(base);
 if(s.cadence==='hourly') n.setHours(n.getHours()+1);
 else if(s.cadence==='daily') n.setDate(n.getDate()+1);
 else if(s.cadence==='weekly') n.setDate(n.getDate()+7);
 else if(s.cadence==='monthly') n.setMonth(n.getMonth()+1);
 else return null;
 if(s.hour_of_day!=null)n.setHours(s.hour_of_day,s.minute_of_hour||0,0,0);
 return n.toISOString();
}
