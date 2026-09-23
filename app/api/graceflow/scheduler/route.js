import {NextResponse} from 'next/server';
import {dbInsert,dbUpdate,rpcAdmin} from '@/lib/supabase-rest';
import {processEngineTick} from '@/lib/graceflow-automation';
import {processNotificationOutbox} from '@/lib/notification-delivery';
import {expireStaleKnowledge} from '@/lib/knowledge-governance';
import {recordSystemEvent,requestId} from '@/lib/observability';

async function acquireLease(holder){
 const acquired=await rpcAdmin('acquire_graceflow_engine_lease',{p_holder:holder,p_ttl_seconds:240});
 return acquired===true;
}
function authorised(req){
 const direct=req.headers.get('x-graceflow-secret');
 const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 const expected=process.env.GRACEFLOW_ENGINE_SECRET;
 const cronExpected=process.env.CRON_SECRET;
 return Boolean((expected&&(direct===expected||bearer===expected))||(cronExpected&&bearer===cronExpected));
}
async function runScheduler(req){
 if(!authorised(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const rid=requestId(req); const holder=`scheduler:${rid}`;
 if(!await acquireLease(holder))return NextResponse.json({status:'skipped',reason:'engine_lease_active'});
 const run=(await dbInsert('graceflow_scheduler_runs',{status:'running',trigger_source:req.headers.get('x-vercel-cron')?'vercel_cron':'scheduler',request_id:rid}))[0];
 try{
  const engine=await processEngineTick(); const notifications=await processNotificationOutbox(); const expiredKnowledge=await expireStaleKnowledge(); const result={engine,notifications,expiredKnowledge};
  await dbUpdate('graceflow_scheduler_runs',`id=eq.${run.id}`,{status:'completed',result,finished_at:new Date().toISOString()});
  await recordSystemEvent({eventType:'scheduler.completed',component:'graceflow',message:'GraceFlow scheduler cycle completed',metadata:result,requestId:rid});
  return NextResponse.json({status:'completed',...result,requestId:rid});
 }catch(e){
  await dbUpdate('graceflow_scheduler_runs',`id=eq.${run.id}`,{status:'failed',error:String(e.message||e).slice(0,1000),finished_at:new Date().toISOString()});
  await recordSystemEvent({eventType:'scheduler.failed',severity:'error',component:'graceflow',message:e.message,requestId:rid});
  return NextResponse.json({error:'Scheduler cycle failed',requestId:rid},{status:500});
 }
}
export async function POST(req){return runScheduler(req)}
export async function GET(req){return runScheduler(req)}
