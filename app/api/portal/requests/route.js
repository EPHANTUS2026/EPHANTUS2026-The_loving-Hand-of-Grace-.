import {NextResponse} from 'next/server';
import {getSession,dbSelect,dbRpc} from '@/lib/supabase-rest';

export async function GET(){
 const session=await getSession();
 if(!session?.profile?.is_active||session.profile.role!=='client'||!session.profile.client_id) return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const rows=await dbSelect('client_support_requests',`client_id=eq.${encodeURIComponent(session.profile.client_id)}&select=id,category,subject,priority,status,sla_due_at,acknowledged_at,resolved_at,resolution_summary,created_at,updated_at&order=created_at.desc&limit=50`,session.token);
  return NextResponse.json({requests:rows||[]});
 }catch{return NextResponse.json({error:'Requests are temporarily unavailable.'},{status:503})}
}
export async function POST(req){
 const session=await getSession();
 if(!session?.profile?.is_active||session.profile.role!=='client'||!session.profile.client_id) return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await req.json();
  const category=String(body.category||'').trim(),subject=String(body.subject||'').trim(),detail=String(body.detail||'').trim(),priority=String(body.priority||'routine');
  if(subject.length<3||subject.length>160||detail.length<3||detail.length>4000) return NextResponse.json({error:'Please provide a clear subject and request.'},{status:400});
  const result=await dbRpc('create_client_support_request',{p_category:category,p_subject:subject,p_detail:detail,p_priority:priority},{admin:false,token:session.token});
  return NextResponse.json({id:Array.isArray(result)?result[0]:result},{status:201});
 }catch(e){return NextResponse.json({error:e.message||'Request could not be created.'},{status:400})}
}
