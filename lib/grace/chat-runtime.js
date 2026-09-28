import { randomUUID, createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { getSession, dbRpc } from '@/lib/supabase-rest';
import { openConversation, sealConversation } from './conversation.mjs';
import { generateGraceAnswer, providerReady } from './model-provider.mjs';
import { validateFinalAnswer } from './final-answer.mjs';
import { retrieveGovernedKnowledge } from './knowledge';

export async function enrichGraceResponse(request, body, base) {
  const session = await getSession().catch(()=>null);
  const secret = process.env.GRACE_CONVERSATION_SECRET;
  const browserId = cookies().get('lhg_grace_browser')?.value || randomUUID();
  const owner = (session?.profile?.id || 'visitor') + ':' + browserId;
  let turns=[];
  if (body.conversationToken) {
    try { turns=openConversation(body.conversationToken,owner,secret); }
    catch { return {status:409,body:{error:'This conversation has expired or changed accounts. Start a new conversation.'}}; }
  }
  const result={...base,responseMode:'rules',providerStatus:'disabled'};
  // Protected projections never enter external model context in this rollout.
  const canGenerate = !session && body.modelConsent===true && providerReady() &&
    secret?.length>=32 && base.safetyLevel==='STANDARD' &&
    base.boundary==='NONE' && base.state!=='VERIFIED_CLIENT_DATA' &&
    !['RESTRICTED','EMERGENCY'].includes(base.state);
  if (canGenerate) {
    const quotaKey=createHmac('sha256',secret).update(browserId).digest('hex');
    let quota;
    try { quota=await dbRpc('consume_grace_model_quota',{p_key:quotaKey}); }
    catch { quota=false; }
    if (!quota) result.providerStatus='limited';
    else {
      const query=[...turns.slice(-2).map(t=>t.user),body.message].join(' ').slice(-4000);
      const sources=await retrieveGovernedKnowledge(query,4);
      const generated=await generateGraceAnswer({message:body.message,turns,sources,signal:request.signal});
      result.providerStatus=generated.status;
      if (generated.status==='generated') {
        const finalCheck=validateFinalAnswer({...generated,sources,needsSources:base.needsSources});
        result.finalValidation=finalCheck;
        if (finalCheck.result==='PASS') {
          result.answer=generated.answer; result.responseMode='model';
          result.sources=sources.filter(s=>generated.sourceIds.includes(s.id)).map(s=>({
            id:s.id,title:s.title,version:s.version,lastReviewedAt:s.updated,type:'governed_centre_knowledge',
          }));
          result.requiresHuman=base.requiresHuman || generated.needsHuman;
          result.state=result.sources.length?'GROUNDED':'GENERAL';
          result.quality={result:'PASS',scope:'structural_checks_only'};
          result.provenance={knowledgeState:result.state,sourceCount:result.sources.length,toolConfirmationState:'NONE'};
          result.disclosure={label:'Grace generated this response using the approved AI provider. Check important information with the Centre.',learnMore:true};
          result.metrics=generated.metrics;
        } else result.providerStatus='validation_failed';
      }
    }
  }
  if (body.modelConsent===true && result.responseMode==='rules')
    result.serviceNotice='Enhanced conversation is unavailable for this request. Grace is using the Centre’s existing guidance.';
  // Retain only public conversation in an encrypted, expiring client-held envelope.
  // No protected projection is copied into a conversation token.
  if (!session && secret?.length>=32 && base.safetyLevel==='STANDARD' && base.boundary==='NONE')
    result.conversationToken=sealConversation([...turns,{user:body.message,assistant:result.answer}],owner,secret);
  return {status:200,body:result,browserId};
}
