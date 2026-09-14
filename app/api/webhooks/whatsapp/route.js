import {NextResponse} from 'next/server';
import {dbAdminSelect,dbInsert,dbUpdate} from '@/lib/supabase-rest';
import {verifyWhatsAppSignature} from '@/lib/whatsapp-provider';

export async function GET(req){
  const u=new URL(req.url);
  const mode=u.searchParams.get('hub.mode');
  const token=u.searchParams.get('hub.verify_token');
  const challenge=u.searchParams.get('hub.challenge');
  if(mode==='subscribe'&&token&&token===process.env.WHATSAPP_VERIFY_TOKEN)return new NextResponse(challenge||'',{status:200});
  return NextResponse.json({error:'Webhook verification failed.'},{status:403});
}

export async function POST(req){
  const raw=await req.text();
  if(!verifyWhatsAppSignature(raw,req.headers.get('x-hub-signature-256')))return NextResponse.json({error:'Invalid signature.'},{status:401});
  let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid payload.'},{status:400});}
  const changes=body?.entry?.flatMap(e=>e.changes||[])||[];
  for(const change of changes){
    const value=change?.value||{};
    for(const status of value.statuses||[]){
      const id=status.id;if(!id)continue;
      await dbUpdate('whatsapp_messages',`provider_message_id=eq.${encodeURIComponent(id)}`,{status:status.status,updated_at:new Date().toISOString(),...(status.status==='delivered'?{delivered_at:new Date().toISOString()}:{}),...(status.status==='read'?{read_at:new Date().toISOString()}:{}),...(status.status==='failed'?{failed_at:new Date().toISOString(),failure_code:status?.errors?.[0]?.code?String(status.errors[0].code):null}:{})}).catch(()=>{});
    }
    for(const message of value.messages||[]){
      if(!message.id)continue;
      const existing=await dbAdminSelect('whatsapp_messages',`provider_message_id=eq.${encodeURIComponent(message.id)}&select=id&limit=1`).catch(()=>[]);
      if(existing?.length)continue;
      await dbInsert('whatsapp_messages',{provider_message_id:message.id,direction:'inbound',phone_number:message.from||null,message_type:message.type||'unknown',status:'received',received_at:new Date(Number(message.timestamp||Date.now()/1000)*1000).toISOString(),metadata:{has_text:Boolean(message?.text?.body)}}).catch(()=>{});
      await dbInsert('workflow_events',{event_type:'whatsapp_inbound_received',source_channel:'whatsapp',actor_type:'visitor',summary:'Inbound WhatsApp message received for governed routing',metadata:{provider_message_id:message.id,phone_number_masked:message.from?`***${String(message.from).slice(-4)}`:null}}).catch(()=>{});
    }
  }
  return NextResponse.json({ok:true});
}
