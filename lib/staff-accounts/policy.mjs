export const ACCOUNT_ADMIN_ROLES=['super_admin','administrator'];
export function canManageStaff(session){return Boolean(session?.profile?.is_active&&ACCOUNT_ADMIN_ROLES.includes(session.profile.role));}
export function validateInvitation(value){
 const fullName=String(value.fullName||'').trim(),email=String(value.email||'').trim().toLowerCase(),jobTitle=String(value.jobTitle||'').trim(),department=String(value.department||'').trim();
 if(!fullName||fullName.length>120||!jobTitle||jobTitle.length>120||department.length>120||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a full name, valid email and job title.');
 if(value.role&&value.role!=='staff')throw new Error('Additional authority requires a separate approved assignment.');
 if(value.confirm!==true)throw new Error('Confirm that this person is authorised to join the staff portal.');
 return {fullName,email,jobTitle,department,role:'staff'};
}
export function invitationConfiguration(env){
 let origin;try{const u=new URL(env.STAFF_INVITE_ORIGIN);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw new Error();origin=u.origin;}catch{return {enabled:false,message:'Invitation sending needs an approved website address and Auth email configuration.'};}
 return {enabled:env.STAFF_INVITES_ENABLED==='true',origin,message:env.STAFF_INVITES_ENABLED==='true'?'':'Invitation sending is awaiting email and redirect verification.'};
}
