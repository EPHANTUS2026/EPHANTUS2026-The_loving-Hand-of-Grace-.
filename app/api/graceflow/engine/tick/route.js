import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {processEngineTick} from '@/lib/graceflow-automation';
import {dbRpc} from '@/lib/supabase-rest';
import {requestId} from '@/lib/observability';
export const maxDuration=180;
export async function POST(req){
 const secret=req.headers.get('x-graceflow-secret'); const validSecret=process.env.GRACEFLOW_ENGINE_SECRET&&secret===process.env.GRACEFLOW_ENGINE_SECRET; const session=validSecret?true:await authorised(['administrator','manager','super_admin']);
 if(!session)return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const acquired=await dbRpc('acquire_graceflow_engine_lease',{p_holder:`manual:${requestId(req)}`,p_ttl_seconds:240});
  if(acquired!==true)return NextResponse.json({status:'skipped',reason:'engine_lease_active'});
  return NextResponse.json(await processEngineTick(),{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Engine cycle failed'},{status:500})}
}
