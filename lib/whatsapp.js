const CONTEXT_MESSAGES = {
  homepage: 'Hello The Loving Hand of Grace. I would like to learn more about the Centre.',
  admissions: 'Hello The Loving Hand of Grace. I would like to speak with someone about admissions.',
  assessment: 'Hello The Loving Hand of Grace. I would like help arranging a confidential assessment.',
  family_support: 'Hello The Loving Hand of Grace. I am looking for guidance for someone I care about.',
  facility_visit: 'Hello The Loving Hand of Grace. I would like to ask about visiting the Centre.',
  aftercare: 'Hello The Loving Hand of Grace. I would like information about aftercare support.',
  contact: 'Hello The Loving Hand of Grace. I would like to speak with the team.',
  grace_handoff: 'Hello The Loving Hand of Grace. I have been speaking with Grace and would like to continue with the admissions team.',
  default: 'Hello The Loving Hand of Grace. I would like to speak with someone from the Centre.'
};

export function normalizeWhatsAppNumber(value='') {
  let digits=String(value||'').replace(/\D/g,'');
  if (digits.startsWith('0')) digits=`254${digits.slice(1)}`;
  return digits;
}

export function whatsappContextFromPath(pathname='') {
  const p=String(pathname||'').toLowerCase();
  if (p.includes('book') || p.includes('assessment')) return 'assessment';
  if (p.includes('admission')) return 'admissions';
  if (p.includes('family')) return 'family_support';
  if (p.includes('aftercare')) return 'aftercare';
  if (p.includes('visit')) return 'facility_visit';
  if (p.includes('contact')) return 'contact';
  if (p==='/' || p==='') return 'homepage';
  return 'default';
}

export function getWhatsAppContextMessage({page, intent, bookingState, userType}={}) {
  const context = intent==='grace_handoff' ? 'grace_handoff' : (page || 'default');
  return {
    message: CONTEXT_MESSAGES[context] || CONTEXT_MESSAGES.default,
    sourceTag: context,
    privacyLevel: 'neutral'
  };
}

export function buildWhatsAppUrl({phone, message, source='website', context='default'}={}) {
  const normalized=normalizeWhatsAppNumber(phone);
  if (!normalized) return null;
  const safeMessage=String(message || CONTEXT_MESSAGES[context] || CONTEXT_MESSAGES.default).trim();
  return `https://wa.me/${normalized}?text=${encodeURIComponent(safeMessage)}`;
}

export function publicWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_PUBLIC_NUMBER || process.env.NEXT_PUBLIC_CENTRE_PHONE || '';
}
