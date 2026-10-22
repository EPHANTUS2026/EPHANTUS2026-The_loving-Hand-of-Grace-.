import {randomUUID} from 'crypto';
import {clinicalAuthorityDecision} from './constitution.js';
import {assertProtectedModeAuthority} from './authority.js';

const ALLOWED=new Set(['request_callback','admissions_contact','family_support_contact','appointment_request','aftercare_contact']);

export function authorizeGraceAction({identity,action,consent,intent,idempotencyKey}={}){
  if(!ALLOWED.has(action)) throw new Error('Unsupported Grace action.');
  if(consent!==true) throw new Error('Explicit confirmation is required.');
  const clinical=clinicalAuthorityDecision(intent);
  if(clinical.clinical) throw new Error('Clinical authority requires qualified human review.');
  if(identity?.mode&&identity.mode!=='PUBLIC'&&identity.mode!=='SAFETY') assertProtectedModeAuthority(identity);
  if(identity?.mode==='SAFETY') throw new Error('Urgent safety requests must use the safety escalation protocol.');
  const key=String(idempotencyKey||'').trim();
  if(key.length<8||key.length>128) throw new Error('A valid idempotency key is required.');
  return {commandId:randomUUID(),idempotencyKey:key,actor:{
    id:identity?.actorId||null,role:identity?.role||'anonymous',mode:identity?.mode||'PUBLIC',
    clientId:identity?.clientId||null,familyMemberId:identity?.familyMemberId||null,staffId:identity?.staffId||null
  }};
}
