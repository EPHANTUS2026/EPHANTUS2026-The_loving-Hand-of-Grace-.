import {requireSession} from '@/lib/auth';
import {dbAdminSelect} from '@/lib/supabase-rest';
import {evaluationScenarios} from '@/lib/grace/evaluation-scenarios.mjs';
import GraceEvaluationReview from '@/components/grace/GraceEvaluationReview';
export default async function Evaluations(){
 await requireSession(['administrator','manager','super_admin','clinical_director']);
 const reviews=await dbAdminSelect('grace_evaluation_reviews','select=id,scenario_id,decision,score,candidate_commit&order=created_at.desc&limit=30');
 return <section className="section"><div className="container-page max-w-4xl"><h1 className="mb-6 text-3xl font-bold">Grace evaluation review</h1><GraceEvaluationReview scenarios={evaluationScenarios} reviews={reviews}/></div></section>;
}
