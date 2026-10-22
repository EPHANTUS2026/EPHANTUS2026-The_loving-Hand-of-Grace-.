import assert from 'node:assert/strict';
import {authToken, appFetch, requireEnv} from './lib.mjs';
import {project} from '../../lib/operational-health-projection.mjs';
requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','STAGING_BASE_URL']);
const email=`${process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage'}+counsellor@${process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test'}`;
const token=await authToken(email,process.env.STAGING_TEST_PASSWORD);
async function rows(table,select) {
 const data=[];
 for(let offset=0;;) {
  const r=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=${select}&order=id.asc&limit=500&offset=${offset}`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`}});
  assert.equal(r.ok,true,`${table} authorised source read failed: ${r.status}`);
  const page=await r.json();assert.ok(Array.isArray(page));data.push(...page);if(!page.length)return data;offset+=page.length;
 }
}
const [admissions,consents,aftercare,tasks,requests]=await Promise.all([
 rows('admissions','id,reference,stage,assigned_staff_id,next_action_due'),
 rows('consents','id,client_id,consent_type,status,expires_at,revoked_at'),
 rows('aftercare_plans','id,client_id,status,next_review_at,assigned_staff_id'),
 rows('workflow_tasks','id,title,status,due_at,assigned_staff_id,payload'),
 rows('client_support_requests','id,subject,status,priority,response_due_at,first_responded_at'),
]);
const actual=await appFetch('/api/operations/health',{token});assert.equal(actual.res.status,200,actual.text);
assert.match(actual.res.headers.get('cache-control')||'',/no-store/);
const expected=project({admissions,consents,aftercare,tasks,requests},Date.parse(actual.body.generatedAt));
for(const key of ['state','admissions','consents','aftercare','tasks','requests','exceptions','queues'])assert.deepEqual(actual.body[key],expected[key],`deployed ${key} must reconcile with caller-authorised source records`);
for(const [queue,title] of Object.entries({consent:'Consent review queue',aftercare:'Aftercare review queue',exceptions:'Exceptions and escalations'})) {
 const page=await appFetch(`/staff/operations?queue=${queue}`,{token});assert.equal(page.res.status,200);assert.ok(page.text.includes(`aria-label="${title}"`),`${queue} queue did not render`);
}
console.log('Operational Health deployed projection and queue reconciliation PASS');
