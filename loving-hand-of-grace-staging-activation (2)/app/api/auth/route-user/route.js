import { NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase-rest';
import { homeForRole } from '@/lib/auth';
export async function GET(req){const s=await getSession(); return NextResponse.redirect(new URL(s?.profile?homeForRole(s.profile.role):'/login',req.url),303)}
