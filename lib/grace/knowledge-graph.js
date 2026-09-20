export const KNOWLEDGE_TIERS=Object.freeze({AUTHORITATIVE_RECORD:4,APPROVED_CENTRE:3,APPROVED_REFERENCE:2,GENERAL_EDUCATION:1});
export function normalizeKnowledgeNode(row={}){
 return {id:row.id,title:row.title||'',summary:row.summary||'',text:row.body||row.text||'',version:row.version||null,lastReviewedAt:row.last_reviewed_at||row.updated||null,reviewDue:row.review_due||null,sourceReferences:row.source_references||row.sourceReferences||[],audience:row.audience||['public'],clinicalSensitivity:row.clinical_sensitivity||'general',authorityTier:Number(row.authority_tier||KNOWLEDGE_TIERS.APPROVED_CENTRE),status:row.approval_status||row.status||'APPROVED',visibility:row.grace_visibility||'approved'};
}
export function isKnowledgeEligible(node,{audience='public',now=new Date()}={}){
 if(!node||!['APPROVED','approved'].includes(node.status)||node.visibility!=='approved')return false;
 if(node.audience?.length&&!node.audience.includes(audience)&&!node.audience.includes('all'))return false;
 if(node.reviewDue&&new Date(node.reviewDue)<now)return false;
 return true;
}
export function buildKnowledgeGraph(rows=[],options={}){
 const nodes=rows.map(normalizeKnowledgeNode).filter(n=>isKnowledgeEligible(n,options));
 const edges=[];
 for(const n of nodes)for(const ref of n.sourceReferences||[])edges.push({from:n.id,to:ref?.url||ref?.title||ref?.type||'source',relation:'SUPPORTED_BY'});
 return {nodes,edges,provenanceComplete:nodes.every(n=>n.version&&n.lastReviewedAt&&n.sourceReferences.length)};
}
export function sanitizeRetrievedKnowledge(node){
 return {...node,text:String(node.text||'').replace(/(?:ignore|disregard|override) (?:all |the )?(?:previous |system )?(?:instructions|rules|policy)[\s\S]*/gi,'[untrusted instruction removed]')};
}