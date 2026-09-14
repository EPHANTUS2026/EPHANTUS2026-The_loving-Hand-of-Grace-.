import {dbRpc} from '@/lib/supabase-rest';

// Static material is deliberately limited to non-institutional runtime fallback.
// Centre claims must come from the governed database retrieval service.
export const approvedKnowledge=[];

export function retrieveApprovedKnowledge(){return []}

export async function retrieveGovernedKnowledge(message='',limit=3){
  const query=String(message||'').trim();
  if(!query)return [];
  try{
    const rows=await dbRpc('search_grace_approved_knowledge',{p_query:query,p_limit:limit},{admin:false});
    return (rows||[]).map(row=>({
      id:row.id,type:'VERIFIED',title:row.title,section:'Centre knowledge',updated:row.last_reviewed_at,
      text:row.body,summary:row.summary,version:row.version,score:row.score,
      sourceReferences:row.source_references||[],authority:'GOVERNED_DATABASE'
    }));
  }catch(error){
    console.error('Grace governed knowledge retrieval unavailable',{message:error?.message||'unknown'});
    return [];
  }
}
