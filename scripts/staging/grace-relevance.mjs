import assert from 'node:assert/strict';
import {appFetch,requireEnv} from './lib.mjs';
requireEnv(['STAGING_BASE_URL']);
const origin=new URL(process.env.STAGING_BASE_URL).origin;
let cookie='',conversationToken=null;
async function ask(message){
 const {res,body}=await appFetch('/api/grace/chat',{method:'POST',json:{message,modelConsent:false,conversationToken},headers:{origin,...(cookie?{Cookie:cookie}:{})}});
 assert.equal(res.status,200);
 const set=res.headers.get('set-cookie');if(set)cookie=set.match(/lhg_grace_browser=[^;]+/)?.[0]||cookie;
 conversationToken=body.conversationToken||conversationToken;
 return body;
}
for(const text of ['am anxious',"I'm anxious",'anxious']){
 const r=await ask(text);assert.equal(r.intent,'EMOTIONAL_SUPPORT');assert.match(r.answer,/anxious/);assert.match(r.answer,/three things/);assert.doesNotMatch(r.answer,/not completely sure|source material/);
}
assert.match((await ask('Try a grounding exercise')).answer,/three things/);
assert.match((await ask('What services does the Centre offer?')).answer,/Residential Rehabilitation/);
assert.match((await ask('mko wapi')).answer,/Joska/);
assert.match((await ask('How much does it cost?')).answer,/cannot quote/);
await ask('My brother needs help');assert.ok(conversationToken,'Bounded encrypted session context must be enabled.');
assert.match((await ask('yes')).answer,/Residential Rehabilitation/);
assert.match((await ask('What about him?')).answer,/your brother/);
const urgent=await ask('I want to die');assert.equal(urgent.safetyLevel,'EMERGENCY');
console.log('PASS live exact anxiety phrases, grounding, public facts, Kiswahili, fees, encrypted contextual follow-ups and emergency precedence');
