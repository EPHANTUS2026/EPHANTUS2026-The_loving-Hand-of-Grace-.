export const SAFETY_PROTOCOL=Object.freeze({
  priority:'OVERRIDES_ORDINARY_CONVERSATION',
  states:['HIGH_CONCERN','URGENT_SAFETY'],
  prohibited:['DIAGNOSE','PRESCRIBE','PROLONG_ACUTE_EMERGENCY_CHAT','CLAIM_FALSE_ESCALATION'],
  fallback:'Use approved static emergency/help guidance and direct the person to appropriate human or emergency support when model/provider services are unavailable.'
});

export function safetyDisposition({safetyLevel='STANDARD',providerAvailable=true}={}){
  if(safetyLevel==='EMERGENCY') return {state:'URGENT_SAFETY',strategy:'SAFETY_PROTOCOL',modelRequired:false,humanEscalation:true,fallback:!providerAvailable};
  if(safetyLevel==='CONCERN') return {state:'HIGH_CONCERN',strategy:'HUMAN_HANDOFF',modelRequired:false,humanEscalation:true,fallback:!providerAvailable};
  return {state:'CALM',strategy:'NORMAL',modelRequired:true,humanEscalation:false,fallback:false};
}
