import {NextResponse} from 'next/server';
import {authorised} from '@/lib/route-auth';
import {transitionKnowledge} from '@/lib/knowledge-governance';
export async function POST(req){
 const s=await authorised(['administrator','manager','super_admin','director','clinical_director']);
 if(!s)return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const b=await req.json();
  if(!b.articleId||!b.action)return NextResponse.json({error:'articleId and action are required'},{status:400});
  const article=await transitionKnowledge({articleId:b.articleId,action:b.action,actorId:s.profile.staff_id||null,note:b.note,reviewDue:b.reviewDue});
  return NextResponse.json({article});
 }catch(e){return NextResponse.json({error:e.message},{status:400})}
}
