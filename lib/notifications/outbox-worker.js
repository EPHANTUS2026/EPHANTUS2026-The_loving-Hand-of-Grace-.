import {dbAdminSelect,dbInsert,dbUpdate} from '@/lib/supabase-rest';
import {sendThroughConnector} from '@/lib/connectors/router';
import {notificationsMode} from '@/lib/connectors/registry';

const waits=[0,60,300,1800,7200];
function interpolate(body,data={}){return String(body||'').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(_,key)=>String(data[key]??''));}

export async function processNotificationOutbox({limit=20}={}){
  const summary={processed:0,accepted:0,delivered:0,retried:0,deadLettered:0,ambiguous:0};
  if(notificationsMode()==='disabled')return {...summary,disabled:true};
  const now=new Date().toISOString();
  const boundedLimit=Number.isFinite(Number(limit))?Math.min(50,Math.max(1,Math.floor(Number(limit)))):20;
  const rows=await dbAdminSelect('notification_outbox',`status=eq.queued&next_attempt_at=lte.${encodeURIComponent(now)}&select=*&order=created_at.asc&limit=${boundedLimit}`);
  for(const item of rows||[]){
    const priorAttempt=Number(item.attempt||0),attempt=priorAttempt+1;
    const claimed=await dbUpdate('notification_outbox',`id=eq.${encodeURIComponent(item.id)}&status=eq.queued&attempt=eq.${priorAttempt}`,{status:'sending',attempt,updated_at:now});
    if(!claimed?.length)continue;
    summary.processed++;
    const finishQuery=`id=eq.${encodeURIComponent(item.id)}&status=eq.sending&attempt=eq.${attempt}`;
    let res;
    try{
      const templates=item.template_key?await dbAdminSelect('notification_templates',`template_key=eq.${encodeURIComponent(item.template_key)}&channel=eq.${encodeURIComponent(item.channel)}&active=eq.true&select=template_key,channel,subject,body,contains_sensitive_content&limit=1`):[];
      const tpl=templates?.[0];
      if(!tpl||tpl.contains_sensitive_content){res={ok:false,retryable:false,errorCode:'template_not_permitted'};}
      else{
        const data=item.payload||{};
        const payload=item.channel==='whatsapp'?{to:item.recipient,template:tpl.template_key,language:data.language||'en_US',components:data.components||[]}:{to:item.recipient,text:interpolate(tpl.body,data),subject:interpolate(tpl.subject,data)};
        try{
          res=await sendThroughConnector(item.channel,payload);
          // A provider 5xx or malformed response may follow an accepted send.
          if(!res||typeof res.ok!=='boolean'||/^http_5\d{2}$/.test(res.errorCode||''))res={ok:false,ambiguous:true,errorCode:'dispatch_outcome_unknown'};
        }
        catch{res={ok:false,ambiguous:true,errorCode:'dispatch_outcome_unknown'};}
      }
    }catch{res={ok:false,retryable:true,errorCode:'template_lookup_failed'};}
    const stamp=new Date().toISOString();
    // Never reclaim sending automatically: a timeout may follow acceptance.
    if(res.ambiguous){
      await dbUpdate('notification_outbox',finishQuery,{last_error:'dispatch_outcome_unknown',updated_at:stamp});
      summary.ambiguous++;
      continue;
    }
    if(res.ok){
      // Acceptance does not prove delivery. Reconciliation remains required.
      const delivered=res.status==='delivered';
      await dbUpdate('notification_outbox',finishQuery,{status:delivered?'delivered':'sending',provider_reference:res.providerReference||null,last_error:delivered?null:'provider_accepted_delivery_unverified',updated_at:stamp});
      await dbInsert('notification_deliveries',{notification_id:item.notification_id||null,channel:item.channel,recipient:item.recipient,provider:res.provider||null,status:delivered?'delivered':'accepted',provider_message_id:res.providerReference||null,attempt_count:attempt,sent_at:stamp});
      delivered?summary.delivered++:summary.accepted++;
    }else{
      const dead=!res.retryable||attempt>=Number(item.max_attempts||5),delay=waits[Math.min(attempt,waits.length-1)];
      const safeCodes=['template_not_permitted','template_lookup_failed','environment_blocked','unsupported_channel','missing_configuration','verification_required','provider_unavailable'];
      const errorCode=safeCodes.includes(res.errorCode)||/^http_\d{3}$/.test(res.errorCode||'')?res.errorCode:'delivery_failed';
      await dbUpdate('notification_outbox',finishQuery,{status:dead?'dead_letter':'queued',last_error:errorCode,next_attempt_at:new Date(Date.now()+delay*1000).toISOString(),updated_at:stamp});
      await dbInsert('notification_deliveries',{notification_id:item.notification_id||null,channel:item.channel,recipient:item.recipient,provider:res.provider||null,status:dead?'dead_letter':'failed',attempt_count:attempt,last_error:errorCode});
      dead?summary.deadLettered++:summary.retried++;
    }
  }
  return summary;
}
