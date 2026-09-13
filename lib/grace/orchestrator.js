import { classifySafety } from './safety';
import { classifyIntent } from './intent';
import { retrieveApprovedKnowledge } from './knowledge';
import { emergencyConfig } from './emergency-config';
import { GRACE_MODES, PERMANENT_RULE, VOICE_TEST } from './constitution';

const generalEducation = {
  education: 'General information: cravings and triggers can change over time. Helpful coping strategies can include delaying action, changing environment, contacting a trusted support person, using grounding or breathing techniques, and following the recovery plan agreed with your care team. If symptoms feel severe or medically concerning, contact a qualified professional.',
  family_support: 'General guidance: choose a calm time, speak respectfully, focus on observable concerns rather than labels, listen without arguing, and offer practical help to contact a qualified service. A professional can help the family decide the safest next step.',
};

const contextAliases = {
  visitor:'visitor', public:'visitor', website:'visitor', discovery:'visitor',
  client:'client', resident:'client', portal:'client', my_space:'client', recovery:'client',
  family:'family', family_portal:'family',
  staff:'staff', admin:'staff', admissions:'staff', clinician:'staff', counsellor:'staff',
};

function normalizeContext(context='visitor'){
  return contextAliases[String(context||'visitor').toLowerCase()] || 'visitor';
}

function selectMode({safety,intent,context}){
  if(safety.level==='EMERGENCY' || safety.level==='RESTRICTED') return 'SAFETY_ESCALATION';
  if(intent==='family_support' || context==='family') return 'FAMILY_SUPPORT';
  if(context==='client' || intent==='education') return 'RECOVERY_SUPPORT';
  if(['billing','appointment','privacy'].includes(intent)) return 'ADMINISTRATIVE_NAVIGATION';
  return 'WELCOME_DISCOVERY';
}

function modePolicy(mode){
  const policies = {
    WELCOME_DISCOVERY: {
      tone:'calm, welcoming, plain-language and non-judgmental',
      objective:'help the person understand options and reach an appropriate next step without making clinical decisions',
      escalation:'offer admissions or staff contact when the user needs centre-specific confirmation or professional assessment',
    },
    RECOVERY_SUPPORT: {
      tone:'steady, respectful, encouraging and realistic',
      objective:'support approved recovery education, coping resources and navigation of My Space or the Recovery Passport',
      escalation:'encourage the user to involve their care team when symptoms, risk, treatment decisions or personalised clinical judgement are involved',
    },
    FAMILY_SUPPORT: {
      tone:'compassionate, neutral and privacy-conscious',
      objective:'support the family without blaming, diagnosing or disclosing client-specific information without permission',
      escalation:'route consent-sensitive, safeguarding or client-specific matters to authorised staff',
    },
    ADMINISTRATIVE_NAVIGATION: {
      tone:'clear, concise, practical and transparent',
      objective:'help complete non-clinical service navigation using verified information and GraceFlow where available',
      escalation:'hand off when information is unverified, requires staff approval or involves protected records',
    },
    SAFETY_ESCALATION: {
      tone:'calm, direct, brief and safety-first',
      objective:'prioritise immediate safety without attempting diagnosis, psychotherapy or medication advice',
      escalation:'encourage appropriate urgent human or emergency assistance and trained-staff handoff whenever possible',
    },
  };
  return policies[mode];
}

function institutionalFallback(intent, mode){
  if(intent==='billing') return 'I don’t have enough verified information here to state current fees or payment terms. I can help you contact the Centre or billing team to confirm.';
  if(intent==='programmes') return 'I can explain programmes only from approved Centre information. I don’t have enough verified programme detail in this knowledge set to answer that reliably, so I can help you contact the Centre to confirm.';
  if(intent==='privacy') return 'I can explain general privacy principles, but I should not reveal or request protected information unless it is necessary and authorised. I can help you reach the appropriate staff member for a records or privacy request.';
  if(mode==='RECOVERY_SUPPORT') return 'I want to be useful without guessing. I don’t have enough approved information to answer that reliably, so the safest next step is to check with your care team or an authorised staff member.';
  if(mode==='FAMILY_SUPPORT') return 'I don’t have enough verified information to answer that reliably, and I won’t guess about someone else’s care. I can help you find the right team to speak with.';
  return 'I don’t have enough verified Centre information to answer that reliably. I can help you find the right human team to confirm.';
}

function responseEnvelope({state,intent,answer,confidence,sources=[],handoff=null,requiresHuman=false,context,mode,safety}){
  return {
    state,
    intent,
    mode,
    modeLabel: GRACE_MODES[mode]?.label || mode,
    answer,
    confidence,
    sources,
    handoff,
    requiresHuman,
    context,
    safetyLevel:safety.level,
    policy:modePolicy(mode),
    guardrails:{permanentRule:PERMANENT_RULE,voiceTest:VOICE_TEST},
  };
}

export function orchestrateGrace({message, context='visitor'}={}) {
  const safeContext=normalizeContext(context);
  const safety=classifySafety(message);
  const intent=classifyIntent(message);
  const mode=selectMode({safety,intent,context:safeContext});
  const sources=retrieveApprovedKnowledge(message);

  if(safety.level==='EMERGENCY') return responseEnvelope({
    state:'EMERGENCY', intent, mode, answer:emergencyConfig.message,
    confidence:'high', sources:[], handoff:'Emergency', requiresHuman:true,
    context:safeContext, safety,
  });

  if(safety.level==='RESTRICTED') return responseEnvelope({
    state:'RESTRICTED', intent, mode,
    answer:'I can provide general information, but I can’t diagnose, prescribe, change medication, determine dosage or make a clinical decision. A qualified healthcare professional should assess this safely. If there may be immediate danger, seek urgent in-person help now.',
    confidence:'high', sources:[], handoff:'Clinical question', requiresHuman:true,
    context:safeContext, safety,
  });

  let answer=''; let state='GENERAL'; let confidence='qualified'; let handoff=null; let requiresHuman=false;

  if(sources.length){
    state='VERIFIED';
    confidence=sources[0].score>=2?'high':'qualified';
    answer=sources.map(s=>s.text).join(' ');
  } else if(generalEducation[intent]) {
    answer=generalEducation[intent];
  } else if(intent==='admissions') {
    state='VERIFIED'; confidence='high';
    answer='I can help you take the first step. The Centre’s process begins with an enquiry, followed by screening and a professional assessment. I can help you prepare questions or request contact from admissions. I won’t decide that someone needs residential or outpatient treatment—that decision belongs to qualified professionals after assessment.';
  } else if(intent==='appointment') {
    answer='I can help coordinate an appointment or callback, but I will ask for your confirmation before sending personal information or creating a request.';
    handoff='Appointments';
  } else {
    answer=institutionalFallback(intent,mode);
    state='UNKNOWN'; confidence='low';
    requiresHuman=true;
    handoff=mode==='RECOVERY_SUPPORT'?'Care team':mode==='FAMILY_SUPPORT'?'Family support team':'Centre team';
  }

  return responseEnvelope({
    state,intent,mode,answer,confidence,sources,handoff,requiresHuman,
    context:safeContext,safety,
  });
}
