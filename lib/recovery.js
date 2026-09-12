import {dbAdminSelect} from './supabase-rest';

export const PUBLIC_JOURNEY=[
 ['01','Confidential Conversation','A private first step to understand what support you are seeking.'],
 ['02','Initial Screening','A structured first review to identify the right professional next step.'],
 ['03','Professional Assessment','Qualified professionals assess needs and discuss appropriate options.'],
 ['04','Admission','Consent, orientation and practical onboarding are completed.'],
 ['05','Orientation & Stabilisation','The client settles into a safe routine and receives appropriate support.'],
 ['06','Personalised Care Plan','Goals, responsibilities and review points are agreed with the care team.'],
 ['07','Therapy & Recovery','Structured therapeutic, recovery and wellbeing activities are delivered.'],
 ['08','Skills & Independence','Daily living, relationships, vocational and independence skills are developed.'],
 ['09','Family & Community Reintegration','Where appropriate and consented, family and community readiness is strengthened.'],
 ['10','Discharge Planning','Readiness, safety, housing, work/education and continuity plans are reviewed.'],
 ['11','Aftercare','Follow-up sessions, check-ins, goals and referrals support continuity.'],
 ['12','Long-Term Recovery Support','Recovery resources and ongoing support remain available beyond discharge.'],
];

export async function recoveryPassport(session){
 const cid=session.profile.client_id;
 const [journeys,milestones,carePlans,sessions,aftercare,skills]=await Promise.all([
  dbAdminSelect('recovery_journeys',`client_id=eq.${cid}&select=*`).catch(()=>[]),
  dbAdminSelect('recovery_milestones',`client_id=eq.${cid}&approved_for_client=eq.true&select=*&order=created_at.desc`).catch(()=>[]),
  dbAdminSelect('care_plans',`client_id=eq.${cid}&select=id,status,summary_for_client,start_date,target_review_date&order=created_at.desc&limit=1`).catch(()=>[]),
  dbAdminSelect('care_sessions',`client_id=eq.${cid}&select=id,session_type,scheduled_at,status,client_summary&order=scheduled_at.asc&limit=20`).catch(()=>[]),
  dbAdminSelect('aftercare_plans',`client_id=eq.${cid}&select=id,status,cadence,goals_summary,relapse_prevention_summary,community_support_summary,family_support_summary,next_review_at&order=created_at.desc&limit=1`).catch(()=>[]),
  dbAdminSelect('client_skill_plans',`client_id=eq.${cid}&select=id,status,goals,skill_programs(title,category)&order=created_at.desc`).catch(()=>[])
 ]);
 return {journey:journeys?.[0]||null,milestones:milestones||[],carePlan:carePlans?.[0]||null,sessions:sessions||[],aftercare:aftercare?.[0]||null,skills:skills||[]};
}
