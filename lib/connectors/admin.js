import {getSession,dbAdminSelect,dbInsert,dbUpdate} from '@/lib/supabase-rest';
import {connectorHealth} from './router';
import {providerHealthState,persistedHealthStatus} from '../provider-health-state.mjs';

const ROLES=new Set(['super_admin','administrator','manager','director']);
export async function requireConnectorAdmin(){const s=await getSession();if(!s?.profile?.is_active||!ROLES.has(s.profile.role))return null;return s;}
export async function connectorStates(){return dbAdminSelect('integration_connectors','select=id,connector_key,provider_type,display_name,enabled,last_health_status,last_health_at,config&order=connector_key.asc');}
export async function testConnector(channel,{enable=false,actor=null}={}){
  const started=Date.now();const health=await connectorHealth(channel);const status=providerHealthState({enabled:true,configured:Boolean(health.configured),health});
  await dbInsert('integration_health_checks',{connector_key:channel,status:persistedHealthStatus(status),latency_ms:Date.now()-started,message:status==='healthy'?'Provider authentication verified; delivery is not certified.':'Provider verification incomplete or failed.',metadata:{state:status,provider:health.provider||null,configured:Boolean(health.configured),error_code:health.errorCode||null,deliveryVerified:false}});
  const patch={last_health_status:status.toLowerCase(),last_health_at:new Date().toISOString()};
  if(enable)patch.enabled=status==='healthy';
  await dbUpdate('integration_connectors',`connector_key=eq.${encodeURIComponent(channel)}`,patch);
  if(actor)await dbInsert('audit_log',{actor_type:'staff',actor_id:actor.profile?.id||null,action:enable?'connector_enable_test':'connector_health_check',entity_type:'integration_connector',metadata:{channel,status,provider:health.provider||null}}).catch(()=>null);
  return {channel,provider:health.provider||null,configured:Boolean(health.configured),verified:status==='healthy',deliveryVerified:false,status,checkedAt:new Date().toISOString(),message:status==='healthy'?'Provider authentication verified; delivery is not certified.':'Connector could not be verified.'};
}
