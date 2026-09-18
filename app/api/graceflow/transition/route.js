import { NextResponse } from 'next/server';
import { getSession, dbSelect, rpc } from '@/lib/supabase-rest';

const allowedRoles=['counsellor','clinician','clinical_director','doctor','psychologist','admissions','administrator','super_admin'];

export async function POST(req){
 const s=await getSession();
 if(!s?.profile || !allowedRoles.includes(s.profile.role)) return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const ct=req.headers.get('content-type')||''; let admissionId,to,reason,returnTo;
  if(ct.includes('form')){const fd=await req.formData();admissionId=String(fd.get('admissionId')||'');to=String(fd.get('to')||'');reason=String(fd.get('reason')||'');returnTo=String(fd.get('returnTo')||'');}
  else ({admissionId,to,reason,returnTo}=await req.json());
  const rows=await dbSelect('admissions',`id=eq.${encodeURIComponent(admissionId)}&select=id,stage`,s.token);
  const current=rows?.[0];
  if(!current)return NextResponse.json({error:'Not found'},{status:404});
  const result=await rpc('transition_recovery_journey',{p_admission_id:admissionId,p_to:to,p_expected_from:current.stage,p_reason:String(reason||'Approved workflow transition').slice(0,500)},s.token);
  if(returnTo)return NextResponse.redirect(new URL(returnTo,req.url),303);
  return NextResponse.json(result);
 }catch(e){
  const message=e?.message||'Transition failed';
  const status=/forbidden|authentication|required/i.test(message)?403:/stale|invalid|required|approval/i.test(message)?409:500;
  return NextResponse.json({error:message},{status});
 }
}
