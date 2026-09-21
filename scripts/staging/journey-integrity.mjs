import { appFetch, authToken, expectStatus, restSelect, restInsert, restUpdate, requireEnv, syntheticId, supabaseConfig } from './lib.mjs';

requireEnv(['STAGING_TEST_PASSWORD']);
const password=process.env.STAGING_TEST_PASSWORD, domain=process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test', prefix=process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage';
const tokenFor=(r)=>authToken(`${prefix}+${r.replaceAll('_','-')}@${domain}`,password);
const transition=async(token,id,to,from)=>{ const {baseUrl,anonKey}=supabaseConfig(); const res=await fetch(`${baseUrl}/rest/v1/rpc/transition_recovery_journey`,{method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${token||anonKey}`,'Content-Type':'application/json'},body:JSON.stringify({p_admission_id:id,p_to:to,p_expected_from:from,p_reason:'Synthetic journey integrity certification'})}); const text=await res.text(); let body=text; try{body=text?JSON.parse(text):null}catch{} return {res,body,text}; };
const mustDeny=(r,label)=>{if(r.res.status<400)throw new Error(`${label} unexpectedly succeeded (${r.res.status})`);};
const makeAdmission=async(stage='enquiry',extra={})=>(await restInsert('admissions',{reference:syntheticId('JOURNEY'),enquiry_name:'Synthetic Journey Integrity',source:'staging-certification',stage,...extra}))[0];

const admissions=await tokenFor('admissions'), counsellor=await tokenFor('counsellor'), clinician=await tokenFor('clinician'), finance=await tokenFor('finance'), client=await tokenFor('client-a');

// Anonymous and non-authoritative identities cannot transition.
let a=await makeAdmission(); mustDeny(await transition(null,a.id,'screening','enquiry'),'anonymous transition'); mustDeny(await transition(client,a.id,'screening','enquiry'),'client transition'); mustDeny(await transition(finance,a.id,'screening','enquiry'),'finance transition');

// Skipped stages and missing prerequisites are rejected without mutation/audit.
mustDeny(await transition(admissions,a.id,'assessment','enquiry'),'skipped enquiry→assessment');
let after=(await restSelect('admissions',`id=eq.${a.id}&select=stage`))[0]; if(after.stage!=='enquiry')throw new Error('Skipped-stage attempt mutated admission.');
let audits=await restSelect('audit_log',`entity_id=eq.${a.id}&action=eq.graceflow_transition&select=id`); if(audits.length)throw new Error('Denied transition wrote an audit event.');
expectStatus(await transition(admissions,a.id,'screening','enquiry'),200,'valid enquiry→screening');
mustDeny(await transition(admissions,a.id,'assessment','screening'),'assessment without screening summary');

// Role authority: counsellor cannot approve assessment.
await restUpdate('admissions',`id=eq.${a.id}`,{screening_summary:'Synthetic prerequisite only.'});
mustDeny(await transition(counsellor,a.id,'assessment','screening'),'counsellor assessment approval');
expectStatus(await transition(clinician,a.id,'assessment','screening'),200,'clinician assessment approval');

// Replay/stale state is rejected and does not duplicate audit evidence.
mustDeny(await transition(clinician,a.id,'assessment','screening'),'replayed assessment transition');
audits=await restSelect('audit_log',`entity_id=eq.${a.id}&action=eq.graceflow_transition&select=id,before_state,after_state`);
if(audits.length!==2)throw new Error(`Expected exactly 2 successful transition audits, found ${audits.length}`);

// Concurrency: exactly one request can acquire the row/state transition.
let race=await makeAdmission();
const [r1,r2]=await Promise.all([transition(admissions,race.id,'screening','enquiry'),transition(admissions,race.id,'screening','enquiry')]);
const successes=[r1,r2].filter(x=>x.res.status===200).length; if(successes!==1)throw new Error(`Concurrent transition expected exactly one success, got ${successes}`);
audits=await restSelect('audit_log',`entity_id=eq.${race.id}&action=eq.graceflow_transition&select=id`); if(audits.length!==1)throw new Error(`Concurrent transition expected one audit, found ${audits.length}`);
const flows=await restSelect('workflow_instances',`entity_type=eq.admission&entity_id=eq.${race.id}&select=id,current_state`); if(flows.length!==1||flows[0].current_state!=='screening')throw new Error('Concurrent transition produced inconsistent workflow state.');

// Clinical discharge/aftercare boundary: aftercare requires approved_by + approved_at, not status text alone.
const syntheticClients=await restSelect('clients',`legal_name=ilike.${encodeURIComponent('SYNTHETIC%')}&select=id,legal_name`); let clientRow=null;
for(const candidate of syntheticClients){ const existing=(await restSelect('discharge_plans',`client_id=eq.${candidate.id}&select=id`))[0]; if(!existing){clientRow=candidate;break;} }
if(!clientRow){
  const created=await restInsert('clients',{legal_name:`SYNTHETIC Journey Integrity ${syntheticId('CLIENT')}`,status:'active'});
  clientRow=created[0];
}
let d=await makeAdmission('discharge',{client_id:clientRow.id});
await restInsert('discharge_plans',{client_id:clientRow.id,status:'approved',readiness_summary:'Synthetic status-only approval'});
await restInsert('aftercare_plans',{client_id:clientRow.id,status:'active'});
mustDeny(await transition(clinician,d.id,'aftercare','discharge'),'aftercare without attributable clinical approval');
after=(await restSelect('admissions',`id=eq.${d.id}&select=stage`))[0]; if(after.stage!=='discharge')throw new Error('Failed clinical approval gate partially mutated admission.');

console.log('GraceFlow journey integrity PASS: anonymous/client/finance denial, skipped-stage and prerequisite gates, clinical role authority, replay protection, concurrent serialization, atomic audit consistency and attributable discharge approval hold.');
