import { authToken, restSelect, requireEnv } from './lib.mjs';
requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const base=process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,'');
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const clients=await restSelect('profiles','role=eq.client&full_name=in.(Synthetic%20Client%20A,Synthetic%20Client%20B)&select=auth_user_id,client_id,full_name');
if(clients?.length!==2) throw new Error('Synthetic Client A/B identities are not provisioned and linked');
async function userGet(token,table,query){const r=await fetch(`${base}/rest/v1/${table}?${query}`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});const text=await r.text();if(!r.ok) throw new Error(`${table} ${r.status}: ${text}`);return text?JSON.parse(text):[];}
const password=process.env.STAGING_TEST_PASSWORD;
const emailFor=(name)=>name.endsWith('A')?'lhg-stage+client-a@example.test':'lhg-stage+client-b@example.test';
for(const actor of clients){const other=clients.find(x=>x.auth_user_id!==actor.auth_user_id);const token=await authToken(emailFor(actor.full_name),password);const own=await userGet(token,'profiles',`client_id=eq.${actor.client_id}&select=client_id`);const foreign=await userGet(token,'profiles',`client_id=eq.${other.client_id}&select=client_id`);const foreignPassport=await userGet(token,'passport_projection_events',`client_id=eq.${other.client_id}&select=id`);const foreignReflections=await userGet(token,'recovery_passport_reflections',`client_id=eq.${other.client_id}&select=id`);if(own.length!==1) throw new Error(`${actor.full_name} cannot read own profile`);if(foreign.length||foreignPassport.length||foreignReflections.length) throw new Error(`${actor.full_name} crossed client isolation boundary`);}
console.log('Authenticated Client A/B authorization matrix PASS: own profile visible; other profile, Passport projections and private reflections denied.');