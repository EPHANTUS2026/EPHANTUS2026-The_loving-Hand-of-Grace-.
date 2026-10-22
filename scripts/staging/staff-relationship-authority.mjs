import assert from 'node:assert/strict';
import {authToken,restSelect,restInsert,restUpdate,adminFetch,requireEnv} from './lib.mjs';
requireEnv(['STAGING_TEST_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY']);
const prefix=process.env.STAGING_TEST_EMAIL_PREFIX||'lhg-stage',domain=process.env.STAGING_TEST_EMAIL_DOMAIN||'example.test';
const profiles=await restSelect('profiles','select=id,client_id,staff_id,full_name&full_name=in.(Synthetic%20Client%20A,Synthetic%20Client%20B,Staging%20Counsellor)');
const client=profiles.find(x=>x.full_name==='Synthetic Client A'),other=profiles.find(x=>x.full_name==='Synthetic Client B'),staff=profiles.find(x=>x.full_name==='Staging Counsellor');
assert.ok(client?.client_id&&other?.client_id&&staff?.staff_id,'Synthetic identities required');
const staffToken=await authToken(`${prefix}+counsellor@${domain}`,process.env.STAGING_TEST_PASSWORD),clientToken=await authToken(`${prefix}+client-a@${domain}`,process.env.STAGING_TEST_PASSWORD);
async function request(token,path,method='POST',body={}) {
 const r=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`,{method,headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});
 const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}return {status:r.status,ok:r.ok,data};
}
const assignmentQuery=`staff_id=eq.${staff.staff_id}&client_id=eq.${client.client_id}`;
const previousGrace=await restSelect('staff_client_assignments',assignmentQuery),previousTeam=await restSelect('client_team_assignments',assignmentQuery);
let graceId,teamId,requestId,workflowId;
const assertAuthority=async (expected,token=staffToken,id=client.client_id)=>{
 const r=await request(token,'rpc/grace_staff_authority','POST',{p_client_id:id,p_scope:'journey',p_purpose:'care'});
 assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data,expected);
};
const denied=async promise=>{const r=await promise;assert.ok([400,401,403].includes(r.status)||r.ok&&Array.isArray(r.data)&&r.data.length===0,`Expected authority denial, got ${r.status}: ${JSON.stringify(r.data)}`);};
try {
 const grace={staff_id:staff.staff_id,client_id:client.client_id,scopes:['journey'],purposes:['care'],active:true,starts_at:'2020-01-01T00:00:00Z',ends_at:null,revoked_at:null};
 graceId=previousGrace[0]?.id;
 if(graceId)await restUpdate('staff_client_assignments',`id=eq.${graceId}`,grace);else graceId=(await restInsert('staff_client_assignments',grace))[0].id;
 await assertAuthority(true);await assertAuthority(false,clientToken);
 await denied(request(staffToken,'staff_client_assignments','POST',{...grace,client_id:other.client_id}));
 await denied(request(clientToken,`staff_client_assignments?id=eq.${graceId}`,'PATCH',{active:true,staff_id:staff.staff_id}));
 for(const patch of [{active:false},{active:true,revoked_at:'2020-01-01T00:00:00Z'},{revoked_at:null,ends_at:'2020-01-01T00:00:00Z'},{ends_at:null,starts_at:'2999-01-01T00:00:00Z'},{starts_at:'2020-01-01T00:00:00Z',scopes:['unrelated']}]) {await restUpdate('staff_client_assignments',`id=eq.${graceId}`,patch);await assertAuthority(false);}
 // Exercise the actual welfare mutation boundary as well as Grace's authority helper.
 const created=await request(clientToken,'rpc/create_client_support_request','POST',{p_request_type:'GENERAL_SUPPORT',p_subject:'Synthetic authority certification',p_details:'Synthetic only',p_priority:'NORMAL'});
 assert.equal(created.status,200,JSON.stringify(created.data));requestId=created.data;
 const row=(await restSelect('client_support_requests',`id=eq.${requestId}&select=workflow_instance_id`))[0];workflowId=row.workflow_instance_id;
 const team={staff_id:staff.staff_id,client_id:client.client_id,team_role:'counsellor',active:false,ended_at:null};
 teamId=previousTeam[0]?.id;if(teamId)await restUpdate('client_team_assignments',`id=eq.${teamId}`,team);else teamId=(await restInsert('client_team_assignments',team))[0].id;
 const transition=(token,action)=>request(token,'rpc/transition_client_support_request','POST',{p_request_id:requestId,p_action:action,p_note:'Synthetic authority test'});
 await denied(transition(staffToken,'acknowledge'));
 await denied(transition(clientToken,'acknowledge'));
 await denied(request(staffToken,`client_team_assignments?id=eq.${teamId}`,'PATCH',{active:true}));
 await denied(request(staffToken,`client_support_requests?id=eq.${requestId}`,'PATCH',{client_id:other.client_id,status:'RESOLVED'}));
 await restUpdate('client_team_assignments',`id=eq.${teamId}`,{active:true});
 const allowed=await transition(staffToken,'acknowledge');assert.equal(allowed.status,200,JSON.stringify(allowed.data));assert.equal(allowed.data,'ACKNOWLEDGED');
 await restUpdate('client_team_assignments',`id=eq.${teamId}`,{ended_at:'2020-01-01T00:00:00Z'});await denied(transition(staffToken,'start'));
 const unchanged=(await restSelect('client_support_requests',`id=eq.${requestId}&select=status,client_id`))[0];assert.equal(unchanged.status,'ACKNOWLEDGED');assert.equal(unchanged.client_id,client.client_id);
 console.log('Staff assignment authority PASS: assigned ALLOW; unrelated/inactive/ended/future/revoked, forged assignment/client and client mutation DENY');
} finally {
 for(const [table,id,previous] of [['staff_client_assignments',graceId,previousGrace],['client_team_assignments',teamId,previousTeam]])if(id){if(previous.length)await restUpdate(table,`id=eq.${id}`,previous[0]);else await adminFetch(`/rest/v1/${table}?id=eq.${id}`,{method:'DELETE'});}
 if(requestId)await adminFetch(`/rest/v1/client_support_requests?id=eq.${requestId}`,{method:'DELETE'});
 if(workflowId)await adminFetch(`/rest/v1/workflow_instances?id=eq.${workflowId}`,{method:'DELETE'});
}
