import {enrichGraceResponse} from '@/lib/grace/chat-runtime';
import {NextResponse} from 'next/server';
import {orchestrateGrace} from '@/lib/grace/orchestrator';
import {retrieveGovernedKnowledge} from '@/lib/grace/knowledge';
import {getSession} from '@/lib/supabase-rest';
import {getRecoveryPassport} from '@/lib/recovery-passport/service';
import {isOfficialRecoveryLiteratureRequest,officialRecoveryLiteratureResponse} from '@/lib/recovery-resources';
import {buildGraceIdentityContext} from '@/lib/grace/authority';
import {knowledgeProvenance} from '@/lib/grace/context';
import {safetyDisposition} from '@/lib/grace/safety-protocol';
import {assessEvidence} from '@/lib/grace/truth-engine';
import {emotionalIntelligence} from '@/lib/grace/empathy';
import {qualityGate} from '@/lib/grace/response-quality';

const passportTopic=b=>String(b?.topic||'').toLowerCase()==='recovery-passport'||/my (recovery|aftercare|passport|milestone|goal|appointment|journey)/i.test(String(b?.message||''));
function passportAnswer(message,p){const m=message.toLowerCase();if(/stage|where.*journey|journey/.test(m))return p.currentStage?`Your verified Recovery Passport currently shows ${p.currentStage.label}. ${p.currentStage.description||''}`:'Your Recovery Passport does not yet show a verified current stage.';if(/milestone|progress/.test(m))return p.milestones?.length?`Your Passport shows ${p.milestones.length} client-approved milestone${p.milestones.length===1?'':'s'}. The most recent is “${p.milestones[0].title}”.`:'No client-approved milestones are showing in your Passport yet.';if(/goal/.test(m))return p.goals?.length?`Your Passport currently shows ${p.goals.length} client-visible goal${p.goals.length===1?'':'s'}, including “${p.goals[0].title}”.`:'No client-visible goals are showing in your Passport yet.';if(/appointment|next/.test(m))return p.appointments?.length?`Your Passport shows ${p.appointments.length} client-visible upcoming appointment${p.appointments.length===1?'':'s'}. The next recorded item is “${p.appointments[0].title||p.appointments[0].appointment_type}”.`:'No client-visible upcoming appointment is showing in your Passport.';return p.currentStage?`I can explain your verified Passport information. Your current recorded stage is ${p.currentStage.label}. I can also explain your client-visible milestones, goals, appointments, documents, or aftercare status.`:'I can explain your Recovery Passport, but I do not have a verified current stage to quote yet.';}

