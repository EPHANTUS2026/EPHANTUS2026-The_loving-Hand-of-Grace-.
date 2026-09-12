import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {dbUpdate} from '@/lib/supabase-rest';
const roles=['counsellor','clinician','admissions','finance','administrator','manager','super_admin','hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service'];
export async function POST(req){const s=await authorised(roles);if(!s)return NextResponse.json({error:'Forbidden'},{status:403});const b=await req.json();if(!b.id)return NextResponse.json({error:'id required'},{status:400});try{await dbUpdate('workflow_notifications',`id=eq.${b.id}`,{read_at:new Date().toISOString()},{admin:false,token:s.token});return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e.message},{status:500})}}
