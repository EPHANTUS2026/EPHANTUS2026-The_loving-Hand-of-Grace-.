const required={
  tables:['profiles','clients','staff','workflow_instances','workflow_events','workflow_tasks','audit_log','knowledge_articles','knowledge_approvals','meditations','meditation_review_events','booking_types','booking_staff_pool','staff_availability','booking_slot_holds','booking_requests','booking_events','notification_outbox','grace_response_feedback','saved_grace_responses'],
  rpc:[
    {name:'get_available_booking_slots',args:{p_booking_type:'00000000-0000-0000-0000-000000000000',p_from:'2099-01-01',p_to:'2099-01-01'}},
    {name:'hold_booking_slot',args:{p_booking_type:'00000000-0000-0000-0000-000000000000',p_staff:'00000000-0000-0000-0000-000000000000',p_start:'2099-01-01T09:00:00Z',p_end:'2099-01-01T10:00:00Z',p_format:'phone',p_booked_for:'self',p_hold_token_hash:'schema-contract-probe'}},
    {name:'confirm_booking_slot',args:{p_hold_id:'00000000-0000-0000-0000-000000000000',p_hold_token_hash:'schema-contract-probe',p_first_name:'Schema',p_last_name:'Probe',p_phone:'+254700000000',p_email:null,p_preferred_contact_method:'phone',p_consent_version:'schema-contract',p_manage_token_hash:'schema-contract-probe',p_idempotency_key:'schema-contract-probe'}},
    {name:'publish_meditation_if_approved',args:{p_meditation:'00000000-0000-0000-0000-000000000000',p_actor:'00000000-0000-0000-0000-000000000000'}},
    {name:'search_grace_approved_knowledge',args:{p_query:'production assurance',p_limit:1}}
  ]
};
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Schema verification requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');process.exit(1);}
const PROBE_TIMEOUT_MS=10000;
async function probeFetch(input,init={}){return fetch(input,{...init,signal:AbortSignal.timeout(PROBE_TIMEOUT_MS)});}
async function checkTable(name){try{const r=await probeFetch(`${url}/rest/v1/${name}?select=*&limit=0`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});if(!r.ok){console.error(`Schema probe table ${name} HTTP ${r.status}: ${(await r.text()).slice(0,240)}`);}return r.ok;}catch(error){console.error(`Schema probe table ${name} failed: ${error.name||'Error'} ${error.message||''}`);return false;}}
async function checkRpc({name,args}){
  try {
    const r=await probeFetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
    if(r.status!==404)return true;
    const text=await r.text();
    return !/Could not find the function|PGRST202|PGRST204/i.test(text);
  } catch(error) {
    console.error(`Schema probe RPC ${name} failed: ${error.name||'Error'}`);
    return false;
  }
}
const missing=[];
for(const t of required.tables){if(!(await checkTable(t))) missing.push(`table:${t}`);}
for(const fn of required.rpc){if(!(await checkRpc(fn))) missing.push(`rpc:${fn.name}`);}
if(missing.length){console.error('Production schema contract FAILED:',missing.join(', '));process.exit(1);}
console.log(`Production schema contract PASS (${required.tables.length} tables, ${required.rpc.length} RPC contracts).`);
