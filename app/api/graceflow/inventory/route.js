import {NextResponse} from 'next/server';
import {getSession,dbRpc} from '@/lib/supabase-rest';
import {validateInventory} from '@/lib/inventory-validation.mjs';
const headers={'Cache-Control':'private, no-store'};
const error=(status,message)=>NextResponse.json({error:message},{status,headers});
export async function POST(req){
 if(req.headers.get('origin')!==new URL(req.url).origin)return error(403,'Invalid request origin.');
 const s=await getSession();if(!s?.profile?.is_active||!s.profile.staff_id)return error(403,'Staff authentication required.');
 if(Number(req.headers.get('content-length'))>128000)return error(413,'Upload too large.');
 try{
 const raw=await req.text();if(Buffer.byteLength(raw)>128000)return error(413,'Upload too large.');
 const body=JSON.parse(raw);if(!body||Array.isArray(body)||Object.keys(body).some(k=>!['action','data'].includes(k)))return error(400,'Invalid inventory request.');
 const upload=body.action==='import';
 if(upload?(!Array.isArray(body.data)||!body.data.length||body.data.length>200||body.data.some(row=>!validateInventory('movement',row))||new Set(body.data.map(row=>row.movement_key)).size!==body.data.length):!validateInventory(body.action,body.data))return error(400,'Check the required fields, date and quantity.');
 const result=await dbRpc(upload?'inventory_import':'inventory_write',upload?{p_rows:body.data}:{p_action:body.action,p_data:body.data},{admin:false,token:s.token});
 if(!result?.ok|| (upload?!result.receipts?.length:!result.receipt_id))return error(503,'No save receipt was returned. Please check before retrying.');
 return NextResponse.json(result,{status:201,headers});
 }catch(e){
 const msg=e?.message||'';
 if(e instanceof SyntaxError)return error(400,'Invalid inventory request.');
 if(/inventory_denied|inventory_self_approval|enterprise_authority_denied/.test(msg))return error(403,'An active assignment and an independent approver are required.');
 if(/inventory_duplicate_conflict|duplicate key/.test(msg))return error(409,'That reference already exists. Use its original details or a new reference.');
 if(/inventory_insufficient_stock/.test(msg))return error(409,'Insufficient posted stock. No stock was issued.');
 if(/inventory_invalid|check constraint|not-null constraint|invalid input|numeric field overflow/.test(msg))return error(400,'Check the required fields, date and quantity.');
 return error(503,'Inventory is unavailable. No confirmed save receipt was received.');
 }
}
