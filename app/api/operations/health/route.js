import {NextResponse} from 'next/server';
import {getSession} from '@/lib/supabase-rest';
import {CARE_ROLES, MANAGEMENT_ROLES} from '@/lib/roles';
import {operationalHealth} from '@/lib/operational-health';
export const dynamic = 'force-dynamic';
export async function GET() {
  const session = await getSession();
  if (!session?.profile?.is_active || ![...CARE_ROLES, ...MANAGEMENT_ROLES, 'admissions', 'helpdesk'].includes(session.profile.role)) return NextResponse.json({error: 'Forbidden'}, {status: 403});
  try { return NextResponse.json(await operationalHealth(session.token), {headers: {'Cache-Control': 'private, no-store'}}); }
  catch { return NextResponse.json({error: 'Operational health is unavailable'}, {status: 503}); }
}
