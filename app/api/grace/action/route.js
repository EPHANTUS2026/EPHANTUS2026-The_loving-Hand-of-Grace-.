import {NextResponse} from 'next/server';
import {createGraceFlowAction,listGraceActions} from '@/lib/grace/actions';
import {classifyIntent} from '@/lib/grace/intent';
import {getSession} from '@/lib/supabase-rest';
import {buildGraceIdentityContext} from '@/lib/grace/authority';
import {authorizeGraceAction} from '@/lib/grace/action-gateway';

const allowed=new Set(listGraceActions());
const clean=(v,n=240)=>String(v??'').trim().slice(0,n);

export async function POST(req){
  if(req.headers.get('origin')!==new URL(req.url).origin) return NextResponse.json({error:'Invalid origin.'},{status:403});
  try{
    const reader=req.body.getReader();const parts=[];let bytes=0;
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
      if(bytes>4096){await reader.cancel();return NextResponse.json({error:'Request too large.'},{status:413});}parts.push(value);}
    const body=JSON.parse(Buffer.concat(parts).toString());
    if(!body||typeof body!=='object'||Array.isArray(body)||
      Object.keys(body).some(k=>!['action','consent','phone','email','name','note','message','mode','idempotencyKey'].includes(k)))
      return NextResponse.json({error:'Invalid request.'},{status:400});
    const session=await getSession().catch(()=>null);
    const identity=buildGraceIdentityContext(session,{requestedMode:body?.mode});
    const action=clean(body?.action,80);
    if(!allowed.has(action)) return NextResponse.json({confirmed:false,error:'Unsupported action.'},{status:400});
    if(body?.consent!==true) return NextResponse.json({confirmed:false,requiresConfirmation:true,error:'Explicit confirmation is required.'},{status:409});
    const phone=clean(body?.phone,40),email=clean(body?.email,160);
    if((phone&&!/^\+?[0-9 ()-]{7,40}$/.test(phone))||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return NextResponse.json({confirmed:false,error:'Check your contact details.'},{status:400});
    if(!phone&&!email) return NextResponse.json({confirmed:false,error:'A phone number or email address is required.'},{status:400});
    const safety=classifyIntent(clean(body?.message||body?.note,1000));
    const gateway=authorizeGraceAction({identity,action,consent:true,intent:safety.primary_intent,idempotencyKey:clean(body?.idempotencyKey,128)});
    if(['CRISIS_OR_IMMEDIATE_DANGER','MEDICATION_OR_MEDICAL_REQUEST','DIAGNOSIS_REQUEST'].includes(safety.primary_intent)){
      return NextResponse.json({confirmed:false,error:'This request needs appropriate human or emergency support rather than routine automation.'},{status:409});
    }
    const result=await createGraceFlowAction({action,consent:true,name:clean(body?.name,120),phone,email,note:clean(body?.note,500),context:identity.mode.toLowerCase(),actor:gateway.actor,idempotencyKey:gateway.idempotencyKey,commandId:gateway.commandId});
    return NextResponse.json(result,{status:result?.confirmed?201:503});
  }catch(error){
    return NextResponse.json({confirmed:false,error:'The system could not confirm that request. Please try again or contact the Centre.'},{status:503});
  }
}
