import {dbInsert} from './supabase-rest';

function safeMetadata(meta={}){
  const blocked=/password|secret|token|authorization|clinical_note|therapy_note|medical_history/i;
  return Object.fromEntries(Object.entries(meta||{}).filter(([key])=>!blocked.test(key)).map(([k,v])=>[k,typeof v==='string'?v.slice(0,500):v]));
}

export function requestId(req){
  return req?.headers?.get?.('x-request-id') || globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`;
}

export async function recordSystemEvent({eventType,severity='info',component='application',message='',metadata={},requestId=null}){
  try{
    await dbInsert('system_events',{event_type:eventType,severity,component,message:String(message||'').slice(0,1000),metadata:safeMetadata(metadata),request_id:requestId});
  }catch{/* Observability must never break the primary workflow. */}
}
