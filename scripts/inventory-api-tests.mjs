import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateInventory} from '../lib/inventory-validation.mjs';
let session={token:'synthetic-token',profile:{is_active:true,staff_id:'synthetic-staff'}},failure='',calls=0;
globalThis.__inventorySession=()=>session;globalThis.__inventoryValidate=validateInventory;
globalThis.__inventoryRPC=async(name,args,opts)=>{calls++;assert.equal(opts.admin,false);assert.equal(opts.token,session.token);if(failure)throw Error(failure);return name==='inventory_import'?{ok:true,status:'pending_approval',receipts:[{receipt_id:'synthetic-receipt'}]}:{ok:true,status:'pending_approval',receipt_id:'synthetic-receipt'};};
globalThis.__inventoryResponse={json:(data,opts)=>new Response(JSON.stringify(data),{status:opts.status,headers:opts.headers})};
const source=(await readFile(new URL('../app/api/graceflow/inventory/route.js',import.meta.url),'utf8'))
.replace("import {NextResponse} from 'next/server';",'const NextResponse=globalThis.__inventoryResponse;')
.replace("import {getSession,dbRpc} from '@/lib/supabase-rest';",'const getSession=async()=>globalThis.__inventorySession();const dbRpc=(...args)=>globalThis.__inventoryRPC(...args);')
.replace("import {validateInventory} from '@/lib/inventory-validation.mjs';",'const validateInventory=globalThis.__inventoryValidate;');
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const req=(body,origin='https://lhg.test')=>new Request('https://lhg.test/api/graceflow/inventory',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const data={item_code:'SOAP',movement_key:'IN-1',movement_date:'2026-10-05',direction:'IN',quantity:2,received_from:'Supplier',issued_to:'',purpose:'Test',received_by:'Receiver',receipt_signature:'signed-1'};
assert.equal((await POST(req({action:'movement',data}))).status,201);assert.equal((await POST(req({action:'import',data:[data]}))).status,201);
let before=calls;assert.equal((await POST(req({action:'movement',data},'https://evil.test'))).status,403);assert.equal(calls,before);
for(const body of [{action:'movement',data:{...data,role:'owner'}},{action:'import',data:[data,data]},{action:'movement',data:{...data,quantity:0}},{action:'unknown',data},{action:'movement',data,owner:'forged'}])assert.equal((await POST(req(body))).status,400);
assert.equal((await POST(req({action:'import',data:Array(201).fill(data)}))).status,400);
session.profile.is_active=false;assert.equal((await POST(req({action:'movement',data}))).status,403);session.profile.is_active=true;
for(const [msg,status] of [['inventory_denied',403],['inventory_self_approval',403],['inventory_duplicate_conflict',409],['inventory_insufficient_stock',409],['check constraint',400],['sensitive database detail',503]]){failure=msg;const response=await POST(req({action:'movement',data}));assert.equal(response.status,status);assert.equal((await response.text()).includes('sensitive database detail'),false);}
for(const key of ['__inventorySession','__inventoryValidate','__inventoryRPC','__inventoryResponse'])delete globalThis[key];
console.log('PASS inventory API origin/auth validation, upload bounds, forged fields, user-token RPC, authoritative denial, conflict and redacted failures.');
