import {NextResponse} from 'next/server';
import {createGraceFlowAction,listGraceActions} from '@/lib/grace/actions';
import {classifyIntent} from '@/lib/grace/intent';

const allowed=new Set(listGraceActions());
const clean=(v,n=240)=>String(v??'').trim().slice(0,n);

export async function POST(req){
  try{
    const body=await req.json();
    const action=clean(body?.action,80);
    if(!allowed.has(action)) return NextResponse.json({confirmed:false,error:'Unsupported action.'},{status:400});
    if(body?.consent!==true) return NextResponse.json({confirmed:false,requiresConfirmation:true,error:'Explicit confirmation is required.'},{status:409});
    const phone=clean(body?.phone,40),email=clean(body?.email,160);
    if(!phone&&!email) return NextResponse.json({confirmed:false,error:'A phone number or email address is required.'},{status:400});
    const safety=classifyIntent(clean(body?.message||body?.note,1000));
    if(['CRISIS_OR_IMMEDIATE_DANGER','MEDICATION_OR_MEDICAL_REQUEST','DIAGNOSIS_REQUEST'].includes(safety.primary_intent)){
      return NextResponse.json({confirmed:false,error:'This request needs appropriate human or emergency support rather than routine automation.'},{status:409});
    }
    const result=await createGraceFlowAction({action,consent:true,name:clean(body?.name,120),phone,email,note:clean(body?.note,500),context:clean(body?.context,80)||'visitor'});
    return NextResponse.json(result,{status:result?.confirmed?201:503});
  }catch(error){
    return NextResponse.json({confirmed:false,error:'The system could not confirm that request. Please try again or contact the Centre.'},{status:503});
  }
}
