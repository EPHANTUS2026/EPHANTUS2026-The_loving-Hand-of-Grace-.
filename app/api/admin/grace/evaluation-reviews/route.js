import {authorised} from '@/lib/route-auth';
import {dbInsert} from '@/lib/supabase-rest';
import {evaluationScenarios} from '@/lib/grace/evaluation-scenarios.mjs';
export async function POST(request){
 const session=await authorised(['administrator','manager','super_admin','clinical_director']);
 if(!session)return Response.json({error:'Forbidden'},{status:403});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{
  const text=await request.text();if(text.length>1500)return Response.json({error:'Request too large'},{status:413});
  const b=JSON.parse(text);
  if(!evaluationScenarios.some(s=>s.id===b.scenarioId)||!Number.isInteger(b.score)||b.score<1||b.score>5||
    !['accepted','changes_required'].includes(b.decision)||!/^[a-f0-9]{40}$/.test(b.commit||'')||
    !/^[A-Za-z0-9_-]{1,100}$/.test(b.evidenceId||''))
   return Response.json({error:'Invalid review'},{status:400});
  await dbInsert('grace_evaluation_reviews',{scenario_id:b.scenarioId,score:b.score,decision:b.decision,
   candidate_commit:b.commit,evidence_id:b.evidenceId,reviewer_profile_id:session.profile.id});
  return Response.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Review unavailable'},{status:503});}
}
