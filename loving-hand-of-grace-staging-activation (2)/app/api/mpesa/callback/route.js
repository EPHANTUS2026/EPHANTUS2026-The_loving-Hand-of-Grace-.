import { NextResponse } from 'next/server';
import { dbAdminSelect, dbUpdate, dbInsert } from '@/lib/supabase-rest';
export async function POST(req){
 try{
  const body=await req.json(); const cb=body?.Body?.stkCallback; const checkout=cb?.CheckoutRequestID; if(!checkout) return NextResponse.json({ResultCode:0,ResultDesc:'Accepted'});
  const existing=await dbAdminSelect('payments',`checkout_request_id=eq.${encodeURIComponent(checkout)}&select=id,status,invoice_id,amount`);
  const payment=existing?.[0]; if(!payment) return NextResponse.json({ResultCode:0,ResultDesc:'Accepted'});
  if(payment.status!=='pending') return NextResponse.json({ResultCode:0,ResultDesc:'Already processed'});
  const items=cb?.CallbackMetadata?.Item||[]; const get=n=>items.find(x=>x.Name===n)?.Value; const success=Number(cb.ResultCode)===0;
  await dbUpdate('payments',`id=eq.${payment.id}`,{status:success?'paid':'failed',provider_reference:success?String(get('MpesaReceiptNumber')||''):null,received_at:success?new Date().toISOString():null,raw_callback:body});
  await dbInsert('audit_log',{action:'mpesa_callback_received',entity_type:'payment',entity_id:payment.id,after_state:{status:success?'paid':'failed',checkout_request_id:checkout},reason:'Provider callback'});
  return NextResponse.json({ResultCode:0,ResultDesc:'Accepted'});
 }catch{return NextResponse.json({ResultCode:0,ResultDesc:'Accepted'})}
}
