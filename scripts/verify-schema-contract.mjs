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
async function checkTable(name){
  const endpoint=`${url}/rest/v1/${name}?select=*&limit=0`;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const r=await fetch(endpoint,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
      if(r.ok)return true;
      const body=await r.text();
      const transient=r.status>=500||/PGRST002|schema cache|Retrying/i.test(body);
      if(!transient){console.error(`Schema probe failed for ${name}: HTTP ${r.status}`);return false;}
      console.warn(`Transient Supabase/PostgREST failure for ${name} (attempt ${attempt}/3, HTTP ${r.status}).`);
    }catch(e){
      console.warn(`Schema probe transport failure for ${name} (attempt ${attempt}/3): ${e?.message||'unknown error'}`);
    }
    if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*1500));
  }
  return false;
}
async function checkRpc({name,args}){
  const r=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
  if(r.status!==404)return true;
  const text=await r.text();
  return !/Could not find the function|PGRST202|PGRST204/i.test(text);
}
const missing=[];
for(const t of required.tables){if(!(await checkTable(t))) missing.push(`table:${t}`);}
for(const fn of required.rpc){if(!(await checkRpc(fn))) missing.push(`rpc:${fn.name}`);}
if(missing.length){console.error('Production schema contract FAILED:',missing.join(', '));process.exit(1);}
console.log(`Production schema contract PASS (${required.tables.length} tables, ${required.rpc.length} RPC contracts).`);
