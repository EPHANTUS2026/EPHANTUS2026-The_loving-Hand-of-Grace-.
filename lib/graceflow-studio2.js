import {dbAdminSelect,dbInsert,dbUpdate} from './supabase-rest';

function getPath(obj,path){return String(path||'').split('.').filter(Boolean).reduce((a,k)=>a==null?undefined:a[k],obj)}
function compare(value,op,target){
 if(op==='exists')return value!==undefined&&value!==null&&value!=='';
 if(op==='not_exists')return value===undefined||value===null||value==='';
 if(op==='contains')return Array.isArray(value)?value.includes(target):String(value??'').toLowerCase().includes(String(target??'').toLowerCase());
 if(op==='equals')return String(value??'')===String(target??'');
 if(op==='not_equals')return String(value??'')!==String(target??'');
 const a=Number(value),b=Number(target); if(Number.isNaN(a)||Number.isNaN(b))return false;
 if(op==='gt')return a>b;if(op==='gte')return a>=b;if(op==='lt')return a<b;if(op==='lte')return a<=b;return false;
}
function conditionsMatch(conditions,ctx){return (conditions||[]).every(c=>compare(getPath(ctx,c.field),c.operator||'equals',c.value))}
function outgoing(graph,nodeId){return (graph.edges||[]).filter(e=>e.from===nodeId)}

export function simulateGraph(graph,payload={}){
 const nodes=graph?.nodes||[]; const byId=new Map(nodes.map(n=>[n.id,n])); const trace=[]; const ctx={input:payload,last:{}};
 let current=nodes.find(n=>n.type==='start')?.id||nodes[0]?.id; let guard=0;
 while(current&&guard++<100){
  const node=byId.get(current); if(!node){trace.push({nodeId:current,status:'error',message:'Node missing'});break}
  let detail={};
  if(node.type==='condition'){const matched=conditionsMatch(node.config?.conditions||[],ctx);detail={matched};const edges=outgoing(graph,node.id);const edge=edges.find(e=>e.label===(matched?'true':'false'))||edges[0];trace.push({nodeId:node.id,type:node.type,title:node.title,status:'simulated',detail});current=edge?.to;continue}
  if(node.type==='task') detail={wouldCreateTask:true,assignedRole:node.config?.assignedRole||null,dueMinutes:node.config?.dueMinutes||null};
  else if(node.type==='approval') detail={wouldRequestApproval:true,approverRole:node.config?.approverRole||'manager'};
  else if(node.type==='notification') detail={wouldNotify:true,channel:node.config?.channel||'in_app'};
  else if(node.type==='delay') detail={wouldPause:true,minutes:Number(node.config?.minutes||60)};
  else if(node.type==='create_record') detail={wouldCreateRecord:true,module:node.config?.module||null,recordType:node.config?.recordType||null};
  else if(node.type==='connector') detail={wouldInvokeConnector:true,connector:node.config?.connector||null,action:node.config?.action||null};
  else if(node.type==='subflow') detail={wouldStartSubflow:true,workflowDefinitionId:node.config?.workflowDefinitionId||null};
  else if(node.type==='form') detail={wouldRequestForm:true,formKey:node.config?.formKey||null};
  else if(node.type==='end'){trace.push({nodeId:node.id,type:node.type,title:node.title,status:'complete'});break}
  trace.push({nodeId:node.id,type:node.type,title:node.title,status:'simulated',detail});ctx.last=detail;
  current=outgoing(graph,node.id)[0]?.to;
 }
 if(guard>=100)trace.push({status:'error',message:'Simulation stopped after 100 steps'});
 return {status:trace.some(x=>x.status==='error')?'failed':'completed',trace,steps:trace.length};
}

export async function createSimulation({definitionId,versionId,payload,staffId}){
 const versions=await dbAdminSelect('workflow_definition_versions',`id=eq.${versionId}&workflow_definition_id=eq.${definitionId}&select=*&limit=1`); const version=versions?.[0]; if(!version)throw new Error('Workflow version not found');
 const rows=await dbInsert('workflow_simulations',{workflow_definition_id:definitionId,definition_version_id:versionId,test_payload:payload||{},status:'running',started_by:staffId||null,started_at:new Date().toISOString()});
 const result=simulateGraph(version.graph,payload||{});
 await dbUpdate('workflow_simulations',`id=eq.${rows[0].id}`,{status:result.status,trace:result.trace,output:{steps:result.steps},finished_at:new Date().toISOString()});
 return {...result,id:rows[0].id};
}

export async function replayRun({engineRunId,payloadOverride={},staffId}){
 const runs=await dbAdminSelect('workflow_engine_runs',`id=eq.${engineRunId}&select=*&limit=1`);const run=runs?.[0];if(!run)throw new Error('Engine run not found');
 const versions=await dbAdminSelect('workflow_definition_versions',`id=eq.${run.definition_version_id}&select=*&limit=1`);const v=versions?.[0];if(!v)throw new Error('Version not found');
 const payload={...(run.trigger_payload||{}),...(payloadOverride||{})}; const sim=simulateGraph(v.graph,payload);
 const rows=await dbInsert('workflow_replays',{source_engine_run_id:run.id,workflow_instance_id:run.workflow_instance_id,mode:'dry_run',payload_override:payloadOverride,status:sim.status,trace:sim.trace,created_by:staffId||null});
 return {...sim,id:rows[0].id};
}
