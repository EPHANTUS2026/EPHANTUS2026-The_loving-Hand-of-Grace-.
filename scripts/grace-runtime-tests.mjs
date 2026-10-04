import assert from 'node:assert/strict';
import { sealConversation,openConversation } from '../lib/grace/conversation.mjs';
import { generateGraceAnswer,providerReady } from '../lib/grace/model-provider.mjs';
import { validateFinalAnswer } from '../lib/grace/final-answer.mjs';
const secret='synthetic-only-'.repeat(4);
const turns=[{user:'My brother needs support',assistant:'What would help you most?'}];
const token=sealConversation(turns,'owner-a',secret,1000);
assert.deepEqual(openConversation(token,'owner-a',secret,1001),turns);
assert.ok(!token.includes('brother'));
assert.throws(()=>openConversation(token,'owner-b',secret,1001));
assert.throws(()=>openConversation(token,'owner-a',secret,1900000));
assert.throws(()=>openConversation(token.slice(0,-8)+'tampered','owner-a',secret,1001));
assert.equal(openConversation(sealConversation(Array(20).fill(turns[0]),'a',secret),'a',secret).length,8);
assert.equal(providerReady({}),false);
let called=0;
assert.equal((await generateGraceAnswer({message:'hi',env:{},fetcher:()=>{called++;}})).status,'disabled');
assert.equal(called,0);
const env={GRACE_MODEL_ENABLED:'true',GRACE_EXTERNAL_PROCESSING_APPROVED:'true',OPENAI_API_KEY:'synthetic',GRACE_MODEL:'test-model'};
const sources=[{id:'s1',title:'Approved example',text:'An assessment is required.'}];
let output={answer:'An assessment is required.',sourceIds:['s1'],needsHuman:false};
const fetcher=async(url,options)=>{
 assert.equal(url,'https://api.openai.com/v1/responses');
 const body=JSON.parse(options.body);
 assert.match(body.instructions,/Never promise absolute confidentiality/);
 assert.match(body.instructions,/Do not ask the same question again/);
 assert.match(body.instructions,/Respect refusal/);
 assert.match(body.instructions,/Do not offer WhatsApp delivery, bed checks/);
 assert.equal(body.store,false); assert.equal(body.text.format.strict,true);
 assert.equal(options.redirect,'error');
 assert.deepEqual(JSON.parse(body.input[0].content).conversation,turns);
 return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]})};
};
assert.equal((await generateGraceAnswer({message:'What about him?',turns,sources,env,fetcher})).status,'generated');
output={...output,sourceIds:['invented']};
assert.equal((await generateGraceAnswer({message:'hi',turns,sources,env,fetcher})).status,'invalid');
assert.equal((await generateGraceAnswer({message:'hi',env,fetcher:async()=>{throw new Error('provider details must not escape');}})).status,'unavailable');
assert.equal((await generateGraceAnswer({message:'hi',env,fetcher:async()=>({ok:false})})).status,'unavailable');
for(const answer of ['I have booked your appointment.','You are booked.','Take 20 mg.','Guaranteed recovery.','Visit https://evil.example']){
 assert.equal(validateFinalAnswer({answer}).result,'BLOCK');
}
assert.equal(validateFinalAnswer({answer:'A claim',needsSources:true}).result,'BLOCK');
assert.equal(validateFinalAnswer({answer:'An assessment is required.',sourceIds:['s1'],sources,needsSources:true}).result,'PASS');
console.log('PASS encrypted context ownership/expiry/tampering, bounded history, provider gates, structured output, outages and final-answer checks');

for(const answer of ['Everything is 100% confidential.','Only our clinical team will see it.','I am connecting you to our counsellor now.']) assert.equal(validateFinalAnswer({answer}).result,'BLOCK');

const {orchestrateGrace}=await import('../lib/grace/orchestrator.js');
const {classifySafety}=await import('../lib/grace/safety.js');
for(const message of ['I want to die','nataka kujiua','hapumui']) assert.equal(classifySafety(message).level,'EMERGENCY');
assert.match(orchestrateGrace({message:'my brother needs help'}).answer,/your brother/);
assert.equal(orchestrateGrace({message:'people will judge me'}).intent,'EMOTIONAL_SUPPORT');
console.log('PASS intake privacy/handoff guard, relation, shame and bilingual crisis regressions');
