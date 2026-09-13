import {classifySafety} from './safety';
import {classifyIntent} from './intent';
import {retrieveApprovedKnowledge} from './knowledge';
import {emergencyConfig} from './emergency-config';

const aliases={visitor:'visitor',public:'visitor',website:'visitor',discovery:'visitor',admissions_guidance:'visitor',client:'client',resident:'client',portal:'client',my_space:'client',recovery:'client',family:'family',family_portal:'family',staff:'staff',admin:'staff',clinician:'staff',counsellor:'staff'};
const normalizeContext=(v='visitor')=>aliases[String(v).toLowerCase()]||'visitor';

export const BOUNDARY={NONE:'NONE',LIGHT:'LIGHT_SCOPE_BOUNDARY',PROFESSIONAL:'PROFESSIONAL_ASSESSMENT_BOUNDARY',MEDICAL:'MEDICAL_BOUNDARY',EMERGENCY:'EMERGENCY_BOUNDARY',PRIVACY:'PRIVACY_BOUNDARY',TRANSACTION:'TRANSACTION_CONFIRMATION_BOUNDARY'};

export function shouldInjectBoundary({intent,riskLevel='STANDARD',requiresProfessionalJudgement=false}={}){
  if(riskLevel==='EMERGENCY'||intent==='CRISIS_OR_IMMEDIATE_DANGER') return BOUNDARY.EMERGENCY;
  if(intent==='DIAGNOSIS_REQUEST'||intent==='MEDICATION_OR_MEDICAL_REQUEST') return BOUNDARY.MEDICAL;
  if(intent==='CLINICAL_DECISION_REQUEST'||requiresProfessionalJudgement) return BOUNDARY.PROFESSIONAL;
  if(intent==='BOOKING_INTENT'||intent==='ACTION_REQUEST') return BOUNDARY.TRANSACTION;
  return BOUNDARY.NONE;
}

function greeting(context){
  if(context==='family') return "Hi 👋 I’m Grace. I can help you understand available support for someone you care about.\n\nWhat would feel most useful right now?";
  return "Hi 👋 I’m Grace. I’m here to help you understand the Centre, explore your options, find recovery resources, or take the next step when you’re ready.\n\nWhat would you like help with today?";
}
function quickActions(intent,context){
  if(intent==='GREETING') return context==='family'?['Understand support options','Speak to Admissions','Book a confidential assessment','Ask a question']:['Understand my options','Help for someone I care about','Book a confidential assessment','Ask a question'];
  if(intent==='ADMISSIONS_GUIDANCE'||intent==='FAMILY_SUPPORT') return ['Understand treatment options','Speak to Admissions','Book a confidential assessment','Visit the Centre'];
  if(intent==='BOOKING_INTENT') return ['Book a confidential assessment','Speak to Admissions'];
  return [];
}
function validateResponse({answer,intent,boundary,confirmedAction=false,sources=[]}){
  let text=String(answer||'').trim();
  const policyPhrases=(text.match(/\b(Grace (does not|is not|cannot)|professional assessment|qualified professional|emergency service)\b/gi)||[]).length;
  if(boundary===BOUNDARY.NONE&&policyPhrases>1){
    if(intent==='GREETING') text=greeting('visitor');
    else text=text.split(/(?<=[.!?])\s+/).filter(s=>!/Grace (does not|is not|cannot)|professional assessment|qualified professional|emergency service/i.test(s)).slice(0,5).join(' ');
  }
  if(!confirmedAction&&/\b(your appointment is confirmed|your booking is confirmed|i have booked|i booked)\b/i.test(text)) text='I can help with that. I’ll only confirm the appointment after the booking system successfully reserves it.';
  return {answer:text,sources:Array.isArray(sources)?sources:[]};
}

