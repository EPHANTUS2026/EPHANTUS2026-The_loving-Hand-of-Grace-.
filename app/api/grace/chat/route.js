import { NextResponse } from 'next/server';
import { orchestrateGrace } from '@/lib/grace/orchestrator';

export async function POST(req){
  try {
    const body=await req.json();
    const message=String(body?.message||'').trim();
    if(!message) return NextResponse.json({error:'Message is required.'},{status:400});
    if(message.length>4000) return NextResponse.json({error:'Message is too long.'},{status:400});
    const result=orchestrateGrace({message,context:body?.context||'visitor'});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({error:'Grace could not process that request safely.'},{status:500});
  }
}
