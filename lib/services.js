const commonProcess=[
  ['Confidential enquiry','Tell us what support you are seeking without sharing private medical details in the public form.'],
  ['Initial assessment','A qualified member of the team discusses needs, safety, goals and the most appropriate next step.'],
  ['Personalised plan','Where suitable, the team agrees a practical support plan with the participant and appropriate family involvement.'],
  ['Service participation','The participant takes part in the agreed sessions, routines, education and support activities.'],
  ['Progress review and continuing support','The team reviews progress, adjusts support where appropriate and discusses referrals or continuing care.']
];
const commonIncludes=['Counselling and psychosocial support','Recovery planning and goal setting','Family involvement where appropriate','Life-skills and routine development','Peer or community support where suitable','Follow-up, referrals and progress review'];
const commonFaq=[['Who decides whether this service is suitable?','Suitability is considered through a confidential assessment. Information on this page is general and does not replace professional assessment.'],['Is my enquiry confidential?','We handle enquiries confidentially and collect only the information needed to respond. Do not include medical details in a public enquiry form.'],['How long does the service take?','Duration and scheduling depend on the service, assessment and agreed plan. Contact the Centre for current availability and fees.'],['Can my family be involved?','Family involvement may be appropriate with the participant’s consent and within confidentiality boundaries.'],['What happens after completion?','The team can discuss continuing support, aftercare, referrals and practical next steps based on the person’s needs.'],['What should I do in an urgent concern?','This website and Grace are not emergency services. Contact emergency services or go to the nearest hospital for immediate danger or urgent medical or psychiatric care.']];
const base={processSteps:commonProcess,includes:commonIncludes,outcomes:['Improved coping and decision-making','Stronger routines and support networks','Better communication and practical confidence','Preparation for education, work or community reintegration','Ongoing recovery support where appropriate'],practical:[['Scheduling','Contact the Centre for current session times, availability and fees.'],['Assessment','Final suitability is determined through a confidential assessment.'],['Confidentiality','Public enquiries should contain no medical or clinical details.'],['Accessibility','Tell the Centre about accessibility or communication needs when making contact.']],faqs:commonFaq,relatedServices:[]};
export const services={
 'residential-rehabilitation':{...base,title:'Residential Rehabilitation',shortDescription:'A structured residential environment with daily routines, counselling and recovery planning.',heroDescription:'A coordinated residential programme designed around safety, dignity, recovery skills and gradual preparation for life beyond the Centre.',type:'Residential support',audience:'For people who may benefit from a structured living environment and whose suitability is confirmed through assessment.',includes:['Structured residential environment and daily routines','Counselling and recovery planning','Life-skills development and peer support','Family engagement where appropriate','Progress reviews and admission planning'],practical:[['Participation','Residential participation and accommodation expectations are explained during assessment.'],...base.practical],relatedServices:['family-program','life-skills-reintegration','aftercare']},
 'outpatient-support':{...base,title:'Outpatient Support',shortDescription:'Scheduled support for people who can safely remain at home while receiving continuing care.',heroDescription:'Flexible counselling, recovery planning and follow-up support arranged around a person’s circumstances and assessed needs.',type:'Outpatient support',audience:'For people who can safely remain at home and attend agreed appointments, subject to confidential assessment.',includes:['Scheduled counselling and follow-up','Home-support and routine considerations','Recovery planning and goal review','Referral and escalation pathway','Confidential booking workflow'],practical:[['Attendance','Appointments and follow-up should be attended as agreed; contact the Centre if circumstances change.'],...base.practical],relatedServices:['relapse-prevention','family-program','aftercare']},
 'relapse-prevention':{...base,title:'Relapse Prevention',shortDescription:'Practical planning for triggers, warning signs, coping strategies and support networks.',heroDescription:'A person-centred programme for strengthening awareness, routines, accountability and continuing recovery support.',type:'Continuing recovery support',audience:'For people seeking practical relapse-prevention planning alongside appropriate counselling or continuing support.',includes:['Trigger and warning-sign identification','Coping and routine planning','Personal support network mapping','Family role and communication planning','Check-ins and an emergency response plan'],practical:[['Scope','Relapse-prevention support does not replace emergency or specialist clinical care.'],...base.practical],relatedServices:['outpatient-support','family-program','aftercare']},
 'family-program':{...base,title:'Family Program',shortDescription:'Education, communication and support for families affected by addiction and recovery.',heroDescription:'A confidential, consent-aware family support service that helps relatives understand recovery and respond safely.',type:'Family-based support',audience:'For families and caregivers seeking education, communication support, healthy boundaries and guidance.',includes:['Family education and counselling','Communication and healthy-boundary support','Caregiver support','Consent-aware family meetings','Guidance for supporting recovery safely'],practical:[['Consent','Family information is handled within consent and confidentiality boundaries.'],...base.practical],relatedServices:['residential-rehabilitation','relapse-prevention','aftercare']},
 'life-skills-reintegration':{...base,title:'Life Skills & Reintegration',shortDescription:'Practical preparation for routines, relationships, education, work and community participation.',heroDescription:'Support for building daily responsibility, confidence, practical skills and realistic reintegration milestones.',type:'Skills and reintegration support',audience:'For participants preparing for greater independence, education, employment, housing or community life.',includes:['Routine and daily-responsibility building','Communication and relationship skills','Budgeting and financial habits','Education, employment and vocational preparation','Housing readiness and community participation','Reintegration milestones and referrals'],practical:[['Partnerships','Education, employment, housing and vocational referrals depend on confirmed partner availability.'],...base.practical],relatedServices:['residential-rehabilitation','family-program','aftercare']},
 'aftercare':{...base,title:'Aftercare',shortDescription:'Continuing recovery planning, check-ins, referrals and practical support after a programme.',heroDescription:'A continuing support pathway that helps people maintain recovery routines and respond early when additional help is needed.',type:'Continuing support',audience:'For people transitioning from a programme or seeking structured follow-up and recovery continuity.',includes:['Continuing recovery planning','Agreed follow-up schedules and check-ins','Peer and community connections','Counselling continuation where appropriate','Employment, housing and referral support','Relapse-response and request-help pathway'],practical:[['Follow-up','Cadence and duration are agreed according to the person’s plan and current availability.'],...base.practical],relatedServices:['relapse-prevention','life-skills-reintegration','family-program']}
};
/**
 * @typedef {Object} ServiceRecord
 * @property {string} slug
 * @property {string} title
 * @property {string} shortDescription
 * @property {string} heroDescription
 * @property {string} audience
 * @property {string} serviceType
 * @property {string[]} sections
 * @property {string[][]} processSteps
 * @property {string[]} outcomes
 * @property {string[][]} practicalInformation
 * @property {string[][]} faqs
 * @property {{support:string,assessment:string}} ctaConfig
 * @property {string[]} relatedServices
 * @property {'general-information'} status
 */
