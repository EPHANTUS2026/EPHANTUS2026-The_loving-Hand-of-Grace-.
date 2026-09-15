const INTENTS={
  GREETING:[/\b(hi|hello|hey|hiya|good morning|good afternoon|good evening)\b/i,/\b(habari|hujambo|salama)\b/i],
  SMALL_TALK:[/\b(thanks|thank you|asante|okay|ok|sawa|hmm|hmmm)\b/i],
  EMOTIONAL_SUPPORT:[/\b(i am|i'm|im|am|feeling|feel)\s+(sad|low|down|scared|afraid|anxious|worried|overwhelmed|alone|lonely|ashamed|hopeless|confused)\b/i,/\b(today is difficult|having a hard time|don't know what to do|do not know what to do|i don'?t know|i do not know)\b/i,/\b(nina huzuni|ninaogopa|nimelemewa|najisikia mpweke|sijui nifanye nini)\b/i],
  GENERAL_SUPPORT:[/\b(help me|i need help|can you help|msaada|nisaidie)\b/i],
  CENTRE_INFORMATION:[/\b(centre|center|loving hand|location|where are you|opening hours|visiting hours|address|contact details)\b/i,/\b(mko wapi|saa za kufungua|anwani)\b/i],
  PROGRAMME_INFORMATION:[/\b(programmes?|programs?|residential|outpatient|treatment options?|services do you offer|what do you offer)\b/i,/\b(programu|huduma mnazotoa|matibabu gani)\b/i],
  ADMISSIONS_GUIDANCE:[/\b(admission|admissions|admit|where do (i|we) start|initial assessment|how do i get help|next step|what happens next)\b/i,/\b(kujiunga|kulazwa|nitaanzaje|hatua inayofuata)\b/i],
  BOOKING_INTENT:[/\b(book|booking|appointment|schedule|available time|available slot|assessment on|see someone on|reserve)\b/i,/\b(weka appointment|nataka appointment|nataka kuweka appointment|nafasi ya appointment)\b/i],
  CALLBACK_INTENT:[/\b(call me|callback|call back|request a call|phone me|nipigie simu|nipigieni simu)\b/i],
  FAMILY_SUPPORT:[/\b(my|for my)\s+(brother|sister|son|daughter|husband|wife|partner|child|mother|father|parent)\b/i,/\b(family|loved one|someone i care about|caregiver)\b/i,/\b(mwanangu|ndugu yangu|mume wangu|mke wangu|familia yangu)\b/i],
  RECOVERY_EDUCATION:[/\b(relapse|trigger|craving|recovery|addiction|coping|withdrawal|sobriety)\b/i,/\b(kupona|kurudia matumizi|hamu ya kutumia|uraibu)\b/i],
  MEDITATION_REQUEST:[/\b(meditation|meditate|today'?s meditation|today'?s reading|reflection)\b/i,/\b(tafakari|meditesheni)\b/i],
  PRAYER_REQUEST:[/\b(prayer|pray|serenity prayer|recite.*prayer)\b/i,/\b(sala|tuombe|omba nami)\b/i],
  RECOVERY_JOURNEY:[/\b(recovery journey|recovery passport|aftercare|reintegration|discharge plan)\b/i,/\b(safari ya kupona|baada ya matibabu|kurudi jamii)\b/i],
  WEBSITE_NAVIGATION:[/\b(login|account|my space|portal|website|find.*page|navigate|where can i find)\b/i,/\b(ukurasa|ingia kwenye akaunti|tovuti)\b/i],
  RESOURCE_DISCOVERY:[/\b(resource|article|guide|reading|something to read|show me.*resource)\b/i,/\b(nionyeshe makala|rasilimali|mwongozo)\b/i],
  DOCUMENT_OR_POLICY_LOOKUP:[/\b(policy|procedure|requirements|rules|document|privacy notice|visiting policy)\b/i,/\b(sera|utaratibu|masharti)\b/i],
  ACTION_REQUEST:[/\b(save this|send this|create|submit|contact .*team|route me|open this)\b/i,/\b(hifadhi|tuma|fungua)\b/i],
  HUMAN_HANDOFF_REQUEST:[/\b(speak to someone|talk to a person|human|staff member|admissions team|counsellor|clinician|nurse|doctor)\b/i,/\b(ongea na mtu|nataka mtu|mfanyakazi|mshauri)\b/i],
  CLINICAL_DECISION_REQUEST:[/\b(which|what)\s+(programme|program|treatment)\s+(does|do|should|would|is|might|could)?\s*.*\b(need|needs|best|right|suitable|appropriate|for me|for him|for her)\b/i,/\b(should .* be admitted|do i need residential|does .* need treatment)\b/i,/\b(ni programu gani.*inafaa|matibabu gani.*nahitaji)\b/i],
  DIAGNOSIS_REQUEST:[/\bdiagnos(?:e|is|ed|ing|tic)?\b/i,/\b(am i|could i be|do i have|does .* have)\s+(an?\s+)?(alcoholic|addict(?:ed)?|addiction|depression|anxiety|bipolar)\b/i,/\b(je nina uraibu|nitambue ugonjwa)\b/i],
  MEDICATION_OR_MEDICAL_REQUEST:[/\b(medication|medicine|dose|dosage|prescrib|detox at home|withdrawal medication|should i stop.*medicine|should i start.*medicine)\b/i,/\b(dawa|dozi|niache dawa|nianze dawa)\b/i],
  SAFETY_CONCERN:[/\b(i don't feel safe|i do not feel safe|someone is threatening me|unsafe at home|afraid someone may hurt)\b/i,/\b(sijisikii salama|natishiwa)\b/i],
  CRISIS_OR_IMMEDIATE_DANGER:[/\b(suicid|kill myself|end my life|self[- ]?harm|hurt myself|overdose|unconscious|not breathing|seizure|immediate danger|hurt someone|harm someone|want to die)\b/i,/\b(nataka kujiua|nataka kufa|niko hatarini|amepoteza fahamu|hapumui)\b/i],
  PRIVACY_REQUEST:[/\b(my data|my information|privacy|delete my data|clinical notes|medical record|my brother'?s.*notes|someone else'?s.*record)\b/i,/\b(faragha|taarifa zangu|futa taarifa|rekodi za matibabu)\b/i],
  STAFF_OPERATION:[/\b(assign staff|staff task|staff record|internal workflow|approve.*content|publish.*meditation|admin operation)\b/i],
};

const EMOTIONS=[
  ['SADNESS',/\b(sad|low|down|huzuni)\b/i],['FEAR',/\b(scared|afraid|fear|worried|anxious|ogopa|wasiwasi)\b/i],
  ['OVERWHELMED',/\b(overwhelmed|too much|nimelemewa)\b/i],['LONELINESS',/\b(alone|lonely|mpweke)\b/i],
  ['CONFUSION',/\b(confused|don'?t know|do not know|sijui)\b/i],['DISTRESS',/\b(hard time|difficult moment|hopeless|ashamed)\b/i],
];

const SOURCE_REQUIRED=new Set(['CENTRE_INFORMATION','PROGRAMME_INFORMATION','ADMISSIONS_GUIDANCE','DOCUMENT_OR_POLICY_LOOKUP','RESOURCE_DISCOVERY','MEDITATION_REQUEST','STAFF_OPERATION']);
const ACTIONABLE=new Set(['BOOKING_INTENT','CALLBACK_INTENT','ACTION_REQUEST','HUMAN_HANDOFF_REQUEST']);
const PROFESSIONAL=new Set(['CLINICAL_DECISION_REQUEST','DIAGNOSIS_REQUEST','MEDICATION_OR_MEDICAL_REQUEST']);
const SAFETY_PRECEDENCE=['CRISIS_OR_IMMEDIATE_DANGER','SAFETY_CONCERN','MEDICATION_OR_MEDICAL_REQUEST','DIAGNOSIS_REQUEST','CLINICAL_DECISION_REQUEST'];

export function detectLanguage(message=''){
  const t=String(message).toLowerCase();
  const sw=(t.match(/\b(nina|nataka|nisaidie|habari|sawa|asante|huzuni|uraibu|matibabu|programu|sala|tafakari|mwanangu|ndugu|wapi|dawa|dozi|faragha|sijui|niko|hatari)\b/g)||[]).length;
  return sw>=1?'sw':'en';
}

export function detectEmotionalSignal(message=''){
  for(const [signal,pattern] of EMOTIONS) if(pattern.test(message)) return signal;
  return 'NONE';
}

function scoreIntent(intent,message){
  const patterns=INTENTS[intent]||[];
  let score=0;
  for(const pattern of patterns) if(pattern.test(message)) score+=1;
  return score;
}

export function classifyIntent(message='',options={}){
  const text=String(message||'').trim();
  const language=detectLanguage(text);
  const emotionalState=detectEmotionalSignal(text);
  if(!text) return {intent:'UNKNOWN',primary_intent:'UNKNOWN',secondary_intent:null,confidence:0,emotional_state_signal:'NONE',language,needs_graceflow:false,needs_sources:false,needs_boundary:false,needs_human:false,actionability:'NONE'};

  const scores=Object.keys(INTENTS).map(intent=>[intent,scoreIntent(intent,text)]).filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]);
  const hasGreeting=scoreIntent('GREETING',text)>0;
  const meaningful=scores.filter(([intent])=>!['GREETING','SMALL_TALK'].includes(intent));
  const safetyPrimary=SAFETY_PRECEDENCE.find(intent=>scoreIntent(intent,text)>0);
  const family=scoreIntent('FAMILY_SUPPORT',text)>0;
  const explicitSelfEmotion=scoreIntent('EMOTIONAL_SUPPORT',text)>0;
  let primary='UNKNOWN';
  if(safetyPrimary) primary=safetyPrimary;
  else if(family) primary='FAMILY_SUPPORT';
  else if(meaningful.length) primary=meaningful[0][0];
  else if(hasGreeting) primary='GREETING';
  else if(scoreIntent('SMALL_TALK',text)>0) primary='SMALL_TALK';
  if(!safetyPrimary&&!family&&explicitSelfEmotion&&emotionalState!=='NONE') primary='EMOTIONAL_SUPPORT';

  let secondary=null;
  const admissions=scoreIntent('ADMISSIONS_GUIDANCE',text)>0 || /where to start|don'?t know where to start|sijui nianzie wapi/i.test(text);
  if(primary==='FAMILY_SUPPORT'&&admissions) secondary='ADMISSIONS_GUIDANCE';
  else if(primary==='EMOTIONAL_SUPPORT'&&family) secondary='FAMILY_SUPPORT';
  else {
    const candidate=meaningful.find(([intent])=>intent!==primary);
    secondary=candidate?.[0]||null;
  }

  const topScore=scoreIntent(primary,text)||1;
  const confidence=primary==='UNKNOWN'?0.35:Math.min(0.99,0.72+(topScore-1)*0.1+(primary==='GREETING'?0.2:0)+(safetyPrimary?0.08:0));
  const needsGraceFlow=ACTIONABLE.has(primary) || ['BOOKING_INTENT','CALLBACK_INTENT'].includes(secondary);
  const needsSources=SOURCE_REQUIRED.has(primary) || (secondary&&SOURCE_REQUIRED.has(secondary));
  const needsBoundary=PROFESSIONAL.has(primary) || ['PRIVACY_REQUEST','STAFF_OPERATION'].includes(primary) || needsGraceFlow;
  const needsHuman=['HUMAN_HANDOFF_REQUEST','CLINICAL_DECISION_REQUEST','DIAGNOSIS_REQUEST','MEDICATION_OR_MEDICAL_REQUEST','SAFETY_CONCERN','CRISIS_OR_IMMEDIATE_DANGER'].includes(primary);

  return {
    intent:primary,primary_intent:primary,secondary_intent:secondary,confidence,
    emotional_state_signal:emotionalState,language,
    needs_graceflow:needsGraceFlow,needs_sources:needsSources,needs_boundary:needsBoundary,needs_human:needsHuman,
    actionability:needsGraceFlow?'ACTIONABLE':primary==='UNKNOWN'?'UNCLEAR':'INFORMATIONAL',
    greeting_detected:hasGreeting,
  };
}
