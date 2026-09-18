import assert from 'node:assert/strict';
import { authToken, restSelect, restInsert, restUpdate, requireEnv } from './lib.mjs';

requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const base=process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password=process.env.STAGING_TEST_PASSWORD;
const domain=process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test';
const prefix=process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage';
const email=(suffix)=>`${prefix}+${suffix}@${domain}`;

async function req(token,table,query='',method='GET',body){
 const r=await fetch(`${base}/rest/v1/${table}?${query}`,{method,headers:{apikey:anonKey,Authorization:`Bearer ${token||anonKey}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}
 return {ok:r.ok,status:r.status,data,text};
}
const rows=(r)=>Array.isArray(r.data)?r.data:[];
const expectNoRows=(r,label)=>{if(!r.ok&&[401,403].includes(r.status))return;assert.equal(r.ok,true,`${label}: unexpected ${r.status} ${r.text}`);assert.equal(rows(r).length,0,`${label}: authority boundary crossed`)};
const expectDeniedMutation=(r,label)=>assert.ok(!r.ok||rows(r).length===0,`${label}: mutation unexpectedly succeeded`);

const clients=await restSelect('profiles','role=eq.client&full_name=in.(Synthetic%20Client%20A,Synthetic%20Client%20B)&select=id,auth_user_id,client_id,full_name,role,staff_id,family_member_id');
assert.equal(clients.length,2,'Synthetic Client A/B missing');
const A=clients.find(x=>x.full_name.endsWith('A')),B=clients.find(x=>x.full_name.endsWith('B'));
const aToken=await authToken(email('client-a'),password),bToken=await authToken(email('client-b'),password);
const staff=(await restSelect('profiles','role=eq.counsellor&select=id,auth_user_id,staff_id,role&limit=1'))[0];
assert.ok(staff?.staff_id,'Synthetic counsellor missing');
const staffToken=await authToken(email('counsellor'),password);

// 1 anonymous -> client/staff/clinical
expectNoRows(await req(null,'clients',`id=eq.${A.client_id}&select=id`),'anonymous -> client');
expectNoRows(await req(null,'staff',`id=eq.${staff.staff_id}&select=id`),'anonymous -> staff');
expectNoRows(await req(null,'care_plans',`client_id=eq.${A.client_id}&select=id`),'anonymous -> care plan');

// 2 Client A -> Client B and client -> staff
expectNoRows(await req(aToken,'clients',`id=eq.${B.client_id}&select=id`),'Client A -> Client B');
expectNoRows(await req(aToken,'profiles',`client_id=eq.${B.client_id}&select=id`),'Client A -> Client B profile');
expectNoRows(await req(aToken,'staff',`id=eq.${staff.staff_id}&select=id`),'client -> staff');

// 3 profile/role forgery and staff escalation
expectDeniedMutation(await req(aToken,'profiles',`id=eq.${A.id}`,'PATCH',{role:'super_admin',staff_id:staff.staff_id}),'client profile/role forgery');
expectDeniedMutation(await req(staffToken,'profiles',`id=eq.${staff.id}`,'PATCH',{role:'super_admin'}),'staff role escalation');

// 4 clinical-data isolation: direct client access to confidential care plans/sessions must be absent.
expectNoRows(await req(aToken,'care_plans',`client_id=eq.${A.client_id}&select=id,confidential_clinical_context`),'client -> confidential care plan');
expectNoRows(await req(aToken,'care_sessions',`client_id=eq.${A.client_id}&select=id,clinical_note`),'client -> clinical session note');
expectNoRows(await req(bToken,'care_plans',`client_id=eq.${A.client_id}&select=id`),'Client B -> Client A clinical data');

// 5 family authority matrix. Create synthetic linked/unrelated/revoked identities only if already provisioned.
const families=await restSelect('profiles','role=eq.family&select=id,auth_user_id,family_member_id,full_name&order=created_at.asc');
if(families.length>=2){
 const F=families[0],Other=families[1];
 const fm=(await restSelect('family_members',`id=eq.${F.family_member_id}&select=id,client_id,consent_active`))[0];
 const om=(await restSelect('family_members',`id=eq.${Other.family_member_id}&select=id,client_id`))[0];
 const slug=(n)=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const fToken=await authToken(email(slug(F.full_name)),password);
 expectNoRows(await req(fToken,'family_members',`id=eq.${Other.family_member_id}&select=id`),'family -> unrelated family');
 expectNoRows(await req(fToken,'clients',`id=eq.${om.client_id}&select=id`),'family -> unrelated client');
 if(fm.consent_active===false) expectNoRows(await req(fToken,'clients',`id=eq.${fm.client_id}&select=id`),'revoked family consent -> client');
} else {
 console.log('INFO family matrix requires >=2 synthetic family identities; provisioning extension will enforce this in CI.');
}
console.log('Identity authority matrix PASS: anonymous, cross-client, client->staff, escalation/forgery and clinical isolation boundaries hold.');
