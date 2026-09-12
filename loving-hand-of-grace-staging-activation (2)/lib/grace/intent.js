export function classifyIntent(message='') {
  const t=message.toLowerCase();
  if (/admission|admit|where do we start|needs help|assessment/.test(t)) return 'admissions';
  if (/family|my brother|my sister|my husband|my wife|my child|loved one/.test(t)) return 'family_support';
  if (/appointment|book|schedule|callback|call me/.test(t)) return 'appointment';
  if (/bill|fee|price|cost|payment|mpesa|m-pesa/.test(t)) return 'billing';
  if (/programme|program|residential|outpatient|treatment option/.test(t)) return 'programmes';
  if (/relapse|trigger|craving|recovery|addiction|coping/.test(t)) return 'education';
  if (/privacy|data|record|information about/.test(t)) return 'privacy';
  return 'general';
}
