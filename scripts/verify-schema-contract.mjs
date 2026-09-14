const required={
  tables:['profiles','clients','staff','workflow_instances','workflow_events','workflow_tasks','audit_log','knowledge_articles','knowledge_approvals','meditations','meditation_review_events','booking_types','booking_staff_pool','staff_availability','booking_slot_holds','booking_requests','booking_events','notification_outbox','grace_response_feedback','saved_grace_responses'],
  rpc:['get_available_booking_slots','hold_booking_slot','confirm_booking_slot','publish_meditation_if_approved','search_grace_approved_knowledge']
};
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Schema verification requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');process.exit(1);}
async function checkTable(name){const r=await fetch(`${url}/rest/v1/${name}?select=*&limit=0`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});return r.ok;}
const missing=[];
for(const t of required.tables){if(!(await checkTable(t))) missing.push(`table:${t}`);}
for(const fn of required.rpc){
  const body=fn==='search_grace_approved_knowledge'?JSON.stringify({p_query:'production assurance',p_limit:1}):'{}';
  const r=await fetch(`${url}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body});
  if(r.status===404) missing.push(`rpc:${fn}`);
}
if(missing.length){console.error('Production schema contract FAILED:',missing.join(', '));process.exit(1);}
console.log(`Production schema contract PASS (${required.tables.length} tables, ${required.rpc.length} RPC contracts).`);
