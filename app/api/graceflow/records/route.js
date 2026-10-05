import { NextResponse } from 'next/server';
import { getSession, dbRpc } from '@/lib/supabase-rest';
import { moduleMap } from '@/lib/graceflow-enterprise';

const headers={'Cache-Control':'private, no-store'};
const error=(status,message)=>NextResponse.json({error:message},{status,headers});
export async function POST(req){
 if(req.headers.get('origin')!==new URL(req.url).origin)return error(403,'Invalid request origin.');
 const s=await getSession();
 if(!s?.profile?.is_active||!s.profile.staff_id)return error(403,'Staff authentication required.');
 try{
  const ct=req.headers.get('content-type')||'';
  if(Number(req.headers.get('content-length'))>16000)return error(413,'Request too large.');
  const raw=await req.text();if(Buffer.byteLength(raw)>16000)return error(413,'Request too large.');
  const body=ct.includes('application/json')?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));
  const keys=['module','record_type','title','priority','amount','due_at','details'];
  if(!body||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k)))return error(400,'Invalid record request.');
  const info=Object.hasOwn(moduleMap,body.module)?moduleMap[body.module]:null;
  if(!info||!info.types.includes(body.record_type)||typeof body.title!=='string'||!body.title.trim()||body.title.length>160)return error(400,'Invalid record request.');
  if(!await dbRpc('enterprise_authority',{p_module:body.module,p_action:'create'},{admin:false,token:s.token}))return error(403,'No assignment permits this action.');
  const priority=body.priority||'routine',details=body.details||'';
  const amount=body.amount===''||body.amount==null?null:Number(body.amount);
  if(!['routine','high','urgent'].includes(priority)||typeof details!=='string'||details.length>3000||(amount!==null&&(!Number.isFinite(amount)||amount<0))||body.due_at&&!/^\d{4}-\d{2}-\d{2}$/.test(body.due_at))return error(400,'Invalid record request.');
  const result=await dbRpc('create_enterprise_record',{p_module:body.module,p_type:body.record_type,p_title:body.title.trim(),p_priority:priority,p_amount:amount,p_due:body.due_at?body.due_at+'T17:00:00+03:00':null,p_details:details},{admin:false,token:s.token});
  if(!result?.ok||!result.record?.id||!result.workflow_id)return error(503,'Unable to confirm record creation.');
  if(!ct.includes('application/json'))return NextResponse.redirect(new URL('/staff/graceflow/'+body.module,req.url),303);
  return NextResponse.json(result,{status:201,headers});
 }catch(e){
  if(e instanceof SyntaxError)return error(400,'Invalid record request.');
  if(/enterprise_authority_denied/.test(e?.message||''))return error(403,'No assignment permits this action.');
  if(/invalid_enterprise_record|invalid input syntax/.test(e?.message||''))return error(400,'Invalid record request.');
  return error(503,'Unable to create workflow record.');
 }
}
