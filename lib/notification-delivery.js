import {dbAdminSelect,dbUpdate} from './supabase-rest';
import {dispatchConnector} from './connectors';

export async function processNotificationOutbox(limit=100){
  const now=new Date().toISOString();
  const rows=await dbAdminSelect('notification_outbox',`status=eq.queued&next_attempt_at=lte.${encodeURIComponent(now)}&select=*&order=created_at.asc&limit=${Math.max(1,Math.min(200,limit))}`).catch(()=>[]);
  let delivered=0,failed=0,deadLettered=0;
  for(const item of rows||[]){
    const attempt=Number(item.attempt||0)+1;
    try{
      await dbUpdate('notification_outbox',`id=eq.${item.id}`,{status:'sending',attempt,updated_at:now});
      const result=await dispatchConnector({connectorKey:item.channel,action:'send',payload:{recipient:item.recipient,templateKey:item.template_key,...(item.payload||{})}});
      await dbUpdate('notification_outbox',`id=eq.${item.id}`,{status:'delivered',provider_reference:result.providerReference||null,updated_at:new Date().toISOString()}); delivered++;
    }catch(error){
      const exhausted=attempt>=Number(item.max_attempts||5); const delay=Math.min(60,Math.pow(2,attempt));
      await dbUpdate('notification_outbox',`id=eq.${item.id}`,{status:exhausted?'dead_letter':'queued',last_error:String(error.message||error).slice(0,1000),next_attempt_at:new Date(Date.now()+delay*60000).toISOString(),updated_at:new Date().toISOString()});
      if(exhausted)deadLettered++;else failed++;
    }
  }
  return {delivered,failed,deadLettered};
}
