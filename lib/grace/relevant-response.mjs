import {services} from '../services.js';
import {centre} from '../config.js';

const source=(slug,title)=>({id:`website:${slug}`,title,type:'published_website_information',url:slug,version:'website-current'});
const swNames={'residential-rehabilitation':'Huduma ya kuishi kituoni','outpatient-support':'Huduma bila kuishi kituoni','relapse-prevention':'Kuzuia kurudia matumizi','family-program':'Msaada kwa familia','life-skills-reintegration':'Stadi za maisha na kurudi jamii',aftercare:'Msaada baada ya programu'};
const topics=[['residential-rehabilitation',/residential|kuishi kituoni|kulazwa/i],['outpatient-support',/outpatient|bila kuishi|nyumbani/i],['relapse-prevention',/relapse prevention|kuzuia kurudia/i],['family-program',/family program|family programme|family support|familia/i],['life-skills-reintegration',/life skills|reintegration|stadi za maisha|kurudi jamii/i],['aftercare',/aftercare|baada ya (programu|matibabu)/i]];
function relation(turns,message){
 let who='';
 for(const text of [...turns.map(t=>t.user),message]){
  const match=text.match(/\bmy (brother|sister|son|daughter|husband|wife|partner|mother|father|child)\b/i);
  if(match)who=`your ${match[1].toLowerCase()}`;
  if(/\b(for me|for myself|help for myself)\b/i.test(text))who='you';
  if(/ndugu yangu/i.test(text))who='ndugu yako';
  if(/mwanangu/i.test(text))who='mtoto wako';
 }
 return who;
}
export function relevantResponse({message,turns=[],base={}}){
 // Public information can help any role; protected data and clinical decisions remain with existing authority paths.
 if(base.safetyLevel==='EMERGENCY'||['CLINICAL_SCOPE_BOUNDARY','PROFESSIONAL_ASSESSMENT_BOUNDARY','ACCESS_RESTRICTION_BOUNDARY','PRIVACY_BOUNDARY'].includes(base.boundary))return null;
 const m=message.trim(),sw=base.language==='sw',who=relation(turns,m);
 let answer='',sources=[],quickActions=[];
 const specific=topics.find(([,pattern])=>pattern.test(m));
 if(/\b(cost|costs|fees?|prices?|payment|how much)\b|gharama|bei|malipo/i.test(m)){
  answer=sw?'Kwa gharama za sasa na mpango wa malipo, wasiliana na Kituo kabla ya kuamua. Bei haijawekwa kwenye ukurasa wa huduma; sitakupa kiasi kisichothibitishwa.':'For current fees and payment arrangements, contact the Centre before deciding. The service pages do not publish a price, so I cannot quote a confirmed amount.';
  sources=[source('/services','Service practical information')];
 }else if(/\b(how long|duration|length of stay|days|months|weeks)\b|muda gani/i.test(m)){
  answer=sw?'Muda hutegemea huduma, tathmini na mpango unaokubaliwa. Kituo hakijaweka muda mmoja wa kila mtu kwenye kurasa za huduma. Omba tathmini ya siri ili kujadili muda unaowezekana.':'Duration depends on the service, assessment and agreed plan. The service pages do not specify one fixed stay for everyone. A confidential assessment is the next step to discuss an appropriate schedule.';
  sources=[source('/services','Service duration and assessment')];
 }else if(/where.*(?:you|centre|center|located)|\blocation\b|\baddress\b|mko wapi|kituo kiko wapi|anwani/i.test(m)){
  answer=sw?`Anwani iliyowekwa kwenye tovuti ni: ${centre.address}. Wasiliana na Kituo kabla ya kusafiri ili kuthibitisha maelekezo na mpango wa kufika.`:`The website lists our location as ${centre.address}. Contact the Centre before travelling to confirm directions and arrangements.`;
  sources=[source('/contact','Centre contact and location')];
 }else if(/hours|visiting|open.*time|saa za|kutembelea/i.test(m)){
  answer=sw?`Kwa saa za huduma na kutembelea: ${centre.hours}. Tafadhali piga simu Kituoni kuthibitisha kabla ya kufika.`:`For opening and visiting arrangements: ${centre.hours}. Please call the Centre to confirm before visiting.`;
  sources=[source('/contact','Centre contact arrangements')];
 }else if(/\b(phone|telephone|number|email|contact|call)\b|simu|barua pepe/i.test(m)&&! /call me|callback|call back|nipigie|nipigieni/i.test(m)){
  answer=sw?`Unaweza kuwasiliana na Kituo kwa ${centre.phone}, au ${centre.email}. Hii si huduma ya dharura. Kwa hatari ya haraka, tafuta huduma za dharura au hospitali iliyo karibu.`:`You can reach the Centre on ${centre.phone} or ${centre.email}. This is not an emergency service. For immediate danger, seek emergency services or the nearest hospital.`;
  sources=[source('/contact','Centre contact details')];
 }else if(/\b(services?|programmes?|programs?|options|offer)\b|huduma|programu|chaguo/i.test(m)||specific){
  if(specific){
   const [slug]=specific,s=services[slug];
   answer=sw?`${swNames[slug]} ni moja ya huduma zilizo kwenye tovuti. Tathmini ya siri ndiyo itaamua kama huduma hii inafaa. Unaweza kusoma maelezo yake kwenye ukurasa wa huduma au kuomba timu iwasiliane nawe.`:`${s.title}: ${s.shortDescription}\n\n${s.audience} Final suitability is determined through a confidential assessment.`;
   sources=[source(`/services/${slug}`,s.title)];
  }else{
   answer=sw?`Huduma zilizo kwenye tovuti ni:\n${Object.values(swNames).map(n=>`• ${n}`).join('\n')}\n\nTathmini ya siri husaidia kubaini huduma inayofaa. Ungependa maelezo ya huduma ipi?`:`Our website lists these services:\n${Object.values(services).map(s=>`• ${s.title}`).join('\n')}\n\nSuitability is determined through a confidential assessment. Which service would you like to understand?`;
   sources=[source('/services','Centre service catalogue')];
  }
 }else if(/\b(admission|admissions|assessment|start|first step)\b|kujiunga|tathmini|nianzie|nitaanzaje/i.test(m)){
  answer=sw?'Anza kwa ombi la siri. Timu itajadili mahitaji na kupanga tathmini kabla ya kukubaliana kuhusu huduma. Unaweza kutumia ukurasa wa Mawasiliano; ombi halithibitishi miadi.':'Start with a confidential enquiry. The team discusses needs and arranges an initial assessment before agreeing a suitable plan. Use Contact or Request team contact; submitting an enquiry does not confirm an appointment.';
  sources=[source('/services','Confidential enquiry and assessment process')];
 }else if(/who are you|what can you do|how can you help|what.*grace|wewe ni nani|unaweza kusaidia/i.test(m)){
  answer=sw?'Mimi ni Grace, msaidizi wa AI wa Kituo. Naweza kueleza huduma, kukusaidia kupata maelekezo na kuonyesha jinsi ya kuomba msaada kutoka kwa timu. Si mtaalamu wa matibabu. Ungependa msaada kuhusu nini?':'I’m Grace, the Centre’s AI assistant. I can explain our services, help you find information and guide you to a confidential enquiry or the team. I cannot make clinical decisions. What would help you today?';
 }else if(/what is (rehab|rehabilitation)|rehab ni nini/i.test(m)){
  answer=sw?'Ukarabati ni msaada uliopangwa kwa kujenga njia za kukabiliana na changamoto, ratiba na maisha ya kila siku. Tovuti inaeleza ushauri, mipango ya kupona na msaada wa familia inapofaa. Tathmini husaidia kujua aina ya msaada inayofaa.':'Rehabilitation is structured support to build coping skills, routines and a more stable daily life. Our service pages describe counselling, recovery planning and family support where appropriate. An assessment helps determine the right kind of support.';
  sources=[source('/services','Centre service catalogue')];
 }else if(base.intent==='GENERAL_SUPPORT'||/how.*help (him|her|them)|I need help|help for (me|myself)|nisaidie/i.test(m)){
  answer=sw?`Unaweza kuchukua hatua moja ndogo: kuomba mazungumzo ya siri na timu. Huhitaji kutoa maelezo ya matibabu hapa. Je, ungependa kuelewa huduma au namna ya kuwasiliana?`:`We can start with one manageable step${who?` for ${who}`:''}: a confidential conversation with the team. You do not need to share medical details here. Would you prefer to understand the services or find out how to make contact?`;
 }else if(/cravings?|hamu ya kutumia/i.test(m)&&base.boundary==='NONE'){
  answer=sw?'Pole, hamu inaweza kuwa ngumu. Ikiwa uko salama sasa, jaribu kuhamia mahali penye msaada, kuchukua pumzi taratibu na kuwasiliana na mtu unayemwamini. Unaweza kutumia zana ya grounding kwenye ukurasa huu. Kwa dalili kali au hatari ya haraka, tafuta huduma za dharura. Ungependa zana ya grounding au kuwasiliana na timu?':'Cravings can feel difficult. If you are safe right now, move to a supportive place, take a few slow breaths and contact someone you trust. The grounding tool on this page may help you pause. For severe symptoms or immediate danger, seek urgent care. Would you prefer a grounding exercise or contact with the team?';
 }else if(base.intent==='SMALL_TALK'){
  answer=sw?'Karibu. Unaweza kuuliza kuhusu huduma au kuwasiliana na timu wakati wowote.':'You’re welcome. You can ask about a service or contact the team whenever you’re ready.';
 }else if(/^(?:yes|yes please|okay|ok|sawa|ndiyo)[.! ]*$/i.test(m)&&turns.length){
  const last=turns.at(-1).assistant;
  if(/support options|chaguo|service|huduma|programme/i.test(last))return relevantResponse({message:sw?'huduma mnazotoa':'What services do you offer?',turns,base});
  if(/contact|team|timu|enquiry|call/i.test(last)){
   answer=sw?'Chagua “Request team contact” kwenye mazungumzo haya, au ukurasa wa Mawasiliano. Fomu itakuomba njia ya mawasiliano na idhini yako. Hutahitaji kutoa maelezo ya matibabu.':'Choose Request team contact in this conversation, or use Contact. The form asks for a contact method and your consent. You do not need to share medical details.';
   sources=[source('/contact','Confidential enquiry')];
  }
 }else if(/^(?:he|she|they|him|her)\b|\bwhat about (him|her|them)\b/i.test(m)&&who){
  answer=sw?`Tunaendelea kuzungumza kuhusu ${who}. Je, ungependa kuelewa huduma au hatua ya kuwasiliana na timu?`:`We’re still discussing ${who}. Would you like to understand the service options or how to request support?`;
 }
 if(!answer&&base.intent==='EMOTIONAL_SUPPORT'){
  if(/anxious|anxiety|worried|scared|afraid|wasiwasi|ninaogopa/i.test(m)){
   answer=sw?`Pole kwa kuhisi wasiwasi. Huhitaji kueleza kila kitu sasa.

Ukipenda, weka miguu chini na taja vitu vitatu unavyoviona karibu nawe. Chukua muda wako; unaweza kuacha kama haikusaidii.

Ungependa tuendelee na zoezi fupi, au kuzungumza kuhusu kinachokupa wasiwasi?`:"I’m sorry you’re feeling anxious. You don’t need to explain everything right now.\n\nIf you’d like, feel your feet on the floor and name three things you can see around you. Take your time; you can stop if it doesn’t help.\n\nWould you like to continue with a short grounding exercise, or talk about what’s making you anxious?";
   quickActions=sw?['Zoezi la grounding','Nataka kuzungumza','Nataka kuongea na mtu']:['Try a grounding exercise','I want to talk about it','Speak to someone'];
  }else if(/sad|low|down|huzuni/i.test(m)){
   answer=sw?'Pole kwa kuhisi huzuni. Unaweza kuchukua muda wako. Ungependa kuniambia kinachokulemea leo, au kupata namna ya kuwasiliana na mtu unayemwamini?':"I’m sorry you’re feeling low. You can take your time. Would you like to tell me what’s weighing on you today, or find a way to reach someone you trust?";
  }else if(/overwhelmed|nimelemewa/i.test(m)){
   answer=sw?'Pole kwa kuhisi umelemewa. Huhitaji kushughulikia kila kitu kwa wakati mmoja. Tunaweza kuanza na jambo moja dogo. Ni kitu gani ungependa tuanze nacho?':"That sounds overwhelming. You don’t have to work through everything at once. We can focus on one small thing. What would you like to start with?";
  }
 }
 if(!answer&&/grounding|settle for a moment|help me calm|nitulie/i.test(m)){
  answer=sw?'Tujaribu taratibu, ikiwa unataka. Angalia karibu nawe na taja vitu vitatu unavyoviona. Kisha tambua kitu unachokigusa, kama miguu yako sakafuni. Huhitaji kuharakisha, na unaweza kuacha. Je, ungependa kuendelea au kuzungumza?':'Let’s take it slowly, if you’d like. Look around and name three things you can see. Then notice something you can feel, such as your feet on the floor. There is no need to rush, and you can stop. Would you like to continue or talk?';
 }
 if(!answer&&/^(I want to talk about it|Nataka kuzungumza)[.! ]*$/i.test(m)){
  const anxiety=turns.some(t=>/anxious|wasiwasi/i.test(t.user));
  answer=sw?'Niko hapa kukusikiliza. Ungependa kushiriki nini kwanza?':anxiety?'You can take your time. What has been making you feel anxious today?':'You can take your time. What would you like to share first?';
 }
 if(!answer)return null;
 if(who&&sources.length&&base.intent==='FAMILY_SUPPORT'&&!sw)answer=`For ${who}, here is the relevant information.\n\n${answer}`;
 return {answer,sources,quickActions,state:sources.length?'PUBLISHED_INFORMATION':'GENERAL',responseMode:'website_guidance',provenance:{knowledgeState:sources.length?'PUBLISHED_WEBSITE':'GENERAL',sourceCount:sources.length,toolConfirmationState:'NONE'},disclosure:{label:'Grace is using the Centre’s current public website information. This is not a clinical assessment.',learnMore:true}};
}

export function knowledgeSearchQuery(message){
 const m=String(message);
 if(/mission|vision|dira|dhamira/i.test(m))return 'mission OR vision';
 if(/goals?|malengo/i.test(m))return 'goals';
 if(/commitment|values?|maadili/i.test(m))return 'commitment';
 return m.replace(/[^\p{L}\p{N}\s'-]/gu,' ').split(/\s+/).filter(w=>w.length>2&&!/^(what|where|when|which|how|does|the|you|your|our|can|could|would|please|tell|about|centre|center|loving|hand|grace)$/i.test(w)).slice(0,12).join(' OR ').slice(0,300);
}
