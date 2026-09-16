import { appFetch, authToken, expectStatus, restSelect, restUpdate, restInsert, requireEnv, syntheticId } from './lib.mjs';

requireEnv(['STAGING_TEST_PASSWORD']);
const password = process.env.STAGING_TEST_PASSWORD;
const domain = process.env.STAGING_TEST_EMAIL_DOMAIN || 'example.test';
const prefix = process.env.STAGING_TEST_EMAIL_PREFIX || 'lhg-stage';
const emailFor = (role) => `${prefix}+${role.replaceAll('_','-')}@${domain}`;
const tokenFor = async (role) => authToken(emailFor(role), password);
const form = (obj) => new URLSearchParams(Object.entries(obj).filter(([,v]) => v !== undefined && v !== null).map(([k,v]) => [k,String(v)]));
const postForm = async (path, token, obj, label) => {
  const r = await appFetch(path, { token, method:'POST', form:form(obj) });
  expectStatus(r, [200,201,302,303,307,308], label);
  console.log(`✓ ${label}`);
  return r;
};
const transition = async (token, admissionId, to, label) => {
  const r = await appFetch('/api/graceflow/transition', { token, method:'POST', json:{ admissionId, to, reason:`Synthetic staging E2E: ${label}` } });
  expectStatus(r, 200, label);
  console.log(`✓ ${label}`);
};

const syntheticName = `Synthetic Recovery Client ${syntheticId('E2E')}`;
const publicAdmission = await appFetch('/api/admissions', { method:'POST', json:{ name:syntheticName, phone:'+254700000001', email:'synthetic-client@example.test' } });
expectStatus(publicAdmission,201,'Visitor → admission enquiry');
const reference = publicAdmission.body.reference;
const admissionRows = await restSelect('admissions',`reference=eq.${encodeURIComponent(reference)}&select=*`);
const admission = admissionRows?.[0];
if (!admission) throw new Error(`Admission ${reference} not found after public enquiry.`);
console.log(`✓ enquiry persisted: ${reference}`);

const admissionsToken = await tokenFor('admissions');
const counsellorToken = await tokenFor('counsellor');
const clinicianToken = await tokenFor('clinical_director');

await postForm(`/api/operations/admissions/${admission.id}`, admissionsToken, {
  priority:'routine', screening_summary:'Synthetic screening completed for E2E validation. No real clinical information.', next_action:'Professional assessment'
}, 'Screening summary saved');
await transition(admissionsToken, admission.id, 'screening', 'Enquiry → screening');
await transition(admissionsToken, admission.id, 'assessment', 'Screening → assessment');
await postForm(`/api/operations/admissions/${admission.id}`, clinicianToken, {
  priority:'routine', screening_summary:'Synthetic screening completed for E2E validation. No real clinical information.', assessment_summary:'Synthetic assessment completed for E2E validation. Professional review represented by staging account.', next_action:'Admission preparation'
}, 'Assessment summary saved');
await transition(clinicianToken, admission.id, 'admission_ready', 'Assessment → admission ready');

await postForm(`/api/operations/admissions/${admission.id}/create-client`, admissionsToken, {
  legal_name:syntheticName, preferred_name:'Synthetic', preferred_language:'English', primary_programme:'Synthetic Residential Programme'
}, 'Client record created');
const refreshedAdmission = (await restSelect('admissions',`id=eq.${admission.id}&select=*`))?.[0];
const clientId = refreshedAdmission?.client_id;
if (!clientId) throw new Error('Client record was not linked to admission.');
console.log(`✓ linked client: ${clientId}`);

await transition(clinicianToken, admission.id, 'admitted', 'Admission ready → admitted');
await postForm('/api/operations/care-plans', counsellorToken, {
  client_id:clientId, title:'Synthetic Person-Centred Care Plan', summary_for_client:'Synthetic care plan used only for staging validation.', confidential_clinical_context:'Synthetic test context; no real patient information.', start_date:new Date().toISOString().slice(0,10)
}, 'Care plan created');
const carePlan = (await restSelect('care_plans',`client_id=eq.${clientId}&status=eq.active&select=*&limit=1`))?.[0];
if (!carePlan) throw new Error('Care plan not found.');
await transition(counsellorToken, admission.id, 'treatment', 'Admitted → treatment');

const future = new Date(Date.now()+3600000).toISOString().slice(0,16);
await postForm('/api/operations/sessions', counsellorToken, {
  client_id:clientId, care_plan_id:carePlan.id, session_type:'individual', title:'Synthetic Recovery Session', scheduled_at:future, duration_minutes:50, client_summary:'Synthetic session scheduled.'
}, 'Session scheduled');
const session = (await restSelect('care_sessions',`client_id=eq.${clientId}&title=eq.${encodeURIComponent('Synthetic Recovery Session')}&select=*&order=created_at.desc&limit=1`))?.[0];
if (!session) throw new Error('Scheduled session not found.');
await postForm(`/api/operations/sessions/${session.id}`, counsellorToken, {
  client_id:clientId, status:'completed', attendance_note:'Synthetic attendance complete.', clinical_note:'Synthetic clinical note for staging validation only.', client_summary:'Synthetic session completed.', next_step:'Prepare for discharge readiness review.'
}, 'Session completed');

