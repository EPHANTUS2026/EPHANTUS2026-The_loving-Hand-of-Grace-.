import assert from 'node:assert/strict';import {authToken,appFetch,requireEnv} from './lib.mjs';
requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','STAGING_BASE_URL']);const password=process.env.STAGING_TEST_PASSWORD,domain=process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test',prefix=process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage',email=s=>`${prefix}+${s}@${domain}`;
const anonymous=await appFetch('/staff/operations');assert.ok([302,303,307,308].includes(anonymous.res.status),'anonymous Operations Centre must redirect/deny');
for(const who of ['client-a','family-a','family-revoked']){const token=await authToken(email(who),password);const r=await appFetch('/staff/operations',{token});assert.ok([302,303,307,308,401,403].includes(r.res.status),`${who} Operations Centre must deny/redirect, got ${r.res.status}`);}
for(const who of ['counsellor']){const token=await authToken(email(who),password);const r=await appFetch('/staff/operations',{token});assert.equal(r.res.status,200,`${who} Operations Centre must ALLOW`);assert.match(r.text,/Operational Health|Care Operations Centre/,`${who} did not receive Operations Centre`);}
console.log('Operational Health adversarial route authority PASS: anonymous/client/family denied; authorised care staff allowed.');

for(const who of [null,'client-a','family-a','family-revoked','finance']){const token=who?await authToken(email(who),password):null;const r=await appFetch('/api/operations/health',{token});assert.equal(r.res.status,403,`${who||'anonymous'} health API must deny`);}
