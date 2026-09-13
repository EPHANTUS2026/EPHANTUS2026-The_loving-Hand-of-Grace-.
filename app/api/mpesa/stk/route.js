import { NextResponse } from 'next/server';
import { getSession, dbInsert } from '@/lib/supabase-rest';

function stamp(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`}
function normalizePhone(v){const s=String(v||'').replace(/\D/g,'');if(s.startsWith('0'))return `254${s.slice(1)}`;if(s.startsWith('254'))return s;return ''}
export async function POST(req){
 const session=await getSession(); if(!session?.profile || !['finance','administrator','super_admin'].includes(session.profile.role)) return NextResponse.json({error:'Forbidden'},{status:403});
 const key=process.env.MPESA_CONSUMER_KEY, secret=process.env.MPESA_CONSUMER_SECRET, shortcode=process.env.MPESA_SHORTCODE, passkey=process.env.MPESA_PASSKEY, callback=process.env.MPESA_CALLBACK_URL;
 if(!key||!secret||!shortcode||!passkey||!callback) return NextResponse.json({error:'M-PESA is not configured.'},{status:503});
 try{
  const {invoiceId,amount,phone}=await req.json(); const msisdn=normalizePhone(phone); const numeric=Number(amount);
  if(!invoiceId||!msisdn||!Number.isFinite(numeric)||numeric<=0) return NextResponse.json({error:'Invalid payment request.'},{status:400});
  const base=process.env.MPESA_BASE_URL||'https://sandbox.safaricom.co.ke';
  const auth=Buffer.from(`${key}:${secret}`).toString('base64');
  const tok=await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`,{headers:{Authorization:`Basic ${auth}`},cache:'no-store'}); if(!tok.ok) throw new Error('M-PESA authentication failed'); const {access_token}=await tok.json();
  const timestamp=stamp(), password=Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const r=await fetch(`${base}/mpesa/stkpush/v1/processrequest`,{method:'POST',headers:{Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},body:JSON.stringify({BusinessShortCode:shortcode,Password:password,Timestamp:timestamp,TransactionType:'CustomerPayBillOnline',Amount:Math.round(numeric),PartyA:msisdn,PartyB:shortcode,PhoneNumber:msisdn,CallBackURL:callback,AccountReference:String(invoiceId).slice(0,12),TransactionDesc:'Treatment centre invoice payment'})});
  const data=await r.json(); if(!r.ok || data.ResponseCode!=='0') return NextResponse.json({error:'M-PESA request was not accepted.',provider:data},{status:502});
  await dbInsert('payments',{invoice_id:invoiceId,provider:'mpesa',checkout_request_id:data.CheckoutRequestID,amount:numeric,currency:'KES',status:'pending',phone_masked:`254****${msisdn.slice(-4)}`});
  return NextResponse.json({ok:true,checkoutRequestId:data.CheckoutRequestID,customerMessage:data.CustomerMessage});
 }catch{return NextResponse.json({error:'Payment initiation failed.'},{status:502})}
}
