import crypto from 'node:crypto';

const timeout=(ms)=>AbortSignal.timeout?AbortSignal.timeout(ms):undefined;
const version=()=>process.env.WHATSAPP_API_VERSION||'v22.0';

export function whatsappConfigured(){
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
}

export async function whatsappHealth(){
  if(!whatsappConfigured())return {ok:false,status:'configuration_required'};
  try{
    const r=await fetch(`https://graph.facebook.com/${version()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name`,{headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`},signal:timeout(8000)});
    return {ok:r.ok,status:r.ok?'connected':'provider_error'};
  }catch{return {ok:false,status:'provider_unavailable'};}
}

export async function sendWhatsAppTemplate({to,template,language='en_US',components=[]}){
  if(!whatsappConfigured())return {ok:false,status:'failed',retryable:false,errorCode:'CONFIGURATION_ERROR'};
  const r=await fetch(`https://graph.facebook.com/${version()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:language},components}}),signal:timeout(12000)});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)return {ok:false,status:'failed',retryable:r.status===429||r.status>=500,errorCode:r.status===429?'PROVIDER_RATE_LIMIT':'MESSAGE_FAILED'};
  return {ok:true,status:'accepted',providerMessageId:body?.messages?.[0]?.id||null};
}

export function verifyWhatsAppSignature(rawBody,signature){
  const secret=process.env.WHATSAPP_APP_SECRET;
  if(!secret||!signature||!rawBody)return false;
  const expected=`sha256=${crypto.createHmac('sha256',secret).update(rawBody).digest('hex')}`;
  const a=Buffer.from(expected); const b=Buffer.from(String(signature));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
