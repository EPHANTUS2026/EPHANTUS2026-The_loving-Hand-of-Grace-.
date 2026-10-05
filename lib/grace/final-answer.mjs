// These checks complement review and source evaluation; they do not prove semantic truth.
export function validateFinalAnswer({answer,sourceIds=[],sources=[],needsSources=false}) {
  const reasons=[];
  if (typeof answer!=='string' || !answer.trim()) reasons.push('empty');
  if (/guaranteed recovery|definitely cured|you (?:have been|are) diagnosed|take \d+\s*mg|stop (?:your|taking).*medication/i.test(answer)) reasons.push('clinical_overreach');
  if (/\b(?:i(?:'ve| have)? (?:booked|sent|saved|scheduled|notified|contacted)|you(?:'re| are) booked|(?:appointment|booking) is confirmed|request has been completed)\b/i.test(answer)) reasons.push('unconfirmed_action');
  if (/100% confidential|completely confidential|only (?:our |the )clinical team will see|call you (?:back )?in (?:the next )?30 minutes|connecting you .*now/i.test(answer)) reasons.push('unsupported_privacy_or_handoff');
  if (/https?:\/\/|\[[^\]]+\]\(/i.test(answer)) reasons.push('unvalidated_link');
  if (sourceIds.some(id=>!sources.some(s=>s.id===id))) reasons.push('invalid_citation');
  if (needsSources && sourceIds.length===0) reasons.push('missing_evidence');
  return {result:reasons.length?'BLOCK':'PASS',reasons};
}
