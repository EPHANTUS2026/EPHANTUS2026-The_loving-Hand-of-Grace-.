import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const source=(await readFile(new URL('lib/notifications/outbox-worker.js',root),'utf8')).replace(/^import .*;\n/gm,'').replace('export async function','async function');
const bind=new Function('dbAdminSelect','dbInsert','dbUpdate','sendThroughConnector','notificationsMode',source+'\nreturn processNotificationOutbox;');
const seed=()=>({id:'synthetic',channel:'email',recipient:'approved@example.test',template_key:'approved',payload:{to:'forged@example.test',provider_template:'forged'},status:'queued',attempt:0,max_attempts:2});
let row,deliveries,calls,mode='test',response,throws=false,failInsert=false;
const reset=()=>{row=seed();deliveries=[];calls=0;response={ok:true,status:'accepted',provider:'synthetic',providerReference:'ref'};throws=false;failInsert=false;};
const select=async(table,query)=>{
 if(table==='notification_templates')return [{template_key:'approved',body:'Approved notice',subject:'Notice',contains_sensitive_content:false}];
 assert.ok(query.includes('status=eq.queued')); assert.ok(!query.includes('retry'));
 return row.status==='queued'?[{...row}]:[];
};
const update=async(_table,query,patch)=>{
 const expected=query.includes('status=eq.queued')?'queued':'sending';
 if(row.status!==expected||!query.endsWith('attempt=eq.'+row.attempt))return [];
 Object.assign(row,patch);return [{...row}];
};
const insert=async(_table,value)=>{if(failInsert)throw new Error('receipt unavailable');deliveries.push(value);};
const send=async(_channel,payload)=>{calls++;assert.equal(payload.to,'approved@example.test');if(throws)throw new Error('private provider text');return response;};
const worker=bind(select,insert,update,send,()=>mode);
reset();
const outcomes=await Promise.all([worker(),worker()]);
assert.equal(calls,1);assert.equal(row.status,'sending');assert.equal(row.attempt,1);
assert.equal(outcomes.reduce((n,x)=>n+x.accepted,0),1);assert.equal(deliveries[0].status,'accepted');
await worker();assert.equal(calls,1,'Accepted messages must not be resent');
reset();throws=true;
assert.equal((await worker()).ambiguous,1);assert.equal(row.last_error,'dispatch_outcome_unknown');
await worker();assert.equal(calls,1,'Unknown send outcomes require reconciliation');
reset();response={ok:false,retryable:true,errorCode:'http_503'};
assert.equal((await worker()).ambiguous,1);await worker();assert.equal(calls,1,'Provider 5xx must not trigger blind resend');
reset();response=undefined;
assert.equal((await worker()).ambiguous,1);await worker();assert.equal(calls,1,'Malformed send response requires reconciliation');
reset();response={ok:false,retryable:true,errorCode:'provider_unavailable'};
await worker();assert.equal(row.status,'queued');await worker();assert.equal(row.status,'dead_letter');assert.equal(row.attempt,2);
reset();response={ok:false,retryable:false,errorCode:'private payload must not persist'};
await worker();assert.equal(row.last_error,'delivery_failed');assert.equal(row.status,'dead_letter');
reset();failInsert=true;
await assert.rejects(worker(),/receipt unavailable/);await worker();assert.equal(calls,1);
reset();mode='disabled';assert.equal((await worker()).disabled,true);assert.equal(calls,0);assert.equal(row.status,'queued');mode='test';
await assert.rejects(bind(async()=>{throw new Error('database unavailable');},insert,update,send,()=>mode)(),/database unavailable/);
for(const file of ['lib/notification-delivery.js','lib/notifications/process-outbox.js']){
 assert.match(await readFile(new URL(file,root),'utf8'),/outbox-worker/,'Both entry points must share the worker');
}
console.log('Notification checks PASS: shared worker, atomic concurrency, acceptance distinction, ambiguous-send hold, exhaustion, redaction, receipt failure, disabled mode');
