import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {processEngineTick} from '@/lib/graceflow-automation';
export async function POST(req){
 const secret=req.headers.get('x-graceflow-secret'); const validSecret=process.env.GRACEFLOW_ENGINE_SECRET&&secret===process.env.GRACEFLOW_ENGINE_SECRET; const session=validSecret?true:await authorised(['administrator','manager','super_admin']);
 if(!session)return NextResponse.json({error:'Forbidden'},{status:403}); try{return NextResponse.json(await processEngineTick())}catch(e){return NextResponse.json({error:e.message},{status:500})}
}
