import {NextResponse} from 'next/server';
import {dbInsert} from '@/lib/supabase-rest';
import {buildWhatsAppUrl,getWhatsAppContextMessage,normalizeWhatsAppNumber,publicWhatsAppNumber} from '@/lib/whatsapp';

const clean=(v,n=500)=>String(v??'').trim().slice(0,n);

export async function POST(req){
  try{
    const body=await req.json();
    if(body?.consent!==true)return NextResponse.json({confirmed:false,requiresConfirmation:true,error:'Please confirm that you want to continue with the admissions team on WhatsApp.'},{status:409});
    const clientPhone=normalizeWhatsAppNumber(clean(body?.phone,40));
    const summaryConsent=body?.shareSummary===true;
    const summary=summaryConsent?clean(body?.summary,500):null;
    const conversation=(await dbInsert('whatsapp_conversations',{phone_number:clientPhone?`+${clientPhone}`:'unknown',state:'HANDOFF_REQUESTED',assigned_team:'admissions',last_message_at:new Date().toISOString()}))?.[0];
    if(conversation?.id){
      await dbInsert('audit_log',{action:'WHATSAPP_HANDOFF_CREATED',entity_type:'whatsapp_conversation',entity_id:conversation.id,after_state:{state:'HANDOFF_REQUESTED',assigned_team:'admissions',summary_shared:Boolean(summary)},reason:'User explicitly requested WhatsApp human handoff from Grace.'}).catch(()=>{});
    }
    const base=getWhatsAppContextMessage({intent:'grace_handoff'}).message;
    const message=summary?`${base}\n\nShort summary I approved sharing: ${summary}`:base;
    const url=buildWhatsAppUrl({phone:publicWhatsAppNumber(),message,source:'grace',context:'grace_handoff'});
    if(!url)return NextResponse.json({confirmed:false,error:'The Centre WhatsApp number is not configured yet.'},{status:503});
    return NextResponse.json({confirmed:true,handoffId:conversation?.id||null,url,messageIncluded:summary? 'approved_summary':'neutral_only'});
  }catch{return NextResponse.json({confirmed:false,error:'We could not prepare the WhatsApp handoff. Please use the Centre contact options instead.'},{status:503});}
}
