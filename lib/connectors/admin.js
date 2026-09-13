import {getSession,dbAdminSelect,dbInsert,dbUpdate} from '@/lib/supabase-rest';
import {connectorHealth} from './router';

const ROLES=new Set(['super_admin','administrator','manager','director']);
export async function requireConnectorAdmin(){const s=await getSession();if(!s?.profile?.is_active||!ROLES.has(s.profile.role))return null;return s;}
export async function connectorStates(){return dbAdminSelect('integration_connectors','select=id,connector_key,provider_type,display_name,enabled,last_health_status,last_health_at,config&order=connector_key.asc');}
export async function testConnector(channel,{enable=false,actor=null}={}){
  const started=Date.now();const health=await connectorHealth(channel);const status=health.ok?'ENABLED':(health.configured===false?'CONFIGURED':health.status||'ERROR');
  await dbInsert('integration_health_checks',{connector_key:channel,status:status.toLowerCase(),latency_ms:Date.now()-started,message:health.ok?'Provider authentication verified.':health.errorMessage||'Provider verification failed.',metadata:{provider:health.provider||null,configured:Boolean(health.configured),error_code:health.errorCode||null}});
  const patch={last_health_status:status.toLowerCase(),last_health_at:new Date().toISOString()};
  if(enable)patch.enabled=Boolean(health.ok);
  await dbUpdate('integration_connectors',`connector_key=eq.${encodeURIComponent(channel)}`,patch);
  if(actor)await dbInsert('audit_log',{actor_type:'staff',actor_id:actor.profile?.id||null,action:enable?'connector_enable_test':'connector_health_check',entity_type:'integration_connector',metadata:{channel,status,provider:health.provider||null}}).catch(()=>null);
  return {channel,provider:health.provider||null,configured:Boolean(health.configured),verified:Boolean(health.ok),status,checkedAt:new Date().toISOString(),message:health.ok?'Provider authentication verified.':health.errorMessage||'Connector could not be verified.'};
}
