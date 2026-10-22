export const enquiryServices = ['general', 'residential-rehabilitation', 'outpatient-support', 'relapse-prevention', 'family-program', 'life-skills-reintegration', 'aftercare'];
export function validateEnquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const allowed = ['name', 'phone', 'email', 'service', 'consent', 'website', 'submissionId'];
  if (Object.keys(body).some(key => !allowed.includes(key))) return null;
  if (allowed.some(key => body[key] !== undefined && typeof body[key] !== 'string')) return null;
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!name || name.length > 120 || /[\x00-\x1f<>]/.test(name)) return null;
  if (!/^\+?[0-9 ()-]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7) return null;
  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return null;
  if (!enquiryServices.includes(body.service) || body.consent !== 'yes') return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '')) return null;
  return { name, phone, email, service: body.service, submissionId: body.submissionId };
}
