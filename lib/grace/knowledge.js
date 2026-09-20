import {dbRpc} from '@/lib/supabase-rest';
import {buildKnowledgeGraph,sanitizeRetrievedKnowledge} from './knowledge-graph.js';

// Static material is deliberately limited to non-institutional runtime fallback.
// Centre claims must come from the governed database retrieval service.
export const approvedKnowledge=[];

export function retrieveApprovedKnowledge(){return []}

export async function retrieveGovernedKnowledge(message='',limit=3){
  const query=String(message||'').trim();
  if(!query)return [];
  try{
    const rows=await dbRpc('search_grace_approved_knowledge',{p_query:query,p_limit:limit},{admin:false});
    const graph=buildKnowledgeGraph(rows||[],{audience:'public'});
    return graph.nodes.map(row=>sanitizeRetrievedKnowledge({
      id:row.id,type:'VERIFIED',title:row.title,section:'Centre knowledge',updated:row.lastReviewedAt,
      text:row.text,summary:row.summary,version:row.version,score:row.score,
      sourceReferences:row.sourceReferences||[],authority:'GOVERNED_DATABASE',authorityTier:row.authorityTier,clinicalSensitivity:row.clinicalSensitivity
    }));
  }catch(error){
    console.error('Grace governed knowledge retrieval unavailable',{message:error?.message||'unknown'});
    return [];
  }
}
