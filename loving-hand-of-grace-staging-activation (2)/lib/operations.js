import { dbSelect } from './supabase-rest';
import {CARE_ROLES,MANAGEMENT_ROLES} from './roles';

export const admissionStages=['enquiry','screening','assessment','admission_ready','admitted','treatment','discharge','aftercare','closed'];

export async function staffDirectory(token){
  return dbSelect('staff','select=id,full_name,job_title,department,active&active=eq.true&order=full_name.asc',token);
}

export async function admissionsPipeline(token){
  const rows=await dbSelect('admissions','select=id,reference,client_id,enquiry_name,enquiry_phone,enquiry_email,stage,priority,screening_summary,assessment_summary,assigned_staff_id,next_action,next_action_due,created_at,updated_at&order=updated_at.desc',token);
  const staff=await staffDirectory(token);
  const staffMap=Object.fromEntries((staff||[]).map(x=>[x.id,x]));
  return (rows||[]).map(x=>({...x,owner:staffMap[x.assigned_staff_id]?.full_name||'Unassigned'}));
}

export async function admissionById(id,token){
  const rows=await dbSelect('admissions',`id=eq.${encodeURIComponent(id)}&select=*`,token);
  const admission=rows?.[0]; if(!admission)return null;
  const [staff,clientRows]=await Promise.all([
    staffDirectory(token),
    admission.client_id?dbSelect('clients',`id=eq.${encodeURIComponent(admission.client_id)}&select=*`,token):Promise.resolve([])
  ]);
  return {...admission,client:clientRows?.[0]||null,staff};
}

export async function clientRecord(id,token,role){
  const clients=await dbSelect('clients',`id=eq.${encodeURIComponent(id)}&select=*`,token);
  const client=clients?.[0]; if(!client)return null;
  const clinical=[...CARE_ROLES,...MANAGEMENT_ROLES].includes(role);
  const [carePlans,sessions,discharge,aftercare,reviews,notes,risks,appointments,staff]=await Promise.all([
    clinical?dbSelect('care_plans',`client_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`,token):Promise.resolve([]),
    clinical?dbSelect('care_sessions',`client_id=eq.${encodeURIComponent(id)}&select=*&order=scheduled_at.desc`,token):Promise.resolve([]),
    clinical?dbSelect('discharge_plans',`client_id=eq.${encodeURIComponent(id)}&select=*`,token):Promise.resolve([]),
    clinical?dbSelect('aftercare_plans',`client_id=eq.${encodeURIComponent(id)}&select=*`,token):Promise.resolve([]),
    clinical?dbSelect('aftercare_reviews',`client_id=eq.${encodeURIComponent(id)}&select=*&order=reviewed_at.desc`,token):Promise.resolve([]),
    clinical?dbSelect('case_notes',`client_id=eq.${encodeURIComponent(id)}&select=id,note_type,content,sensitivity,author_staff_id,created_at&order=created_at.desc&limit=20`,token):Promise.resolve([]),
    clinical?dbSelect('risk_flags',`client_id=eq.${encodeURIComponent(id)}&select=*&order=raised_at.desc`,token):Promise.resolve([]),
    dbSelect('appointments',`client_id=eq.${encodeURIComponent(id)}&select=*&order=starts_at.asc`,token),
    staffDirectory(token)
  ]);
  const goals=clinical&&carePlans?.length?await dbSelect('care_goals',`care_plan_id=in.(${carePlans.map(x=>x.id).join(',')})&select=*&order=updated_at.desc`,token):[];
  const staffMap=Object.fromEntries((staff||[]).map(x=>[x.id,x]));
  return {client,carePlans:carePlans||[],goals:goals||[],sessions:sessions||[],discharge:discharge?.[0]||null,aftercare:aftercare?.[0]||null,reviews:reviews||[],notes:notes||[],risks:risks||[],appointments:appointments||[],staff:staff||[],staffMap};
}

export async function liveOverview(token,role){
  const [clients,admissions,appointments,aftercare]=await Promise.all([
    dbSelect('clients','select=id,admission_stage,status,admission_date&status=eq.active',token),
    dbSelect('admissions','select=id,stage,priority,updated_at,reference,enquiry_name,client_id&stage=not.eq.closed&order=updated_at.desc',token),
    dbSelect('appointments',`select=id,title,starts_at,location,client_id,status&starts_at=gte.${encodeURIComponent(new Date().toISOString().slice(0,10)+'T00:00:00+03:00')}&order=starts_at.asc&limit=20`,token),
    [...CARE_ROLES,...MANAGEMENT_ROLES].includes(role)?dbSelect('aftercare_plans','select=id,status,next_review_at,client_id&status=in.(active,ready_for_review,approved)',token):Promise.resolve([])
  ]);
  const activeResidents=(clients||[]).filter(x=>['admitted','treatment','discharge'].includes(x.admission_stage)).length;
  const assessment=(admissions||[]).filter(x=>x.stage==='assessment').length;
  const reviewDue=(aftercare||[]).filter(x=>x.next_review_at&&new Date(x.next_review_at)<=new Date(Date.now()+7*86400000)).length;
  return {metrics:[['Active residents',String(activeResidents),'Live client records'],['Admissions pipeline',String(admissions?.length||0),`${assessment} awaiting/in assessment`],['Aftercare active',String(aftercare?.length||0),`${reviewDue} reviews due within 7 days`],['Today’s schedule',String((appointments||[]).filter(x=>new Date(x.starts_at).toDateString()===new Date().toDateString()).length),'Appointments from database']],admissions:admissions||[],appointments:appointments||[]};
}
