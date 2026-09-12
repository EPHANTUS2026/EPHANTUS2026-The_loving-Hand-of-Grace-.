import {dbAdminSelect,dbInsert} from './supabase-rest';

const ENV={
  email:['GRACEFLOW_EMAIL_WEBHOOK_URL','GRACEFLOW_EMAIL_WEBHOOK_TOKEN'],
  sms:['GRACEFLOW_SMS_WEBHOOK_URL','GRACEFLOW_SMS_WEBHOOK_TOKEN'],
  whatsapp:['GRACEFLOW_WHATSAPP_WEBHOOK_URL','GRACEFLOW_WHATSAPP_WEBHOOK_TOKEN'],
};

export function configuredProvider(connectorKey){
  const pair=ENV[connectorKey];
  if(!pair)return {configured:false,message:'No provider adapter is registered'};
  const endpoint=process.env[pair[0]];
  return {configured:Boolean(endpoint),message:endpoint?'Server-side endpoint configured':'Provider endpoint is not configured'};
}

export async function integrationHealth({persist=true}={}){
  const rows=await dbAdminSelect('integration_connectors','select=id,connector_key,provider_type,display_name,enabled&order=connector_key.asc').catch(()=>[]);
  const results=[];
  for(const row of rows||[]){
    const cfg=configuredProvider(row.connector_key);
    const status=!row.enabled?'degraded':cfg.configured?'healthy':'unconfigured';
    const item={connectorKey:row.connector_key,displayName:row.display_name,enabled:row.enabled,status,message:!row.enabled?'Connector disabled':cfg.message,checkedAt:new Date().toISOString()};
    results.push(item);
    if(persist)await dbInsert('integration_health_checks',{connector_key:row.connector_key,status,message:item.message,metadata:{enabled:row.enabled,providerType:row.provider_type}}).catch(()=>null);
  }
  return results;
}
