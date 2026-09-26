import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('./staging/verify-deployment-identity.mjs',import.meta.url),'utf8');
const run=new (Object.getPrototypeOf(async function(){}).constructor)('process','fetch','console',source);
const env={STAGING_BASE_URL:'https://synthetic.example.test',EXPECTED_GIT_SHA:'a'.repeat(40),VERCEL_AUTOMATION_BYPASS_SECRET:'synthetic-only'};
const identity={app:'the-loving-hand-of-grace',supabaseRef:'rpszhpjmchirzzndasrb',gitSha:env.EXPECTED_GIT_SHA,gitRepo:'EPHANTUS2026-The_loving-Hand-of-Grace-.',gitOwner:'EPHANTUS2026'};
const check=body=>run({env},async (_url,options)=>{
  assert.equal(options.redirect,'error','Credential-bearing identity requests must reject redirects');
  return {ok:true,json:async()=>body};
},{log(){}});
await check(identity);
for(const field of Object.keys(identity)){
  await assert.rejects(check({...identity,[field]:'wrong-project-or-commit'}),/IDENTITY MISMATCH/);
  const missing={...identity};delete missing[field];
  await assert.rejects(check(missing),/IDENTITY MISMATCH/);
}
await assert.rejects(run({env},async()=>({ok:false,status:403}),{log(){}}),/HTTP 403/);
console.log('Deployment identity checks PASS: exact match, missing and mismatched fields denied, redirects prohibited, access failures denied');
