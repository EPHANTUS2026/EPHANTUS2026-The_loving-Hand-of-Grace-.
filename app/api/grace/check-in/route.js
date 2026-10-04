import {NextResponse} from 'next/server';
import {getSession,dbRpc} from '@/lib/supabase-rest';
import {checkinPayload,checkinRetryKey,persistCheckinReceipt} from '@/lib/grace/check-in.mjs';
const headers={'Cache-Control':'private, no-store'};
export async function POST(req){
 if(req.headers.get('origin')!==new URL(req.url).origin)return NextResponse.json({error:'Invalid request origin.'},{status:403,headers});
 const session=await getSession();
 if(!session?.profile?.is_active||session.profile.role!=='client'||!session.profile.client_id)return NextResponse.json({error:'Authentication required.'},{status:401,headers});
 let payload,key;
 try{
  const reader=req.body.getReader();let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return NextResponse.json({error:'Request too large.'},{status:413,headers});}chunks.push(value);}
  const body=JSON.parse(Buffer.concat(chunks).toString());
  key=checkinRetryKey(body.idempotencyKey);delete body.idempotencyKey;payload=checkinPayload(body);
 }catch{return NextResponse.json({error:'Invalid check-in values.'},{status:400,headers});}
 try{
  const receipt=await persistCheckinReceipt(session,payload,key,dbRpc);
  return NextResponse.json({ok:true,confirmed:true,...receipt},{headers});
 }catch(error){
  const conflict=error.message==='checkin_retry_conflict';
  return NextResponse.json({error:conflict?'This retry differs from the saved check-in. Reload to review it before saving a new entry.':'Check-in could not be confirmed. Retry the unchanged entry safely.'},{status:conflict?409:503,headers});
 }
}
