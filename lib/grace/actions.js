import { createHmac } from 'node:crypto';
import { dbRpc } from '@/lib/supabase-rest';
const actions=['request_callback','admissions_contact','family_support_contact','appointment_request','aftercare_contact'];
export const listGraceActions=()=>[...actions];
export async function createGraceFlowAction(input={}) {
 if(!actions.includes(input.action)||input.consent!==true)throw new Error('Invalid request');
 if(typeof input.idempotencyKey!=='string'||input.idempotencyKey.length<8||input.idempotencyKey.length>128)throw new Error('Invalid retry key');
 const contact={name:input.name||'',phone:input.phone||'',email:input.email||''};
 if(!contact.phone&&!contact.email)throw new Error('Contact required');
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw new Error('Unavailable');
 const hash=value=>createHmac('sha256',secret).update(value).digest('hex');
 const actor=input.actor?.id||null;
 const mode=input.actor?.mode||'PUBLIC';
 const note=input.note||'';
 return dbRpc('create_grace_request_atomic',{
  p_key:hash((actor||'public')+':'+input.idempotencyKey),
  p_fingerprint:hash(JSON.stringify({actor,mode,action:input.action,contact,note})),
  p_actor:actor,p_mode:mode,p_action:input.action,p_contact:contact,p_note:note,
 });
}
