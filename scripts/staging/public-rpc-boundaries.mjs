import assert from 'node:assert/strict';
import {requireEnv} from './lib.mjs';

requireEnv(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const base=process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function anonRpc(fn,body){
 const res=await fetch(`${base}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const text=await res.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}
 return {status:res.status,ok:res.ok,data,text};
}
function rejected(r,label){assert.equal(r.ok,false,`${label} unexpectedly succeeded: ${r.text}`)}

const empty=await anonRpc('search_grace_approved_knowledge',{p_query:'',p_limit:3});rejected(empty,'empty Grace query');
const long=await anonRpc('search_grace_approved_knowledge',{p_query:'x'.repeat(301),p_limit:3});rejected(long,'oversized Grace query');
const bounded=await anonRpc('search_grace_approved_knowledge',{p_query:'recovery',p_limit:500});
assert.equal(bounded.ok,true,`bounded Grace search failed: ${bounded.text}`);
assert.ok(Array.isArray(bounded.data));assert.ok(bounded.data.length<=5,'Grace search exceeded five-row public cap');
for(const row of bounded.data){assert.deepEqual(Object.keys(row).sort(),['body','id','last_reviewed_at','score','source_references','summary','title','version'].sort(),'Grace search returned unexpected fields')}

const fake={p_hold_id:crypto.randomUUID(),p_hold_token_hash:'short',p_first_name:'Synthetic',p_last_name:'Boundary',p_phone:'+254700000001',p_email:'synthetic-boundary@example.test',p_preferred_contact_method:'email',p_consent_version:'staging-v1',p_manage_token_hash:'short',p_idempotency_key:'boundary-test',p_optional_note:null,p_user_id:null};
rejected(await anonRpc('confirm_booking_slot',fake),'weak booking tokens');
const forged={...fake,p_hold_token_hash:'h'.repeat(32),p_manage_token_hash:'m'.repeat(32),p_user_id:crypto.randomUUID()};
rejected(await anonRpc('confirm_booking_slot',forged),'anonymous forged user binding');
const oversized={...fake,p_hold_token_hash:'h'.repeat(32),p_manage_token_hash:'m'.repeat(32),p_optional_note:'x'.repeat(2001)};
rejected(await anonRpc('confirm_booking_slot',oversized),'oversized booking note');
console.log('Public RPC boundary tests PASS: Grace retrieval is bounded and anonymous booking rejects weak/forged/oversized mutations.');
