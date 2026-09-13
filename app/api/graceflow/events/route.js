import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {matchAndStartEvent} from '@/lib/graceflow-automation';
const roles=['counsellor','clinician','admissions','finance','administrator','manager','super_admin','hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service'];
export async function POST(req){const s=await authorised(roles);if(!s)return NextResponse.json({error:'Forbidden'},{status:403});try{const b=await req.json();if(!b.eventName)return NextResponse.json({error:'eventName required'},{status:400});const started=await matchAndStartEvent({eventName:b.eventName,module:b.module||'care',payload:b.payload||{},source:'staff_portal'});return NextResponse.json({started});}catch(e){return NextResponse.json({error:e.message},{status:500})}}
