import {NextResponse} from 'next/server';
import {requireConnectorAdmin,connectorStates} from '@/lib/connectors/admin';
export async function GET(){const s=await requireConnectorAdmin();if(!s)return NextResponse.json({error:'Forbidden'},{status:403});const connectors=await connectorStates();return NextResponse.json({connectors});}
