const RULES=[
  ['CRISIS_OR_IMMEDIATE_DANGER',/suicid|kill myself|end my life|self[- ]?harm|overdose|unconscious|not breathing|seizure|immediate danger|hurt someone|harm someone/i],
  ['MEDICATION_OR_MEDICAL_REQUEST',/medication|medicine|dose|dosage|detox at home|prescrib|withdrawal medication/i],
  ['DIAGNOSIS_REQUEST',/diagnos|am i (an alcoholic|addicted)|do i have (addiction|depression|anxiety|bipolar)/i],
  ['CLINICAL_DECISION_REQUEST',/which (programme|program|treatment).*for me|what treatment do i need|best programme for me|should i be admitted/i],
  ['BOOKING_INTENT',/book|appointment|schedule|available time|available slot|assessment on|see someone on/i],
  ['ACTION_REQUEST',/call me|callback|request a call|save this|send this|contact me/i],
  ['ADMISSIONS_GUIDANCE',/admission|admit|where do (i|we) start|initial assessment|how do i get help|next step/i],
  ['FAMILY_SUPPORT',/my (brother|sister|son|daughter|husband|wife|partner|child|parent)|family|loved one|someone i care about/i],
  ['PRAYER_REFLECTION',/serenity prayer|pray|prayer/i],
  ['MEDITATION_REFLECTION',/meditation|today'?s reading|reflect on.*reading/i],
  ['TREATMENT_INFORMATION',/programme|program|residential|outpatient|treatment option|what treatment|services do you offer/i],
  ['RECOVERY_EDUCATION',/relapse|trigger|craving|recovery|addiction|coping/i],
  ['CENTRE_INFORMATION',/centre|center|location|where are you|opening hours|visiting hours/i],
  ['ACCOUNT_OR_SITE_NAVIGATION',/login|account|my space|portal|website|find.*page|navigate/i],
  ['EMOTIONAL_SUPPORT',/i feel|i'?m feeling|overwhelmed|scared|anxious|worried|ashamed|hopeless/i],
  ['GENERAL_INFORMATION',/what is|how does|tell me about|explain/i],
];

export function classifyIntent(message=''){
  const t=String(message||'').trim();
  if(!t) return {intent:'UNKNOWN',confidence:0};
  if(/^(hi|hello|hey|good (morning|afternoon|evening)|hiya|hey grace|hi grace)[!. ]*$/i.test(t)) return {intent:'GREETING',confidence:0.99};
  for(const [intent,pattern] of RULES){if(pattern.test(t)) return {intent,confidence:0.9};}
  return {intent:'UNKNOWN',confidence:0.45};
}
