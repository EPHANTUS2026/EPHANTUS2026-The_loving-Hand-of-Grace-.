import {connectorFor,notificationsMode} from './registry';

function allowedRecipient(recipient){
  const mode=notificationsMode();
  if(mode==='disabled') return false;
  if(mode==='production') return true;
  const allow=(process.env.NOTIFICATIONS_ALLOWLIST||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  return allow.includes(String(recipient||'').trim().toLowerCase());
}

export async function connectorHealth(channel){
  const adapter=connectorFor(channel);
  if(!adapter)return {ok:false,status:'ERROR',configured:false,errorCode:'unsupported_channel',errorMessage:'Unsupported notification channel.'};
  return adapter.healthCheck();
}

export async function sendThroughConnector(channel,payload){
  const adapter=connectorFor(channel);
  if(!adapter)return {ok:false,status:'failed',retryable:false,errorCode:'unsupported_channel',errorMessage:'Unsupported notification channel.'};
  if(!allowedRecipient(payload?.to))return {ok:false,provider:adapter.provider,status:'failed',retryable:false,errorCode:'environment_blocked',errorMessage:'Recipient is not permitted in this notification environment.'};
  const health=await adapter.healthCheck();
  if(!health.ok)return {...health,status:'failed'};
  return adapter.send(payload);
}
