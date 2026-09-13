import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {integrationHealth} from '@/lib/integration-health';
import {configured} from '@/lib/supabase-rest';
export async function GET(){
 const s=await authorised(['administrator','manager','super_admin','director']);
 if(!s)return NextResponse.json({error:'Forbidden'},{status:403});
 const connectors=await integrationHealth({persist:true});
 return NextResponse.json({status:configured()?'operational':'configuration_required',databaseConfigured:configured(),connectors,checkedAt:new Date().toISOString()});
}
