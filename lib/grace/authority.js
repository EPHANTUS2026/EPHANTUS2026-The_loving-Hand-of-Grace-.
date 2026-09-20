import {resolveGraceOperatingMode} from './constitution.js';

const STAFF_ROLES=new Set(['counsellor','clinician','clinical_director','doctor','nurse','psychologist','social_worker','case_manager','aftercare_coordinator','family_liaison','staff','director','admissions','administrator','manager','super_admin']);
const protectedModes=new Set(['CLIENT','FAMILY','STAFF','AFTERCARE']);

export function buildGraceIdentityContext(session,{requestedMode=null,safetyLevel='STANDARD'}={}){
  const mode=resolveGraceOperatingMode({session,requestedMode,safetyLevel});
  const p=session?.profile||null;
  return Object.freeze({
    authenticated:Boolean(p?.is_active),
    actorId:p?.id||null,
    role:p?.role||'anonymous',
    clientId:p?.client_id||null,
    familyMemberId:p?.family_member_id||null,
    staffId:p?.staff_id||null,
    mode,
  });
}

export function assertProtectedModeAuthority(identity){
  if(protectedModes.has(identity?.mode)&&!identity?.authenticated) throw new Error('Protected Grace mode requires authenticated server identity.');
  if(identity?.mode==='CLIENT'&&!identity?.clientId) throw new Error('Client identity is not linked.');
  if(identity?.mode==='FAMILY'&&!identity?.familyMemberId) throw new Error('Family identity is not linked.');
  if(identity?.mode==='STAFF'&&(!identity?.staffId||!STAFF_ROLES.has(identity?.role))) throw new Error('Staff authority is not linked.');
  return true;
}

export function assertSelfClient(identity,requestedClientId){
  assertProtectedModeAuthority(identity);
  if(identity.mode!=='CLIENT'||!identity.clientId||identity.clientId!==requestedClientId) throw new Error('Client self-only boundary denied.');
  return true;
}

export function requireFamilyConsent({identity,relationship,category,now=new Date()}){
  assertProtectedModeAuthority(identity);
  if(identity.mode!=='FAMILY'||!relationship) throw new Error('Family relationship authority denied.');
  if(relationship.family_member_id!==identity.familyMemberId) throw new Error('Family relationship authority denied.');
  if(relationship.consent_active!==true) throw new Error('Family consent is inactive.');
  if(relationship.consent_expires_at&&new Date(relationship.consent_expires_at)<=now) throw new Error('Family consent is expired.');
  const scope=Array.isArray(relationship.consent_scope)?relationship.consent_scope:[];
  if(category&&!scope.includes(category)&&!scope.includes('*')) throw new Error('Family consent does not cover this information.');
  return true;
}

export function requireStaffRelationship({identity,assignment,purpose,scope}){
  assertProtectedModeAuthority(identity);
  if(identity.mode!=='STAFF'||!assignment) throw new Error('Staff relationship authority denied.');
  if(assignment.staff_id!==identity.staffId||assignment.active!==true) throw new Error('Staff assignment is inactive or unrelated.');
  const purposes=Array.isArray(assignment.purposes)?assignment.purposes:[];
  const scopes=Array.isArray(assignment.scopes)?assignment.scopes:[];
  if(purpose&&!purposes.includes(purpose)&&!purposes.includes('*')) throw new Error('Staff purpose is not authorized.');
  if(scope&&!scopes.includes(scope)&&!scopes.includes('*')) throw new Error('Staff scope is not authorized.');
  return true;
}
