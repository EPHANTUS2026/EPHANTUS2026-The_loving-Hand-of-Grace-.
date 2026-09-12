import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {dbAdminSelect,dbInsert,dbUpdate} from '@/lib/supabase-rest';

const admins=['administrator','manager','super_admin'];
export async function GET(){
 const s=await authorised(admins); if(!s)return NextResponse.json({error:'Forbidden'},{status:403});
 const [definitions,versions,triggers,schedules,approvals,slas,escalations]=await Promise.all([
  dbAdminSelect('workflow_definitions','select=*&order=module,name'),dbAdminSelect('workflow_definition_versions','select=*&order=created_at.desc'),dbAdminSelect('workflow_triggers','select=*&order=created_at.desc'),dbAdminSelect('workflow_schedules','select=*&order=created_at.desc'),dbAdminSelect('workflow_approval_matrix_rules','select=*&order=priority'),dbAdminSelect('workflow_sla_policies','select=*&order=created_at.desc'),dbAdminSelect('workflow_escalation_rules','select=*&order=created_at.desc')
 ]);
 return NextResponse.json({definitions,versions,triggers,schedules,approvals,slas,escalations});
}
export async function POST(req){
 const s=await authorised(admins); if(!s)return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json();
 try{
  if(b.action==='create_definition'){
   const key=String(b.workflowKey||'').trim().toLowerCase().replace(/[^a-z0-9_]+/g,'_').slice(0,80); if(!key||!b.name)return NextResponse.json({error:'Name and workflow key are required'},{status:400});
   const rows=await dbInsert('workflow_definitions',{workflow_key:key,module:b.module||'care',name:String(b.name).slice(0,120),description:String(b.description||'').slice(0,1000),status:'draft',start_state:'start'}); const d=rows[0];
   const graph={nodes:[{id:'start',type:'start',title:'Start'},{id:'end',type:'end',title:'Complete'}],edges:[{id:'e-start-end',from:'start',to:'end'}]};
   const v=await dbInsert('workflow_definition_versions',{workflow_definition_id:d.id,version:1,status:'draft',graph,created_by:s.profile.staff_id||null,change_note:'Initial draft'});
   return NextResponse.json({definition:d,version:v[0]});
  }
  if(b.action==='save_version'){
   if(!b.definitionId||!b.graph)return NextResponse.json({error:'Definition and graph required'},{status:400});
   const defs=await dbAdminSelect('workflow_definitions',`id=eq.${b.definitionId}&select=id&limit=1`); if(!defs?.length)return NextResponse.json({error:'Definition not found'},{status:404});
   const versions=await dbAdminSelect('workflow_definition_versions',`workflow_definition_id=eq.${b.definitionId}&select=version&order=version.desc&limit=1`); const next=Number(versions?.[0]?.version||0)+1;
   const rows=await dbInsert('workflow_definition_versions',{workflow_definition_id:b.definitionId,version:next,status:'draft',graph:b.graph,input_schema:b.inputSchema||{},created_by:s.profile.staff_id||null,change_note:String(b.changeNote||'Draft update').slice(0,500)});
   return NextResponse.json({version:rows[0]});
  }
  if(b.action==='publish_version'){
   if(!b.versionId)return NextResponse.json({error:'Version required'},{status:400});
   const vr=await dbAdminSelect('workflow_definition_versions',`id=eq.${b.versionId}&select=*&limit=1`); const v=vr?.[0]; if(!v)return NextResponse.json({error:'Version not found'},{status:404});
   const old=await dbAdminSelect('workflow_definition_versions',`workflow_definition_id=eq.${v.workflow_definition_id}&status=eq.published&select=id`); for(const o of old||[])await dbUpdate('workflow_definition_versions',`id=eq.${o.id}`,{status:'retired'});
   await dbUpdate('workflow_definition_versions',`id=eq.${v.id}`,{status:'published',published_at:new Date().toISOString(),published_by:s.profile.staff_id||null}); await dbUpdate('workflow_definitions',`id=eq.${v.workflow_definition_id}`,{status:'active',version:v.version,updated_at:new Date().toISOString()});
   return NextResponse.json({ok:true});
  }
  if(b.action==='add_trigger'){
   const rows=await dbInsert('workflow_triggers',{workflow_definition_id:b.definitionId,trigger_type:b.triggerType||'event',source_module:b.sourceModule||null,event_name:b.eventName||null,conditions:b.conditions||[],enabled:true}); return NextResponse.json({trigger:rows[0]});
  }
  if(b.action==='add_schedule'){
   const next=b.nextRunAt||new Date(Date.now()+60000).toISOString(); const rows=await dbInsert('workflow_schedules',{workflow_definition_id:b.definitionId,name:b.name||'Scheduled workflow',cadence:b.cadence||'daily',timezone:'Africa/Nairobi',hour_of_day:b.hourOfDay??8,minute_of_hour:b.minuteOfHour??0,next_run_at:next,payload:b.payload||{}}); return NextResponse.json({schedule:rows[0]});
  }
  if(b.action==='add_sla'){
   const rows=await dbInsert('workflow_sla_policies',{workflow_definition_id:b.definitionId||null,module:b.module||null,task_type:b.taskType||null,name:b.name||'Service level',target_minutes:Number(b.targetMinutes||240),warning_minutes:Number(b.warningMinutes||60),enabled:true}); return NextResponse.json({sla:rows[0]});
  }
  if(b.action==='add_escalation'){
   const rows=await dbInsert('workflow_escalation_rules',{workflow_definition_id:b.definitionId||null,sla_policy_id:b.slaPolicyId||null,name:b.name||'Escalation',threshold:b.threshold||'breach',after_minutes:Number(b.afterMinutes||0),action_type:b.actionType||'notify_role',target_role:b.targetRole||'manager',payload:b.payload||{},enabled:true}); return NextResponse.json({escalation:rows[0]});
  }
  if(b.action==='add_approval_rule'){
   const rows=await dbInsert('workflow_approval_matrix_rules',{workflow_definition_id:b.definitionId||null,module:b.module||null,action_key:b.actionKey||'default_approval',priority:Number(b.priority||100),conditions:b.conditions||[],approver_role:b.approverRole||'manager',min_approvals:Number(b.minApprovals||1),amount_min:b.amountMin||null,amount_max:b.amountMax||null,enabled:true}); return NextResponse.json({rule:rows[0]});
  }
  return NextResponse.json({error:'Unknown action'},{status:400});
 }catch(e){return NextResponse.json({error:e.message},{status:500})}
}
