import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEnquiry } from '../lib/contact-validation.mjs';
const valid = { name: 'Synthetic enquiry', phone: '+254700000001', email: '', service: 'general', consent: 'yes', website: '', submissionId: '9cd0e3dd-d70a-4c59-a3db-f42a9cf8f369' };
assert.ok(validateEnquiry(valid));
for (const change of [{name:''},{name:'x'.repeat(121)},{phone:'abc'},{email:'bad'},{service:'constructor'},{consent:'no'},{message:'private information'},{role:'admin'},{submissionId:'invalid'},{name:{}}]) {
  assert.equal(validateEnquiry({...valid,...change}), null);
}
for (const body of [null,[],true,'text']) assert.equal(validateEnquiry(body), null);
let calls = 0;
let rpcResult = {status:'accepted'};
const source = (await readFile(new URL('../app/api/contact/route.js',import.meta.url),'utf8'))
 .replace("import { dbRpc } from '@/lib/supabase-rest';", 'const dbRpc = (...args) => globalThis.__contactTestRpc(...args);')
 .replace("from '@/lib/contact-validation.mjs'", "from '" + new URL('../lib/contact-validation.mjs',import.meta.url).href + "'");
globalThis.__contactTestRpc = async () => { calls++; return rpcResult; };
const { POST } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-test-only';
const request = (body=valid, origin='https://lhg.test') => new Request('https://lhg.test/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
assert.equal((await POST(request(valid,'https://other.test'))).status,403);
assert.equal((await POST(request({...valid,message:'forbidden'}))).status,400);
assert.equal((await POST(request({...valid,name:'x'.repeat(5000)}))).status,413);
assert.equal((await POST(request({...valid,website:'spam'}))).status,200);
assert.equal(calls,0);
const success = await POST(request());
assert.equal(success.status,201);
assert.deepEqual(await success.json(),{ok:true});
assert.equal(success.headers.get('cache-control'),'no-store');
rpcResult={status:'limited'}; assert.equal((await POST(request())).status,429);
rpcResult={status:'conflict'}; assert.equal((await POST(request())).status,409);
rpcResult=null; assert.equal((await POST(request())).status,503);
delete globalThis.__contactTestRpc;
console.log('PASS enquiry validation, origin, size limit, honeypot, privacy, quota and retry responses');
