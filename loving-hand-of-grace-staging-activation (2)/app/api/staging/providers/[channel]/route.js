import {NextResponse} from 'next/server';
import {recordSystemEvent,requestId} from '@/lib/observability';

const allowed=new Set(['email','sms','whatsapp']);
function maskRecipient(value=''){
 const v=String(value);
 if(v.includes('@')){const [u,d]=v.split('@');return `${u.slice(0,2)}***@${d}`}
 return v.length>6?`${v.slice(0,4)}***${v.slice(-3)}`:'***';
}
export async function POST(req,{params}){
 if(process.env.APP_ENV!=='staging')return NextResponse.json({error:'Not available outside staging.'},{status:404});
 if(!allowed.has(params.channel))return NextResponse.json({error:'Unsupported channel.'},{status:400});
 const auth=req.headers.get('authorization')||'';
 if(!process.env.STAGING_PROVIDER_TOKEN||auth!==`Bearer ${process.env.STAGING_PROVIDER_TOKEN}`)return NextResponse.json({error:'Forbidden'},{status:403});
 const body=await req.json().catch(()=>({}));
 const payload=body?.payload||{};const id=`stg_${params.channel}_${Date.now()}`;
 await recordSystemEvent({eventType:`staging.provider.${params.channel}`,component:'communications',message:`Synthetic ${params.channel} delivery accepted by staging capture provider`,metadata:{provider_reference:id,recipient:maskRecipient(payload.recipient),templateKey:payload.templateKey||null,action:body.action||'send',synthetic:true},requestId:requestId(req)});
 return NextResponse.json({id,status:'accepted',channel:params.channel,synthetic:true});
}
