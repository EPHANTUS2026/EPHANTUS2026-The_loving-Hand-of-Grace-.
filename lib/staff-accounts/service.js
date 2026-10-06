import {getSession,dbAdminSelect,dbRpc} from '@/lib/supabase-rest';
import {canManageStaff,validateInvitation,invitationConfiguration} from './policy.mjs';
export async function accountAdmin(){const s=await getSession();return canManageStaff(s)?s:null;}
export async function listStaffAccounts(){return dbAdminSelect('staff_account_invitations','select=id,full_name,email,job_title,department,status,created_at,accepted_at&order=created_at.desc&limit=200');}
export async function authRequest(path,{method='POST',token,body,admin=false}={}){
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=admin?process.env.SUPABASE_SERVICE_ROLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)throw new Error('Authentication unavailable.');
 const r=await fetch(base+'/auth/v1'+path,{method,cache:'no-store',signal:AbortSignal.timeout(15000),headers:{apikey:key,Authorization:`Bearer ${admin?key:token||key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw new Error('Authentication request could not be completed.');
 return r.json();
}
export async function inviteStaff(session,value){
 const data=validateInvitation(value),config=invitationConfiguration(process.env);if(!config.enabled)throw new Error(config.message);
 const reservation=await dbRpc('staff_account_reserve',{p_actor:session.user.id,p_email:data.email,p_name:data.fullName,p_job:data.jobTitle,p_department:data.department});
 // Durable reservation prevents duplicate or concurrent email sends. Ambiguous sends require reconciliation, never blind retry.
 try{
  const user=await authRequest('/invite?redirect_to='+encodeURIComponent(config.origin+'/accept-invitation'),{admin:true,body:{email:data.email,data:{full_name:data.fullName}}});
  const id=user.id||user.user?.id;if(!id)throw new Error('Invitation requires reconciliation.');
  await dbRpc('staff_account_finish',{p_actor:session.user.id,p_invitation:reservation,p_user:id});
  return {message:'Invitation accepted by the email service. Delivery is not yet confirmed. Ask the staff member to check their inbox and spam folder.'};
 }catch{
  await dbRpc('staff_account_review',{p_actor:session.user.id,p_invitation:reservation}).catch(()=>null);
  throw new Error('Invitation is awaiting review. Do not send another invitation until its authentication and email status have been checked.');
 }
}