async function legacyResponse(req){try{
  const b=await req.json(),message=String(b?.message||'').trim();
  const urgent=orchestrateGrace({message,context:'visitor'});
  if(urgent.safetyLevel==='EMERGENCY')return NextResponse.json(urgent,{headers:{'Cache-Control':'private, no-store'}});
  const session=await getSession().catch(()=>null);
  // Browser context is advisory only. Protected operating mode comes from the server session.
  const preflight=orchestrateGrace({message,context:'visitor'});
  const identity=buildGraceIdentityContext(session,{requestedMode:b?.mode,safetyLevel:preflight.safetyLevel});
  const safeContext=identity.mode==='CLIENT'||identity.mode==='AFTERCARE'?'client':identity.mode==='FAMILY'?'family':identity.mode==='STAFF'?'staff':'visitor';
  if(!message)return NextResponse.json({error:'Message is required.'},{status:400});
  if(message.length>4000)return NextResponse.json({error:'Message is too long.'},{status:400});
  if(preflight.safetyLevel==='EMERGENCY')return NextResponse.json(preflight,{headers:{'Cache-Control':'private, no-store'}});
  if(isOfficialRecoveryLiteratureRequest(message))return NextResponse.json(officialRecoveryLiteratureResponse(),{headers:{'Cache-Control':'private, no-store'}});
  if(passportTopic(b)){const s=session;if(identity.mode==='CLIENT'&&s?.profile?.client_id){const p=await getRecoveryPassport(s);const base=orchestrateGrace({message,context:'client'});return NextResponse.json({...base,state:'VERIFIED',answer:passportAnswer(message,p),sources:[{id:'recovery-passport',title:'My Recovery Passport',type:'authenticated_client_projection'}],provenance:{knowledgeState:'VERIFIED_CLIENT_DATA',sourceCount:1,toolConfirmationState:'NONE'},disclosure:{label:'Grace is explaining verified, client-visible information from your Recovery Passport.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}})}}
  const base=orchestrateGrace({message,context:safeContext});
  const safety=safetyDisposition({safetyLevel:base.safetyLevel,providerAvailable:true});
  const empathy=emotionalIntelligence({signal:base.emotionalSignal,safetyLevel:base.safetyLevel,language:base.language});
  if(base.needsSources){
    const sources=await retrieveGovernedKnowledge(message,3);
    const evidenceState=assessEvidence({sources,authoritative:sources.some(s=>s.authority==='GOVERNED_DATABASE'),confidence:base.intentConfidence});
    const quality=qualityGate({answer:sources.map(s=>s.text).join(' '),evidenceState,claimType:['DIAGNOSIS_REQUEST','MEDICATION_OR_MEDICAL_REQUEST','CLINICAL_DECISION_REQUEST'].includes(base.intent)?'clinical':'centre',clinicalBoundary:base.boundary!=='NONE'});
    if(!sources.length || quality.result!=='PASS')return NextResponse.json({...base,state:'UNKNOWN',evidenceState,quality,empathy,answer:'I don’t have enough approved Centre source material to verify that. I can help get confirmation from the team.',sources:[],provenance:{...base.provenance,knowledgeState:'UNKNOWN',sourceCount:0},disclosure:{label:'Grace could not find an approved Centre source for this answer.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}});
    return NextResponse.json({...base,state:'VERIFIED',evidenceState,quality,empathy,answer:sources.map(s=>s.text).join(' '),sources:sources.map(s=>({id:s.id,title:s.title,type:'governed_centre_knowledge',version:s.version,lastReviewedAt:s.updated,sourceReferences:s.sourceReferences})),provenance:{...base.provenance,knowledgeState:'GOVERNED_DATABASE',sourceCount:sources.length,sources:knowledgeProvenance(sources)},disclosure:{label:'Grace is answering from approved, in-review-date Centre knowledge.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}});
  }
  return NextResponse.json({...base,operatingMode:identity.mode,safetyDisposition:safety,empathy,evidenceState:assessEvidence({sources:[],confidence:base.intentConfidence}),quality:qualityGate({answer:base.answer,evidenceState:assessEvidence({sources:[],confidence:base.intentConfidence}),claimType:'support',clinicalBoundary:base.boundary!=='NONE'})},{headers:{'Cache-Control':'private, no-store'}});
}catch(error){console.error('Grace chat failed safely');return NextResponse.json({error:'Grace could not process that request safely.'},{status:500})}}

export async function POST(req) {
  if (req.headers.get('origin') !== new URL(req.url).origin)
    return NextResponse.json({error:'Invalid request origin.'},{status:403});
  let body;
  try {
    const reader=req.body.getReader(); const parts=[]; let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>72000){await reader.cancel();return NextResponse.json({error:'Request too large.'},{status:413});}parts.push(value);}
    body=JSON.parse(Buffer.concat(parts).toString());
    if(!body || typeof body.message!=='string' || !body.message.trim() || body.message.length>4000 ||
      Object.keys(body).some(k=>!['message','context','topic','mode','conversationToken','modelConsent'].includes(k)))
      return NextResponse.json({error:'Invalid message.'},{status:400});
  } catch { return NextResponse.json({error:'Invalid request.'},{status:400}); }
  const baseResponse=await legacyResponse({json:async()=>body});
  if(!baseResponse.ok)return baseResponse;
  const base=await baseResponse.json();
  if(base.safetyLevel==='EMERGENCY')return NextResponse.json(base,{headers:{'Cache-Control':'private, no-store'}});
  try {
    const result=await enrichGraceResponse(req,body,base);
    const response=NextResponse.json(result.body,{status:result.status,headers:{'Cache-Control':'private, no-store'}});
    if(result.browserId) response.cookies.set('lhg_grace_browser',result.browserId,{
      httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:1800,
    });
    return response;
  } catch { return NextResponse.json({...base,responseMode:'rules',providerStatus:'unavailable'},{headers:{'Cache-Control':'private, no-store'}}); }
}
