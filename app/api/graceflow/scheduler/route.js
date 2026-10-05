import {NextResponse} from 'next/server';
import {dbInsert,dbUpdate,dbRpc} from '@/lib/supabase-rest';
import {processEngineTick} from '@/lib/graceflow-automation';
import {processNotificationOutbox} from '@/lib/notification-delivery';
import {expireStaleKnowledge} from '@/lib/knowledge-governance';
import {recordSystemEvent,requestId} from '@/lib/observability';
import {deploymentIdentity} from '@/lib/deployment-identity';
import {runSchedulerCycle} from '@/lib/scheduler-cycle.mjs';
// Deployment execution must end before the database lease can expire.
export const maxDuration=180;

async function acquireLease(holder){
 const acquired=await dbRpc('acquire_graceflow_engine_lease',{p_holder:holder,p_ttl_seconds:240});
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
 const provenance={...deploymentIdentity(),deploymentHost:process.env.VERCEL_URL||null,projectId:process.env.VERCEL_PROJECT_ID||null};
 const run=(await dbInsert('graceflow_scheduler_runs',{status:'running',trigger_source:req.headers.get('x-vercel-cron')?'vercel_cron':'scheduler',request_id:rid,result:{provenance}}))[0];
 try{
  const cycle=await runSchedulerCycle({engine:processEngineTick,notifications:processNotificationOutbox,expiredKnowledge:expireStaleKnowledge});
  const result={provenance,outcomes:cycle.outcomes};
  await dbUpdate('graceflow_scheduler_runs',`id=eq.${run.id}`,{status:cycle.status,result,error:cycle.status==='failed'?'One or more scheduler subsystems failed':null,finished_at:new Date().toISOString()});
  await recordSystemEvent({eventType:`scheduler.${cycle.status}`,severity:cycle.status==='failed'?'error':'info',component:'graceflow',message:`GraceFlow scheduler cycle ${cycle.status}`,metadata:result,requestId:rid});
  return NextResponse.json({status:cycle.status,...result,requestId:rid},{status:cycle.status==='failed'?500:200,headers:{'Cache-Control':'no-store'}});
 }catch(e){
  await dbUpdate('graceflow_scheduler_runs',`id=eq.${run.id}`,{status:'failed',error:'Scheduler persistence failed',finished_at:new Date().toISOString()});
  await recordSystemEvent({eventType:'scheduler.failed',severity:'error',component:'graceflow',message:'Scheduler persistence failed',metadata:{provenance},requestId:rid});
  return NextResponse.json({error:'Scheduler cycle failed',requestId:rid},{status:500});
 }
}
export async function POST(req){return runScheduler(req)}
export async function GET(req){return runScheduler(req)}
