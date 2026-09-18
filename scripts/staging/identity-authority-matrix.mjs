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

// 5 mandatory family authority matrix.
const families=await restSelect('profiles','role=eq.family&full_name=in.(Synthetic%20Family%20A,Synthetic%20Family%20B,Synthetic%20Family%20Revoked)&select=id,auth_user_id,family_member_id,full_name');
assert.equal(families.length,3,'Family A/B/revoked synthetic identities are mandatory');
const familyA=families.find(x=>x.full_name==='Synthetic Family A');
const familyB=families.find(x=>x.full_name==='Synthetic Family B');
const revoked=families.find(x=>x.full_name==='Synthetic Family Revoked');
for(const x of [familyA,familyB,revoked])assert.ok(x?.family_member_id,`${x?.full_name||'family'} missing family_member linkage`);
const fA=(await restSelect('family_members',`id=eq.${familyA.family_member_id}&select=id,client_id,consent_active`))[0];
const fB=(await restSelect('family_members',`id=eq.${familyB.family_member_id}&select=id,client_id,consent_active`))[0];
const fR=(await restSelect('family_members',`id=eq.${revoked.family_member_id}&select=id,client_id,consent_active`))[0];
assert.equal(fA.consent_active,true);assert.equal(fB.consent_active,true);assert.equal(fR.consent_active,false);
const fAToken=await authToken(email('family-a'),password),fBToken=await authToken(email('family-b'),password),revokedToken=await authToken(email('family-revoked'),password);
expectNoRows(await req(fAToken,'family_members',`id=eq.${familyB.family_member_id}&select=id`),'Family A -> unrelated Family B');
expectNoRows(await req(fAToken,'clients',`id=eq.${fB.client_id}&select=id`),'Family A -> unrelated Client B');
expectNoRows(await req(fBToken,'clients',`id=eq.${fA.client_id}&select=id`),'Family B -> unrelated Client A');
expectNoRows(await req(revokedToken,'clients',`id=eq.${fR.client_id}&select=id`),'revoked family consent -> linked client');
expectNoRows(await req(revokedToken,'family_updates',`family_member_id=eq.${revoked.family_member_id}&select=id`),'revoked family consent -> family updates');
console.log('Identity authority matrix PASS: anonymous, cross-client, client->staff, escalation/forgery and clinical isolation boundaries hold.');