export const serviceSlugs=Object.keys(services);
const specificFaq = {
 'residential-rehabilitation': ['What should I prepare for admission?', 'Request a confidential admission assessment first. Contact the Centre for confirmed accommodation arrangements, daily participation expectations and a packing checklist before travelling.'],
 'outpatient-support': ['Can I attend while living at home?', 'Assessment considers whether remaining at home is safe, available home support and attendance needs. The team can discuss referral or escalation if a different level of support is needed.'],
 'relapse-prevention': ['What if I notice warning signs?', 'Use your agreed support plan and request a check-in early. A plan may cover triggers, coping strategies, trusted contacts and urgent-care options; it is not a substitute for clinical or emergency care.'],
 'family-program': ['Can I request a family meeting?', 'Contact the Centre to discuss a meeting. Participation and any sharing of another person’s information depend on valid consent and safeguarding responsibilities. Being a relative does not grant access to care records.'],
 'life-skills-reintegration': ['Are jobs, housing or business funding guaranteed?', 'No. Goals may include budgeting, housing readiness, education, employment preparation and exploration of entrepreneurship or vocational pathways. Referrals and partnerships depend on confirmed availability.'],
 'aftercare': ['How do I request help between reviews?', 'Contact the Centre to ask about a check-in or review of your continuing support plan. Confirm contact arrangements during planning. For immediate danger or urgent health concerns, use emergency services or the nearest hospital.']
};
for (const slug of serviceSlugs) {
 const record = services[slug];
 record.faqs = [specificFaq[slug], ...commonFaq,
  ['Do I need an appointment or referral?', 'Make a confidential enquiry before attending. Contact the Centre to confirm appointment availability and any referral requirements.'],
  ['What are the current fees?', 'Contact the Centre for current fees and payment arrangements before agreeing to participate.']
 ];
 record.practical = [...record.practical,
  ['What to prepare', 'Contact the Centre for details of documents, personal items or other preparation needed before attending. Do not upload medical records through the public enquiry form.'],
  ['Family participation', 'Contact the Centre for details. Any involvement and information sharing must respect consent and safeguarding boundaries.'],
  ['Referral requirements', 'Contact the Centre for details of any required referral or assessment documents.'],
  ['Fees', 'Contact the Centre for current fees.'],
  ['Safeguarding', 'Ask the Centre about its confidentiality limits, safeguarding arrangements and how to raise a concern.'],
  ['Booking', 'Use the confidential enquiry form or contact the Centre to request an assessment. An enquiry does not confirm an appointment.']
 ];
}
/** @type {ServiceRecord[]} */
export const serviceRecords=serviceSlugs.map(slug=>Object.assign(services[slug],{
 slug,serviceType:services[slug].type,sections:services[slug].includes,
 practicalInformation:services[slug].practical,
 ctaConfig:{support:'/contact',assessment:'/contact'},status:'general-information'
}));
export function getService(slug){return Object.hasOwn(services,slug)?services[slug]:null;}
