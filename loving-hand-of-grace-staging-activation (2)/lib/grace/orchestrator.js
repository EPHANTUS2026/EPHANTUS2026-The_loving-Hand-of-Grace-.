import { classifySafety } from './safety';
import { classifyIntent } from './intent';
import { retrieveApprovedKnowledge } from './knowledge';
import { emergencyConfig } from './emergency-config';

const generalEducation = {
  education: 'General information: cravings and triggers can change over time. Helpful coping strategies can include delaying action, changing environment, contacting a trusted support person, using grounding or breathing techniques, and following the recovery plan agreed with your care team. If symptoms feel severe or medically concerning, contact a qualified professional.',
  family_support: 'General guidance: choose a calm time, speak respectfully, focus on observable concerns rather than labels, listen without arguing, and offer practical help to contact a qualified service. A professional can help the family decide the safest next step.',
};

function institutionalFallback(intent){
  if(intent==='billing') return 'I don’t have enough verified information here to state current fees or payment terms. I can help you contact the Centre or billing team to confirm.';
  if(intent==='programmes') return 'I can explain programmes only from approved Centre information. I don’t have enough verified programme detail in this knowledge set to answer that reliably, so I can help you contact the Centre to confirm.';
  return 'I don’t have enough verified Centre information to answer that reliably. I can help you find the right human team to confirm.';
}

export function orchestrateGrace({message, context='visitor'}={}) {
  const safety=classifySafety(message);
  const intent=classifyIntent(message);
  const sources=retrieveApprovedKnowledge(message);

  if(safety.level==='EMERGENCY') return {
    state:'EMERGENCY', intent, answer: emergencyConfig.message,
    confidence:'high', sources:[], handoff:'Emergency', requiresHuman:true,
  };
  if(safety.level==='RESTRICTED') return {
    state:'RESTRICTED', intent,
    answer:'I can provide general information, but I can’t diagnose, prescribe, change medication, determine dosage or make a clinical decision. Please speak with a qualified healthcare professional who can assess the situation safely. If there may be immediate danger, seek urgent in-person help now.',
    confidence:'high', sources:[], handoff:'Clinical question', requiresHuman:true,
  };

  let answer=''; let state='GENERAL'; let confidence='qualified';
  if(sources.length){
    state='VERIFIED'; confidence=sources[0].score>=2?'high':'qualified';
    answer=sources.map(s=>s.text).join(' ');
  } else if(generalEducation[intent]) {
    state='GENERAL'; confidence='qualified'; answer=generalEducation[intent];
  } else if(intent==='admissions') {
    state='VERIFIED'; confidence='high';
    answer='I can help you take the first step. The Centre’s process begins with an enquiry, followed by screening and a professional assessment. I can help you prepare questions or request contact from admissions. I won’t decide that someone needs residential or outpatient treatment—that decision belongs to qualified professionals after assessment.';
  } else if(intent==='appointment') {
    state='GENERAL'; confidence='qualified';
    answer='I can help coordinate an appointment or callback, but I will ask for your confirmation before sending personal information or creating a request.';
  } else {
    answer=institutionalFallback(intent);
    state='UNKNOWN'; confidence='low';
  }

  return { state, intent, answer, confidence, sources, handoff:null, requiresHuman:false, context };
}
