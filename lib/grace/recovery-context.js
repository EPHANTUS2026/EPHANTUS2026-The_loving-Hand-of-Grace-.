import {dbSelect,dbRpc} from '@/lib/supabase-rest';

const q=encodeURIComponent;
const safe=f=>f().catch(()=>[]);

export async function getMyJourney(session){
 const clientId=session?.profile?.client_id;
 if(!clientId) throw new Error('Client identity is not linked.');
 const token=session.token;
 const [journey,catalog,milestones,appointments]=await Promise.all([
  safe(()=>dbSelect('recovery_journeys',`client_id=eq.${q(clientId)}&select=id,current_stage,stage_started_at,aftercare_status&limit=1`,token)),
  safe(()=>dbSelect('recovery_stage_catalog','active=eq.true&select=stage_key,sequence_no,label,description&order=sequence_no.asc',token)),
  safe(()=>dbSelect('recovery_milestones',`client_id=eq.${q(clientId)}&approved_for_client=eq.true&select=id,title,category,status,completed_at&order=created_at.desc&limit=20`,token)),
  safe(()=>dbSelect('appointments',`client_id=eq.${q(clientId)}&visible_to_client=eq.true&select=id,title,appointment_type,starts_at,status&order=starts_at.asc&limit=10`,token))
 ]);
 const current=journey?.[0]||null;
 return {journey:current,stages:catalog||[],milestones:milestones||[],appointments:appointments||[]};
}

export async function getMyRequests(session){
 const clientId=session?.profile?.client_id;
 if(!clientId) throw new Error('Client identity is not linked.');
 const token=session.token;
 // RLS remains authoritative. Only client-visible request projections may be returned.
 return safe(()=>dbSelect('grace_client_requests',`client_id=eq.${q(clientId)}&select=id,request_type,status,submitted_at,updated_at,client_message&order=submitted_at.desc&limit=30`,token));
}

export async function resolveFamilyGraceAuthority(session,clientId,category){
 if(!session?.profile?.family_member_id) return false;
 return Boolean(await dbRpc('grace_family_authority',{p_client_id:clientId,p_category:category},{admin:false,token:session.token}));
}

export async function resolveStaffGraceAuthority(session,clientId,scope,purpose){
 if(!session?.profile?.staff_id) return false;
 return Boolean(await dbRpc('grace_staff_authority',{p_client_id:clientId,p_scope:scope,p_purpose:purpose},{admin:false,token:session.token}));
}
