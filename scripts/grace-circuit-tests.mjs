import assert from 'node:assert/strict';
import { createProviderCircuit } from '../lib/grace/provider-circuit.mjs';
import { generateGraceAnswer } from '../lib/grace/model-provider.mjs';

let time = 1000;
const circuit = createProviderCircuit({now:()=>time});
const stale = circuit.acquire();
for (let n=0;n<3;n++) circuit.acquire().finish('failure');
assert.equal(circuit.acquire(),null);
stale.finish('success'); // In-flight success cannot reopen a tripped circuit.
assert.equal(circuit.acquire(),null);
time += 30000;
const probe = circuit.acquire();
assert.ok(probe);
assert.equal(circuit.acquire(),null); // Single recovery probe per process.
probe.finish('cancelled');
const retry = circuit.acquire();
retry.finish('failure');
assert.equal(circuit.acquire(),null);
time += 30000;
circuit.acquire().finish('success');
assert.ok(circuit.acquire());

const env = {GRACE_MODEL_ENABLED:'true',GRACE_EXTERNAL_PROCESSING_APPROVED:'true',OPENAI_API_KEY:'synthetic',GRACE_MODEL:'synthetic'};
const isolated = createProviderCircuit({threshold:1,now:()=>time});
let calls=0;
const fetcher=async()=>{calls++; throw new Error('synthetic outage');};
assert.equal((await generateGraceAnswer({message:'hello',env,fetcher,circuit:isolated})).status,'unavailable');
assert.equal((await generateGraceAnswer({message:'hello',env,fetcher,circuit:isolated})).status,'circuit_open');
assert.equal(calls,1);
assert.equal((await generateGraceAnswer({message:'hello',env:{},fetcher,circuit:isolated})).status,'disabled');
time += 30000;
const controller=new AbortController();
const cancelled=await generateGraceAnswer({message:'hello',env,circuit:isolated,signal:controller.signal,
 fetcher:async()=>{controller.abort();throw new Error('cancelled');}});
assert.equal(cancelled.status,'cancelled');
assert.ok(isolated.acquire());
console.log('PASS outage suppression, cooldown, single probe, stale results, cancellation and disabled-provider gates');
