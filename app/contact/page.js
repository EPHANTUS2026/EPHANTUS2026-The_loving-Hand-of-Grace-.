'use client';
import { useRef, useState } from 'react';
import PageHero from '@/components/PageHero';
import { centre } from '@/lib/config';
import { services, serviceSlugs } from '@/lib/services';
import { validateEnquiry } from '@/lib/contact-validation.mjs';

const inputClass = 'rounded-2xl border border-slate-300 px-4 py-3 font-normal focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grace-700';
export default function Contact() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submissionId = useRef(null);
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    submissionId.current ||= crypto.randomUUID();
    const data = { ...Object.fromEntries(new FormData(form).entries()), submissionId: submissionId.current };
    if (!validateEnquiry(data)) { setStatus('Please check your name, phone number, service and consent.'); return; }
    submitting.current = true; setBusy(true); setStatus('Sending…');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) { setSent(true); form.reset(); setStatus('Thank you. Your enquiry has been received. The Centre can follow up using your contact details.'); }
      else { const result = await response.json(); setStatus(result.error || 'Please try again or contact the Centre directly.'); }
    } catch { setStatus('We could not confirm delivery. Please retry; the same enquiry will not be submitted twice.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <><PageHero backgroundImage="/images/contact/garden-path.webp" eyebrow="Contact" title="Start with a confidential enquiry." description="Leave your contact details and the service you would like to discuss. Suitability and private care information are discussed during assessment." />
    <section className="section"><div className="container-page grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
      <aside className="space-y-5"><div className="card"><h2 className="text-xl font-bold">Contact the Centre</h2>
        <dl className="mt-6 space-y-5">{[['Phone', centre.phone], ['Email', centre.email], ['Location', centre.address], ['Enquiry hours', centre.hours]].map(([label, value]) => <div key={label}><dt className="text-sm font-bold">{label}</dt><dd className="mt-1 wrap-break-word text-slate-600">{value || 'Contact the Centre for details'}</dd></div>)}</dl>
        <div className="mt-6 flex flex-wrap gap-3"><a className="btn-primary" href={'tel:' + centre.phone.replace(/[^+0-9]/g, '')}>Speak to the Centre</a><a className="btn-secondary" href={'mailto:' + centre.email}>Email the Centre</a></div>
      </div><p className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950"><strong>Urgent concern:</strong> this form is not an emergency service. Contact local emergency services or go to the nearest hospital if someone is in immediate danger or needs urgent medical or psychiatric care.</p></aside>
      <form onSubmit={submit} className="card grid gap-5" aria-label="Confidential enquiry" aria-describedby="enquiry-privacy">
        <h2 className="text-2xl font-bold">Request Confidential Support</h2>
        <p id="enquiry-privacy" className="text-sm leading-6 text-slate-600">Do not provide medical details, assessment results or information about another person. We use these details to respond to your enquiry. Confidentiality is subject to applicable safeguarding responsibilities.</p>
        {!sent && <><div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" name="name" maxLength={120} autoComplete="name" />
          <Field label="Your phone number" name="phone" type="tel" maxLength={30} pattern="[+0-9 ()-]{7,30}" autoComplete="tel" />
          <Field label="Email (optional)" name="email" type="email" required={false} maxLength={160} autoComplete="email" />
          <label className="grid gap-2 text-sm font-semibold">Service<select name="service" required className={inputClass}><option value="general">Help choosing a service</option>{serviceSlugs.map(slug => <option key={slug} value={slug}>{services[slug].title}</option>)}</select></label>
        </div>
        <div hidden aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="flex gap-3 text-sm text-slate-600"><input name="consent" value="yes" type="checkbox" required className="mt-1" /><span>I consent to the Centre contacting me about this enquiry. I understand that this form is not for emergencies.</span></label>
        <button disabled={busy} className="btn-primary w-fit disabled:cursor-not-allowed disabled:opacity-60" type="submit">{busy ? 'Sending…' : 'Send confidential enquiry'}</button></>}
        <p role="status" aria-live="polite" className="text-sm font-semibold text-grace-800">{status}</p>
      </form>
    </div></section></>;
}
function Field({ label, required = true, ...props }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}<input {...props} required={required} className={inputClass} /></label>;
}
