const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Passport verification requires Supabase URL and service role key.');process.exit(1)}
const H={apikey:key,Authorization:`Bearer ${key}`};
const TIMEOUT_MS=10000;
async function probe(path){try{return await fetch(`${url}${path}`,{headers:H,signal:AbortSignal.timeout(TIMEOUT_MS)})}catch(error){console.error(`FAIL passport probe ${path}: ${error.name||'Error'}`);return null}}
const tables=['recovery_passport_reflections','passport_visibility_rules','passport_projection_events','recovery_journeys','recovery_milestones','care_goals','appointments','documents'];
let bad=0;
for(const t of tables){const r=await probe(`/rest/v1/${t}?select=*&limit=0`);if(!r||!r.ok){bad++;console.error(`FAIL table ${t}: ${r?.status||'network'}`)}else console.log(`PASS table ${t}`)}
const rules=await probe('/rest/v1/passport_visibility_rules?select=resource_type,visibility');
if(rules?.ok){const x=await rules.json();const clinical=x.find(r=>r.resource_type==='clinical_note');if(!clinical||clinical.visibility!=='CLINICAL_RESTRICTED'){bad++;console.error('FAIL clinical visibility boundary')}else console.log('PASS clinical visibility boundary')}else bad++;
if(bad)process.exit(1);console.log('Recovery Passport production contract PASS');
