import {accountAdmin,inviteStaff} from '@/lib/staff-accounts/service';
export async function POST(req){
 const headers={'Cache-Control':'no-store'};
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request origin.'},{status:403,headers});
 const session=await accountAdmin();if(!session)return Response.json({error:'Forbidden'},{status:403,headers});
 if(Number(req.headers.get('content-length')||0)>4096)return Response.json({error:'Request too large.'},{status:413,headers});
 try{const text=await req.text();if(text.length>4096)return Response.json({error:'Request too large.'},{status:413,headers});const result=await inviteStaff(session,JSON.parse(text));return Response.json(result,{headers});}
 catch(e){const known=/Enter a full name|Additional authority|Confirm that|Invitation sending|Invitation is awaiting review/.test(e.message);return Response.json({error:known?e.message:'Unable to create invitation. Check whether this address already has an account, or whether the invitation limit has been reached.'},{status:400,headers});}
}