// Preserve the clinical governance boundary: counsellors prepare discharge plans,
// but an authorised clinical role must approve them before the lifecycle may
// transition from treatment to discharge.
await postForm('/api/operations/discharge', counsellorToken, {
  client_id:clientId, care_plan_id:carePlan.id, status:'ready_for_review', readiness_summary:'Synthetic readiness review.', housing_or_environment_plan:'Synthetic stable environment.', recovery_support_plan:'Synthetic support plan.', warning_signs_plan:'Synthetic warning signs plan.', emergency_support_plan:'Use configured emergency and care-team routes.', follow_up_requirements:'Synthetic aftercare follow-up.'
}, 'Discharge plan prepared for clinical review');
const reviewPlan = (await restSelect('discharge_plans',`client_id=eq.${clientId}&select=id,status&limit=1`))?.[0];
if (!reviewPlan || reviewPlan.status !== 'ready_for_review') throw new Error(`Discharge review gate was not persisted (status=${reviewPlan?.status || 'missing'}).`);
console.log('✓ Discharge review gate persisted');

await postForm('/api/operations/discharge', clinicianToken, {
  client_id:clientId, care_plan_id:carePlan.id, status:'approved', readiness_summary:'Synthetic discharge approved by staging clinical role.', housing_or_environment_plan:'Synthetic stable environment.', recovery_support_plan:'Synthetic support plan.', warning_signs_plan:'Synthetic warning signs plan.', emergency_support_plan:'Use configured emergency and care-team routes.', follow_up_requirements:'48-hour, 7-day and 30-day synthetic follow-ups.'
}, 'Discharge approved by clinical role');
const approvedDischarge = (await restSelect('discharge_plans',`client_id=eq.${clientId}&select=id,status&limit=1`))?.[0];
if (!approvedDischarge || approvedDischarge.status !== 'approved') throw new Error(`Clinical discharge approval was not persisted (status=${approvedDischarge?.status || 'missing'}).`);
console.log('✓ Clinical discharge approval persisted');

await transition(clinicianToken, admission.id, 'discharge', 'Treatment → discharge');
const discharge = (await restSelect('discharge_plans',`client_id=eq.${clientId}&select=*&limit=1`))?.[0];

const nextReview = new Date(Date.now()+2*86400000).toISOString().slice(0,16);
await postForm('/api/operations/aftercare', clinicianToken, {
  client_id:clientId, discharge_plan_id:discharge?.id, status:'active', start_date:new Date().toISOString().slice(0,10), cadence:'48 hours / 7 days / 30 days / 90 days', goals_summary:'Synthetic recovery continuity goals.', relapse_prevention_summary:'Synthetic relapse-prevention plan.', community_support_summary:'Synthetic community support.', family_support_summary:'Synthetic consent-controlled family support.', next_review_at:nextReview
}, 'Aftercare plan created');
await transition(clinicianToken, admission.id, 'aftercare', 'Discharge → aftercare');
const aftercare = (await restSelect('aftercare_plans',`client_id=eq.${clientId}&select=*&limit=1`))?.[0];
await postForm('/api/operations/aftercare-review', clinicianToken, {
  client_id:clientId, aftercare_plan_id:aftercare.id, contact_method:'staging', wellbeing_summary:'Synthetic follow-up completed.', recovery_progress:'Synthetic progress remains on plan.', concerns:'None — synthetic test only.', actions:'Continue synthetic follow-up schedule.', next_review_at:new Date(Date.now()+7*86400000).toISOString().slice(0,16)
}, 'Aftercare review recorded');
await postForm('/api/operations/aftercare', clinicianToken, {
  client_id:clientId, discharge_plan_id:discharge?.id, status:'completed', start_date:new Date().toISOString().slice(0,10), cadence:'Synthetic completed cadence', goals_summary:'Synthetic aftercare completed.', next_review_at:''
}, 'Aftercare completed');
await transition(clinicianToken, admission.id, 'closed', 'Aftercare → closed');

// Keep the Recovery Passport domain in sync for this synthetic E2E client.
let journeys = await restSelect('recovery_journeys',`client_id=eq.${clientId}&select=*`);
let journey = journeys?.[0];
if (!journey) {
  journey = (await restInsert('recovery_journeys',{client_id:clientId,current_stage:'LONG_TERM_RECOVERY_SUPPORT',assigned_team:[],progress_indicators:{staging_e2e:true},next_actions:[],consent_state:{synthetic:true},aftercare_status:'completed'}))?.[0];
  await restInsert('recovery_journey_events',{journey_id:journey.id,from_stage:null,to_stage:'LONG_TERM_RECOVERY_SUPPORT',reason:'Synthetic end-to-end staging verification',metadata:{source:'scripts/staging/e2e-recovery.mjs',admission_reference:reference}});
} else {
  await restUpdate('recovery_journeys',`id=eq.${journey.id}`,{current_stage:'LONG_TERM_RECOVERY_SUPPORT',stage_started_at:new Date().toISOString(),aftercare_status:'completed',updated_at:new Date().toISOString()});
}

const finalAdmission = (await restSelect('admissions',`id=eq.${admission.id}&select=id,reference,stage,client_id`))?.[0];
const workflow = (await restSelect('workflow_instances',`entity_type=eq.admission&entity_id=eq.${admission.id}&select=id,current_state,status`))?.[0];
const audits = await restSelect('audit_log',`entity_id=eq.${admission.id}&select=id,action,created_at&order=created_at.asc`);
console.log('\nE2E RECOVERY JOURNEY PASSED');
console.log(JSON.stringify({reference,clientId,admission:finalAdmission,workflow,auditEvents:audits?.length||0,synthetic:true},null,2));
