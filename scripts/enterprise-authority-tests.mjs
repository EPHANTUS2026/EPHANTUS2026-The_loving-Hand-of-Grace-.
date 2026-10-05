import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const catalogueSource=(await readFile(new URL('../lib/graceflow-enterprise.js',import.meta.url),'utf8'))
 .replace("import { dbSelect, dbRpc } from './supabase-rest';",'const dbSelect=()=>[];const dbRpc=(...args)=>globalThis.__enterpriseRpc(...args);');
const catalogue=await load(catalogueSource);
let session={token:'trusted-synthetic-token',profile:{is_active:true,staff_id:'synthetic-staff',role:'procurement'}};
let permitted=true,created=0,calls=[];
globalThis.__enterpriseRpc=async(name,args,options)=>{
 calls.push({name,args,options});assert.equal(options.admin,false);assert.equal(options.token,session.token);
 if(name==='enterprise_authority')return permitted;
 if(name==='create_enterprise_record'){created++;return {ok:true,record:{id:'synthetic-record'},workflow_id:'synthetic-flow'};}
 throw new Error('Unexpected RPC');
};
globalThis.__enterpriseSession=()=>session;
globalThis.__enterpriseCatalogue=catalogue.moduleMap;
globalThis.__enterpriseResponse={json:(data,options={})=>new Response(JSON.stringify(data),{status:options.status||200,headers:options.headers}),redirect:(url,status)=>new Response(null,{status,headers:{location:String(url)}})};
const source=(await readFile(new URL('../app/api/graceflow/records/route.js',import.meta.url),'utf8'))
 .replace("import { NextResponse } from 'next/server';",'const NextResponse=globalThis.__enterpriseResponse;')
 .replace("import { getSession, dbRpc } from '@/lib/supabase-rest';",'const getSession=async()=>globalThis.__enterpriseSession();const dbRpc=(...args)=>globalThis.__enterpriseRpc(...args);')
 .replace("import { moduleMap } from '@/lib/graceflow-enterprise';",'const moduleMap=globalThis.__enterpriseCatalogue;');
const {POST}=await load(source);
const req=(body,origin='https://lhg.test')=>new Request('https://lhg.test/api/graceflow/records',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
for(const m of catalogue.enterpriseModules){
 const valid={module:m.key,record_type:m.types[0],title:'Synthetic authority fixture'};
 assert.equal((await POST(req(valid))).status,201);
 const before=created;permitted=false;
 assert.equal((await POST(req(valid))).status,403);assert.equal(created,before);permitted=true;
}
const valid={module:'purchase',record_type:'purchase_request',title:'Synthetic authority fixture'};
for(const change of [{owner_staff_id:'forged'},{role:'super_admin'},{assigned_role:'procurement'},{profile_id:'forged'},{module:'constructor'},{amount:-1},{amount:'NaN'},{due_at:'invalid'},{title:''}])assert.equal((await POST(req({...valid,...change}))).status,400);
assert.equal((await POST(req(valid,'https://other.test'))).status,403);
assert.equal((await POST(req({...valid,details:'x'.repeat(17000)}))).status,413);
assert.equal((await POST(new Request('https://lhg.test/api/graceflow/records',{method:'POST',headers:{origin:'https://lhg.test','content-type':'application/json'},body:'{'}))).status,400);
session={...session,profile:{...session.profile,is_active:false}};assert.equal((await POST(req(valid))).status,403);
session={...session,profile:{is_active:true,role:'client'}};assert.equal((await POST(req(valid))).status,403);
session={token:'trusted-synthetic-token',profile:{is_active:true,staff_id:'synthetic-staff',role:'procurement'}};
globalThis.__enterpriseRpc=async()=>{throw new Error('synthetic confidential database failure');};
const failed=await POST(req(valid));assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('confidential'));
globalThis.__enterpriseRpc=async()=>false;
assert.deepEqual(await catalogue.enterprisePermissions('purchase',session.token),{read:false,create:false});
assert.deepEqual(await catalogue.enterprisePermissions('constructor',session.token),{read:false,create:false});
for(const key of ['__enterpriseRpc','__enterpriseSession','__enterpriseCatalogue','__enterpriseResponse'])delete globalThis[key];
console.log('PASS 13-module API allow/deny fixtures, forged inputs, inactive/client denial, user-token RPC, validation, error redaction and UI permission states. Database enforcement is not certified by these mocks.');
