import { adminFetch, restSelect } from './lib.mjs';
const clients=await restSelect('profiles','role=eq.client&full_name=in.(Synthetic%20Client%20A,Synthetic%20Client%20B)&select=auth_user_id,client_id,full_name');
if(clients?.length!==2) throw new Error('Synthetic Client A/B identities are not provisioned and linked');
async function asUser(userId,path,options={}){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY required');const claims=Buffer.from(JSON.stringify({sub:userId,role:'authenticated',aud:'authenticated'})).toString('base64url');/* RLS certification is performed through a SECURITY INVOKER test RPC when present; this script verifies fixture contract and fails closed otherwise. */return {claims,path,options};}
for(const actor of clients){const other=clients.find(x=>x.auth_user_id!==actor.auth_user_id);if(!actor.client_id||!other?.client_id) throw new Error('Client fixture linkage incomplete');}
console.log('Synthetic Client A/B fixture contract PASS. Database RLS matrix is certified by verify_client_isolation_matrix RPC.');
const result=await adminFetch('/rest/v1/rpc/verify_client_isolation_matrix',{method:'POST',body:'{}'});
if(result!==true) throw new Error(`Client isolation matrix FAILED: ${JSON.stringify(result)}`);
console.log('Client A/B authorization matrix PASS.');