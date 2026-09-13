import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {resumeWorkflow} from '@/lib/graceflow-automation';
const roles=['counsellor','clinician','admissions','finance','administrator','manager','super_admin','hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service'];
export async function POST(req){const s=await authorised(roles);if(!s)return NextResponse.json({error:'Forbidden'},{status:403});try{const b=await req.json();if(!b.instanceId)return NextResponse.json({error:'instanceId required'},{status:400});return NextResponse.json(await resumeWorkflow(b.instanceId,b.payload||{}))}catch(e){return NextResponse.json({error:e.message},{status:500})}}
