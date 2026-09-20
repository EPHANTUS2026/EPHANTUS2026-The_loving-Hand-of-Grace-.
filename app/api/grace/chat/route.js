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

export async function POST(req){try{
  const b=await req.json(),message=String(b?.message||'').trim();
  const session=await getSession().catch(()=>null);
  // Browser context is advisory only. Protected operating mode comes from the server session.
  const preflight=orchestrateGrace({message,context:'visitor'});
  const identity=buildGraceIdentityContext(session,{requestedMode:b?.mode,safetyLevel:preflight.safetyLevel});
  const safeContext=identity.mode==='CLIENT'||identity.mode==='AFTERCARE'?'client':identity.mode==='FAMILY'?'family':identity.mode==='STAFF'?'staff':'visitor';
  if(!message)return NextResponse.json({error:'Message is required.'},{status:400});
  if(message.length>4000)return NextResponse.json({error:'Message is too long.'},{status:400});
  if(isOfficialRecoveryLiteratureRequest(message))return NextResponse.json(officialRecoveryLiteratureResponse(),{headers:{'Cache-Control':'private, no-store'}});
  if(passportTopic(b)){const s=session;if(identity.mode==='CLIENT'&&s?.profile?.client_id){const p=await getRecoveryPassport(s);const base=orchestrateGrace({message,context:'client'});return NextResponse.json({...base,state:'VERIFIED',answer:passportAnswer(message,p),sources:[{id:'recovery-passport',title:'My Recovery Passport',type:'authenticated_client_projection'}],provenance:{knowledgeState:'VERIFIED_CLIENT_DATA',sourceCount:1,toolConfirmationState:'NONE'},disclosure:{label:'Grace is explaining verified, client-visible information from your Recovery Passport.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}})}}
  const base=orchestrateGrace({message,context:safeContext});
  const safety=safetyDisposition({safetyLevel:base.safetyLevel,providerAvailable:true});
  const empathy=emotionalIntelligence({signal:base.emotionalSignal,safetyLevel:base.safetyLevel,language:base.language});
  if(base.needsSources){
    const sources=await retrieveGovernedKnowledge(message,3);
    const evidenceState=assessEvidence({sources,authoritative:sources.some(s=>s.authority==='GOVERNED_DATABASE'),confidence:base.intentConfidence});
    const quality=qualityGate({answer:base.answer,evidenceState,claimType:['DIAGNOSIS_REQUEST','MEDICATION_OR_MEDICAL_REQUEST','CLINICAL_DECISION_REQUEST'].includes(base.intent)?'clinical':'centre',clinicalBoundary:base.boundary!=='NONE'});
    if(!sources.length)return NextResponse.json({...base,state:'UNKNOWN',evidenceState,quality,empathy,answer:'I don’t have enough approved Centre source material to verify that. I can help get confirmation from the team.',sources:[],provenance:{...base.provenance,knowledgeState:'UNKNOWN',sourceCount:0},disclosure:{label:'Grace could not find an approved Centre source for this answer.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}});
    return NextResponse.json({...base,state:'VERIFIED',evidenceState,quality,empathy,answer:sources.map(s=>s.text).join(' '),sources:sources.map(s=>({id:s.id,title:s.title,type:'governed_centre_knowledge',version:s.version,lastReviewedAt:s.updated,sourceReferences:s.sourceReferences})),provenance:{...base.provenance,knowledgeState:'GOVERNED_DATABASE',sourceCount:sources.length,sources:knowledgeProvenance(sources)},disclosure:{label:'Grace is answering from approved, in-review-date Centre knowledge.',learnMore:true}},{headers:{'Cache-Control':'private, no-store'}});
  }
  return NextResponse.json({...base,operatingMode:identity.mode,safetyDisposition:safety,empathy,evidenceState:assessEvidence({sources:[],confidence:base.intentConfidence}),quality:qualityGate({answer:base.answer,evidenceState:assessEvidence({sources:[],confidence:base.intentConfidence}),claimType:'support',clinicalBoundary:base.boundary!=='NONE'})},{headers:{'Cache-Control':'private, no-store'}});
}catch(error){console.error('Grace chat failed safely',{message:error?.message||'unknown'});return NextResponse.json({error:'Grace could not process that request safely.'},{status:500})}}
