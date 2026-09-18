import { authToken, restInsert, restSelect, requireEnv, syntheticId, supabaseConfig } from './lib.mjs';
requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const password=process.env.STAGING_TEST_PASSWORD, domain=process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test', prefix=process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage';
const token=await authToken(`${prefix}+admissions@${domain}`,password);
const {baseUrl,anonKey}=supabaseConfig();
async function userFetch(path,{method='GET',body}={}){const res=await fetch(`${baseUrl}${path}`,{method,headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});const text=await res.text();return{res,text};}
const deny=async(p,label)=>{const r=await p;if(r.res.status<400)throw new Error(`${label} unexpectedly succeeded (${r.res.status})`);};
const admission=(await restInsert('admissions',{reference:syntheticId('BYPASS'),enquiry_name:'Synthetic Direct Write Guard',source:'staging-certification',stage:'enquiry'}))[0];
await deny(userFetch(`/rest/v1/admissions?id=eq.${admission.id}`,{method:'PATCH',body:{stage:'screening'}}),'direct admission stage write');
const after=(await restSelect('admissions',`id=eq.${admission.id}&select=stage`))[0];if(after.stage!=='enquiry')throw new Error('Denied admission bypass mutated state.');
const rpcRes=await userFetch('/rest/v1/rpc/transition_recovery_journey',{method:'POST',body:{p_admission_id:admission.id,p_to:'screening',p_expected_from:'enquiry',p_reason:'Direct-write guard positive control'}});if(rpcRes.res.status!==200)throw new Error(`Journey Authority positive control failed (${rpcRes.res.status}): ${rpcRes.text}`);
const flow=(await restSelect('workflow_instances',`entity_type=eq.admission&entity_id=eq.${admission.id}&workflow_key=eq.recovery_journey&select=id,current_state,status`))[0];if(!flow)throw new Error('Recovery workflow fixture missing.');
await deny(userFetch(`/rest/v1/workflow_instances?id=eq.${flow.id}`,{method:'PATCH',body:{current_state:'closed'}}),'direct recovery workflow state write');
const task=(await restSelect('workflow_tasks',`workflow_instance_id=eq.${flow.id}&select=id,status&limit=1`))[0];if(task)await deny(userFetch(`/rest/v1/workflow_tasks?id=eq.${task.id}`,{method:'PATCH',body:{status:'completed'}}),'direct recovery task write');
const audit=(await restSelect('audit_log',`entity_id=eq.${admission.id}&action=eq.graceflow_transition&select=id,reason&limit=1`))[0];if(!audit)throw new Error('Journey audit fixture missing.');
await deny(userFetch(`/rest/v1/audit_log?id=eq.${audit.id}`,{method:'PATCH',body:{reason:'forged'}}),'audit evidence rewrite');
await deny(userFetch(`/rest/v1/audit_log?id=eq.${audit.id}`,{method:'DELETE'}),'audit evidence deletion');
console.log('Journey direct-write bypass PASS: lifecycle state, recovery workflow/task truth and historical audit evidence cannot be mutated directly; authoritative RPC remains functional.');
