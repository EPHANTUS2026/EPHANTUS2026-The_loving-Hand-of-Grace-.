import { createHmac } from 'node:crypto';
import { dbRpc } from '@/lib/supabase-rest';
import { validateEnquiry } from '@/lib/contact-validation.mjs';

const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ ok: false }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ ok: false }, 415);
  let body;
  try {
    const reader = request.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return reply({ ok: false }, 413); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return reply({ ok: false }, 400); }
  const data = validateEnquiry(body);
  if (!data) return reply({ ok: false, error: 'Please check the required fields.' }, 400);
  if (body.website) return reply({ ok: true });
  try {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('unavailable');
    const hash = value => createHmac('sha256', secret).update(value).digest('hex');
    const result = await dbRpc('submit_public_enquiry', {
      p_key: data.submissionId,
      p_fingerprint: hash(JSON.stringify(data)),
      p_contact_hash: hash(data.phone.replace(/\D/g, '')),
      p_name: data.name, p_phone: data.phone, p_email: data.email, p_service: data.service,
    });
    if (result?.status === 'limited') return reply({ ok: false, error: 'Please wait before trying again, or call the Centre.' }, 429);
    if (result?.status === 'conflict') return reply({ ok: false, error: 'Please reload the form before making a new enquiry.' }, 409);
    if (result?.status !== 'accepted') throw new Error('unavailable');
    return reply({ ok: true }, 201);
  } catch { return reply({ ok: false, error: 'Enquiries are temporarily unavailable. Please contact the Centre directly.' }, 503); }
}