export function orchestrateGrace({message,context='visitor',confirmedAction=false}={}){
  const safeContext=normalizeContext(context);
  const safety=classifySafety(message);
  const routed=classifyIntent(message);
  const intent=routed.intent;
  const boundary=shouldInjectBoundary({intent,riskLevel:safety.level});
  const sources=retrieveApprovedKnowledge(message)||[];
  let answer='',state='GENERAL',confidence=routed.confidence>=.8?'high':'qualified',handoff=null,requiresHuman=false;

  if(boundary===BOUNDARY.EMERGENCY){answer=emergencyConfig.message;state='EMERGENCY';handoff='Emergency';requiresHuman=true;}
  else if(intent==='GREETING'){answer=greeting(safeContext);state='GENERAL';confidence='high';}
  else if(boundary===BOUNDARY.MEDICAL){
    answer=intent==='DIAGNOSIS_REQUEST'?"I can help you understand common signs and patterns, but I can’t diagnose you. A professional assessment is the right way to determine what support may be appropriate.\n\nIf you’d like, I can help you arrange one.":"I can explain general information about this, but medication, dosage and medical decisions need a qualified healthcare professional.\n\nI can help you find the right person at the Centre to speak with.";
    state='RESTRICTED';handoff='Clinical team';requiresHuman=true;
  } else if(boundary===BOUNDARY.PROFESSIONAL){answer="I can explain the different options and what each is designed for, but choosing the right programme should come from a professional assessment.\n\nIf you’d like, I can help you arrange a confidential assessment.";handoff='Admissions';requiresHuman=true;}
  else if(intent==='BOOKING_INTENT'){answer="I can help with that. Let’s use the Centre’s live booking process so the time is genuinely available before anything is confirmed.";handoff='Booking';}
  else if(intent==='ACTION_REQUEST'){answer="I can help with that. I’ll ask only for the information needed, and I’ll confirm the outcome only after GraceFlow reports that it succeeded.";handoff='GraceFlow';}
  else if(intent==='ADMISSIONS_GUIDANCE'){answer="You don’t need to know exactly where to begin. I can explain the options, what happens during admissions, or help you arrange a confidential conversation with the Centre.\n\nWhat would feel most useful right now?";handoff='Admissions';}
  else if(intent==='FAMILY_SUPPORT'){answer="I can help. Would it be most useful to understand treatment options, speak with admissions, or arrange a confidential assessment for the next step?";handoff='Family support';}
  else if(sources.length){answer=sources.map(s=>s.text).join(' ');state='VERIFIED';confidence=sources[0]?.score>=2?'high':'qualified';}
  else if(intent==='EMOTIONAL_SUPPORT'){answer="I’m here with you. We can keep this simple. Would you like to talk about what feels difficult right now, try a grounding exercise, or look at a practical next step?";}
  else if(intent==='MEDITATION_REFLECTION'){answer="We can reflect on the approved reading together. What part of it stood out to you?";}
  else if(intent==='PRAYER_REFLECTION'){answer="We can take this quietly, one step at a time. Would you like to recite, reflect, or use a non-religious reflection instead?";}
  else if(intent==='TREATMENT_INFORMATION'){answer="I can explain the Centre’s treatment options from approved information. If you’re trying to decide which option fits a particular person, I can also help arrange a professional assessment.";}
  else if(intent==='RECOVERY_EDUCATION'){answer="I can help you explore this using approved recovery information and practical coping resources. What part would you like to understand?";}
  else {answer="I can help with Centre information, admissions, recovery resources, family support, appointments, or finding the right next step. What would you like to explore?";state='UNKNOWN';confidence='low';}

  const checked=validateResponse({answer,intent,boundary,confirmedAction,sources});
  return {state,intent,intentConfidence:routed.confidence,answer:checked.answer,confidence,sources:checked.sources,handoff,requiresHuman,context:safeContext,safetyLevel:safety.level,boundary,boundaryInjected:boundary!==BOUNDARY.NONE,quickActions:quickActions(intent,safeContext),disclosure:{label:'Grace is an AI support and care-navigation assistant.',learnMore:true}};
}
