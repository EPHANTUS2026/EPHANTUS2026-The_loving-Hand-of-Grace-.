import {dbAdminSelect,dbInsert,dbUpdate} from './supabase-rest';

const ENV={
 email:{url:'GRACEFLOW_EMAIL_WEBHOOK_URL',token:'GRACEFLOW_EMAIL_WEBHOOK_TOKEN'},
 sms:{url:'GRACEFLOW_SMS_WEBHOOK_URL',token:'GRACEFLOW_SMS_WEBHOOK_TOKEN'},
 whatsapp:{url:'GRACEFLOW_WHATSAPP_WEBHOOK_URL',token:'GRACEFLOW_WHATSAPP_WEBHOOK_TOKEN'},
};
function redact(payload={}){const copy={...payload};for(const k of ['token','secret','password','apiKey','authorization'])if(k in copy)copy[k]='[REDACTED]';return copy}
export async function dispatchConnector({connectorKey,action='send',payload={},workflowInstanceId=null}){
 const rows=await dbAdminSelect('integration_connectors',`connector_key=eq.${encodeURIComponent(connectorKey)}&select=*&limit=1`);const connector=rows?.[0];if(!connector||!connector.enabled)throw new Error(`${connectorKey} connector is not enabled`);
 const actions=await dbAdminSelect('connector_actions',`connector_id=eq.${connector.id}&action_key=eq.${encodeURIComponent(action)}&enabled=eq.true&select=*&limit=1`).catch(()=>[]);let actionRow=actions?.[0];
 if(!actionRow){const inserted=await dbInsert('connector_actions',{connector_id:connector.id,action_key:action,display_name:`${connector.display_name} ${action}`,input_schema:{},enabled:true});actionRow=inserted[0]}
 const execution=(await dbInsert('connector_executions',{connector_action_id:actionRow.id,workflow_instance_id:workflowInstanceId,request_payload_redacted:redact(payload),status:'running',attempt:1}))[0];
 try{
  const env=ENV[connectorKey];const endpoint=env&&process.env[env.url];if(!endpoint)throw new Error(`${connectorKey} provider endpoint is not configured`);
  const token=process.env[env.token];const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,payload})});const text=await res.text();if(!res.ok)throw new Error(`${connectorKey} provider failed (${res.status}): ${text.slice(0,240)}`);
  let body;try{body=JSON.parse(text)}catch{body={message:text}}
  await dbUpdate('connector_executions',`id=eq.${execution.id}`,{status:'completed',provider_reference:body?.id||body?.reference||null,completed_at:new Date().toISOString()});
  return {executionId:execution.id,providerReference:body?.id||body?.reference||null};
 }catch(error){await dbUpdate('connector_executions',`id=eq.${execution.id}`,{status:'failed',error:error.message,completed_at:new Date().toISOString()});throw error}
}
