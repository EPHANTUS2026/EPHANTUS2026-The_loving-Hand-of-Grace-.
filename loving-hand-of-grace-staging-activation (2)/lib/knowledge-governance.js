import {dbAdminSelect,dbInsert,dbUpdate} from './supabase-rest';

const STATES=new Set(['DRAFT','IN_REVIEW','APPROVED','EXPIRED','ARCHIVED']);

async function getArticle(id){
  const rows=await dbAdminSelect('knowledge_articles',`id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  if(!rows?.[0])throw new Error('Knowledge article not found');
  return rows[0];
}
async function event(article,action,actorId,note=''){
  return dbInsert('knowledge_publish_events',{article_id:article.id,action,actor_id:actorId||null,note:String(note||'').slice(0,1000),snapshot:{title:article.title,version:article.version,approval_status:article.approval_status,grace_visibility:article.grace_visibility,next_review_at:article.next_review_at}});
}
export async function transitionKnowledge({articleId,action,actorId,note,reviewDue}){
  const article=await getArticle(articleId); const now=new Date().toISOString(); let patch={updated_at:now};
  if(!STATES.has(article.approval_status))throw new Error('Unsupported knowledge state');
  if(action==='submit'){
    if(article.approval_status!=='DRAFT'&&article.approval_status!=='EXPIRED')throw new Error('Only draft or expired articles can be submitted for review');
    patch={...patch,approval_status:'IN_REVIEW',grace_visibility:'blocked'};
  }else if(action==='approve'){
    if(article.approval_status!=='IN_REVIEW')throw new Error('Article must be in review before approval');
    patch={...patch,approval_status:'APPROVED',grace_visibility:'approved',approved_by:actorId||null,approved_at:now,published_at:now,last_reviewed_at:now,next_review_at:reviewDue||article.next_review_at||new Date(Date.now()+180*86400000).toISOString()};
  }else if(action==='reject'){
    if(article.approval_status!=='IN_REVIEW')throw new Error('Only in-review articles can be rejected');
    patch={...patch,approval_status:'DRAFT',grace_visibility:'blocked'};
  }else if(action==='archive'){
    patch={...patch,approval_status:'ARCHIVED',archived:true,grace_visibility:'blocked'};
  }else if(action==='restore'){
    if(!article.archived)throw new Error('Article is not archived');
    patch={...patch,approval_status:'DRAFT',archived:false,grace_visibility:'blocked'};
  }else throw new Error('Unsupported knowledge action');
  const updated=(await dbUpdate('knowledge_articles',`id=eq.${article.id}`,patch))[0];
  const eventName={submit:'SUBMITTED',approve:'PUBLISHED',reject:'REJECTED',archive:'ARCHIVED',restore:'RESTORED'}[action];
  await event(updated,eventName,actorId,note);
  return updated;
}

export async function expireStaleKnowledge(){
  const now=new Date().toISOString();
  const rows=await dbAdminSelect('knowledge_articles',`approval_status=eq.APPROVED&archived=eq.false&next_review_at=lt.${encodeURIComponent(now)}&select=*`).catch(()=>[]);
  let expired=0;
  for(const article of rows||[]){
    const updated=(await dbUpdate('knowledge_articles',`id=eq.${article.id}`,{approval_status:'EXPIRED',grace_visibility:'blocked',updated_at:now}))[0];
    await event(updated,'EXPIRED',null,'Automatically expired because its review date passed'); expired++;
  }
  return expired;
}
