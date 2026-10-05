import {dbAdminSelect,dbInsert} from './supabase-rest';
import {connectorFor} from './connectors/registry';
import {providerHealthState,persistedHealthStatus} from './provider-health-state.mjs';

export function configuredProvider(connectorKey){
  const adapter=connectorFor(connectorKey);
  return {configured:Boolean(adapter?.configured()),message:adapter?'Provider configuration checked':'No provider adapter is registered'};
}

export async function integrationHealth({persist=true}={}){
  const rows=await dbAdminSelect('integration_connectors','select=id,connector_key,provider_type,display_name,enabled&order=connector_key.asc');
  const results=[];
  for(const row of rows||[]){
    const adapter=connectorFor(row.connector_key);
    const configured=Boolean(adapter?.configured());
    let health=null;
    if(row.enabled&&configured){
      try{health=await adapter.healthCheck();}catch{health={ok:false};}
    }
    const status=providerHealthState({enabled:row.enabled,configured,health});
    const checkedAt=new Date().toISOString();
    const message={disabled:'Connector disabled',unconfigured:'Provider configuration is incomplete','configured-unverified':'Provider configuration exists; authentication is not verified',healthy:'Provider authentication verified; delivery is not certified',degraded:'Provider verification failed'}[status];
    const item={connectorKey:row.connector_key,displayName:row.display_name,enabled:row.enabled,status,message,checkedAt,verifiedAt:status==='healthy'?checkedAt:null,deliveryVerified:false};
    results.push(item);
    if(persist)await dbInsert('integration_health_checks',{connector_key:row.connector_key,status:persistedHealthStatus(status),message,metadata:{enabled:row.enabled,providerType:row.provider_type,state:status,verifiedAt:item.verifiedAt,deliveryVerified:false}});
  }
  return results;
}
