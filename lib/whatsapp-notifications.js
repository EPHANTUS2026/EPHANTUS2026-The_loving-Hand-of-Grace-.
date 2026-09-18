import {dbAdminSelect,dbInsert} from '@/lib/supabase-rest';
import {normalizeWhatsAppNumber} from '@/lib/whatsapp';
import {sendWhatsAppTemplate} from '@/lib/whatsapp-provider';

const TEMPLATE_ENV={
  BOOKING_CONFIRMATION:'WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION',
  BOOKING_REMINDER:'WHATSAPP_TEMPLATE_BOOKING_REMINDER',
  BOOKING_RESCHEDULED:'WHATSAPP_TEMPLATE_BOOKING_RESCHEDULED',
  BOOKING_CANCELLED:'WHATSAPP_TEMPLATE_BOOKING_CANCELLED',
  CALLBACK_ACKNOWLEDGEMENT:'WHATSAPP_TEMPLATE_CALLBACK_RECEIVED'
};

export async function hasWhatsAppConsent({phone,bookingId=null,purpose}){
  const normalized=`+${normalizeWhatsAppNumber(phone)}`;
  const rows=await dbAdminSelect('communication_consents',`phone_number=eq.${encodeURIComponent(normalized)}&channel=eq.whatsapp&purpose=eq.${encodeURIComponent(purpose)}&consent_status=eq.granted&select=id,revoked_at&order=consented_at.desc&limit=1`).catch(()=>[]);
  return Boolean(rows?.[0]&&!rows[0].revoked_at);
}

export async function recordWhatsAppConsent({phone,bookingId=null,purpose,source='website'}){
  const normalized=`+${normalizeWhatsAppNumber(phone)}`;
  return dbInsert('communication_consents',{booking_id:bookingId,phone_number:normalized,channel:'whatsapp',purpose,consent_status:'granted',consent_version:'1',source});
}

function bodyParams(values=[]){return [{type:'body',parameters:values.map(text=>({type:'text',text:String(text??'')}))}];}

export async function sendGovernedWhatsApp({phone,bookingId=null,workflowId=null,purpose,variables=[]}){
  if(!TEMPLATE_ENV[purpose])return {ok:false,status:'failed',errorCode:'TEMPLATE_NOT_AVAILABLE'};
  if(!(await hasWhatsAppConsent({phone,bookingId,purpose})))return {ok:false,status:'failed',errorCode:'NO_CONSENT'};
  const template=process.env[TEMPLATE_ENV[purpose]];
  if(!template)return {ok:false,status:'failed',errorCode:'TEMPLATE_NOT_AVAILABLE'};
  const to=normalizeWhatsAppNumber(phone);
  const event=(await dbInsert('communication_events',{channel:'whatsapp',purpose,recipient_reference:`***${to.slice(-4)}`,provider:'meta_whatsapp',booking_id:bookingId,workflow_id:workflowId,status:'QUEUED'}))?.[0];
  const result=await sendWhatsAppTemplate({to,template,components:bodyParams(variables)});
  await dbInsert('whatsapp_messages',{provider_message_id:result.providerMessageId||null,phone_number:`***${to.slice(-4)}`,direction:'outbound',message_type:'template',template_name:template,status:result.ok?'accepted':'failed',sent_at:result.ok?new Date().toISOString():null,failed_at:result.ok?null:new Date().toISOString(),failure_code:result.errorCode||null,metadata:{purpose,booking_id:bookingId}}).catch(()=>{});
  if(event?.id){const {dbUpdate}=await import('@/lib/supabase-rest');await dbUpdate('communication_events',`id=eq.${event.id}`,{provider_message_id:result.providerMessageId||null,status:result.ok?'SENT':'FAILED',error_code:result.errorCode||null,updated_at:new Date().toISOString()}).catch(()=>{});}
  return result;
}

export const sendBookingConfirmation=(args)=>sendGovernedWhatsApp({...args,purpose:'BOOKING_CONFIRMATION'});
export const sendBookingReminder=(args)=>sendGovernedWhatsApp({...args,purpose:'BOOKING_REMINDER'});
export const sendRescheduleConfirmation=(args)=>sendGovernedWhatsApp({...args,purpose:'BOOKING_RESCHEDULED'});
export const sendCancellationConfirmation=(args)=>sendGovernedWhatsApp({...args,purpose:'BOOKING_CANCELLED'});
export const sendCallbackAcknowledgement=(args)=>sendGovernedWhatsApp({...args,purpose:'CALLBACK_ACKNOWLEDGEMENT'});
