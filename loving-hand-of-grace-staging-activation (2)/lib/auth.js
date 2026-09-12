import { redirect } from 'next/navigation';
import { getSession } from './supabase-rest';

const landing = {client:'/portal',family:'/family',counsellor:'/staff',clinician:'/staff',clinical_director:'/staff',doctor:'/staff',nurse:'/staff',psychologist:'/staff',social_worker:'/staff',case_manager:'/staff',aftercare_coordinator:'/staff',family_liaison:'/staff',staff:'/staff',director:'/admin',admissions:'/staff/admissions',finance:'/staff/billing',administrator:'/admin',manager:'/admin',super_admin:'/admin',hr:'/staff/graceflow/hr',procurement:'/staff/graceflow/purchase',inventory:'/staff/graceflow/inventory',project_manager:'/staff/graceflow/project',helpdesk:'/staff/graceflow/helpdesk',marketing:'/staff/graceflow/email-marketing',accountant:'/staff/graceflow/accounting',field_service:'/staff/graceflow/field-service'};
export async function requireSession(allowed=[]){
  const session=await getSession();
  if(!session?.profile?.is_active) redirect('/login');
  if(allowed.length&&!allowed.includes(session.profile.role)) redirect(landing[session.profile.role]||'/login');
  return session;
}
export function homeForRole(role){return landing[role]||'/portal'}
