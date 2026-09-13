const timeout=(ms)=>AbortSignal.timeout?AbortSignal.timeout(ms):undefined;
const result=(provider,ok,status,extra={})=>({ok,provider,status,retryable:false,errorCode:null,errorMessage:null,...extra});

function envMode(){return process.env.NOTIFICATIONS_MODE||'disabled'}

const resend={
  provider:'resend',channel:'email',
  configured(){return Boolean(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL)},
  async healthCheck(){
    if(!this.configured()) return result(this.provider,false,'CONFIGURED',{configured:false,errorCode:'missing_configuration',errorMessage:'Resend configuration is incomplete.'});
    try{const r=await fetch('https://api.resend.com/domains',{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},signal:timeout(8000)});if(!r.ok)return result(this.provider,false,'ERROR',{configured:true,errorCode:`http_${r.status}`,errorMessage:'Provider authentication or sender verification failed.'});return result(this.provider,true,'ENABLED',{configured:true});}catch{return result(this.provider,false,'DEGRADED',{configured:true,retryable:true,errorCode:'provider_unavailable',errorMessage:'Provider health check could not be completed.'});}
  },
  async send({to,subject,text,html}){
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:`${process.env.RESEND_FROM_NAME||'The Loving Hand of Grace'} <${process.env.RESEND_FROM_EMAIL}>`,to:[to],subject,text,html}),signal:timeout(12000)});
    const b=await r.json().catch(()=>({}));if(!r.ok)return result(this.provider,false,'failed',{retryable:r.status===429||r.status>=500,errorCode:`http_${r.status}`,errorMessage:'Email provider rejected the message.'});return result(this.provider,true,'accepted',{providerReference:b.id||null});
  }
};

const africastalking={
  provider:'africastalking',channel:'sms',
  configured(){return Boolean(process.env.AT_USERNAME&&process.env.AT_API_KEY)},
  async healthCheck(){if(!this.configured())return result(this.provider,false,'CONFIGURED',{configured:false,errorCode:'missing_configuration',errorMessage:"Africa's Talking configuration is incomplete."});return result(this.provider,true,'ENABLED',{configured:true});},
  async send({to,text}){const body=new URLSearchParams({username:process.env.AT_USERNAME,to,message:text});if(process.env.AT_SENDER_ID)body.set('from',process.env.AT_SENDER_ID);const r=await fetch('https://api.africastalking.com/version1/messaging',{method:'POST',headers:{apiKey:process.env.AT_API_KEY,'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body,signal:timeout(12000)});const b=await r.json().catch(()=>({}));if(!r.ok)return result(this.provider,false,'failed',{retryable:r.status===429||r.status>=500,errorCode:`http_${r.status}`,errorMessage:'SMS provider rejected the message.'});const ref=b?.SMSMessageData?.Recipients?.[0]?.messageId||null;return result(this.provider,true,'accepted',{providerReference:ref});}
};

const meta={
  provider:'meta_whatsapp',channel:'whatsapp',
  configured(){return Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_BUSINESS_ACCOUNT_ID)},
  async healthCheck(){if(!this.configured())return result(this.provider,false,'CONFIGURED',{configured:false,errorCode:'missing_configuration',errorMessage:'WhatsApp Cloud API configuration is incomplete.'});try{const version=process.env.WHATSAPP_API_VERSION||'v22.0';const r=await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name`,{headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`},signal:timeout(8000)});if(!r.ok)return result(this.provider,false,'ERROR',{configured:true,errorCode:`http_${r.status}`,errorMessage:'WhatsApp provider verification failed.'});return result(this.provider,true,'ENABLED',{configured:true});}catch{return result(this.provider,false,'DEGRADED',{configured:true,retryable:true,errorCode:'provider_unavailable',errorMessage:'WhatsApp provider health check could not be completed.'});}},
  async send({to,template,language='en_US',components=[]}){const version=process.env.WHATSAPP_API_VERSION||'v22.0';const r=await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:language},components}}),signal:timeout(12000)});const b=await r.json().catch(()=>({}));if(!r.ok)return result(this.provider,false,'failed',{retryable:r.status===429||r.status>=500,errorCode:`http_${r.status}`,errorMessage:'WhatsApp provider rejected the message.'});return result(this.provider,true,'accepted',{providerReference:b?.messages?.[0]?.id||null});}
};

export const CONNECTORS={email:resend,sms:africastalking,whatsapp:meta};
export const connectorFor=(channel)=>CONNECTORS[String(channel||'').toLowerCase()]||null;
export const notificationsMode=envMode;
