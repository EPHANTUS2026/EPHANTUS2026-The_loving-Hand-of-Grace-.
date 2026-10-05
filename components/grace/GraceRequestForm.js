'use client';
import {useRef,useState} from 'react';
export default function GraceRequestForm({onClose}){
 const key=useRef(null);const draft=useRef(null);const sending=useRef(false);
 const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);const [submitted,setSubmitted]=useState(false);
 async function submit(event){
  event.preventDefault();if(sending.current)return;
  const body=Object.fromEntries(new FormData(event.currentTarget));
  const fingerprint=JSON.stringify(body);if(draft.current&&draft.current!==fingerprint){setStatus('An earlier submission is unconfirmed. Retry the unchanged request or contact the Centre before changing it.');return;}draft.current ||= fingerprint;key.current ||= crypto.randomUUID();
  sending.current=true;setBusy(true);
  try{
   const response=await fetch('/api/grace/action',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...body,consent:body.consent==='yes',idempotencyKey:key.current})});
   const result=await response.json();
   if(response.ok&&result.confirmed){setSubmitted(true);setStatus(result.message);}
   else setStatus(result.error||'The request was not confirmed. Contact the Centre directly.');
  }catch{setStatus('Delivery could not be confirmed. Retry the same request safely or contact the Centre.');}
  finally{sending.current=false;setBusy(false);}
 }
 return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-violet-200 bg-white p-4 text-sm">
  <div className="flex justify-between gap-3"><h3 className="font-bold">Request team contact</h3><button type="button" onClick={onClose} className="underline">Close</button></div>
  <p>This submits a request to admissions triage. Staff response hours and acknowledgement time need confirmation with the Centre. This is a queued request, not a live conversation. It does not book an appointment or provide emergency assistance. Do not include medical details.</p>
  {!submitted&&<>
   <label>Request<select name="action" className="input"><option value="request_callback">Callback</option><option value="appointment_request">Assessment request</option><option value="admissions_contact">Admissions enquiry</option><option value="family_support_contact">Family support</option><option value="aftercare_contact">Aftercare support</option></select></label>
   <label>Your name<input name="name" required maxLength={120} autoComplete="name" className="input"/></label>
   <label>Phone<input name="phone" required type="tel" maxLength={40} pattern="[+0-9 ()-]{7,40}" autoComplete="tel" className="input"/></label>
   <label>Email (optional)<input name="email" type="email" maxLength={160} autoComplete="email" className="input"/></label>
   <label className="flex gap-2"><input type="checkbox" name="consent" value="yes" required/><span>I confirm this request and consent to the Centre contacting me.</span></label>
   <button disabled={busy} className="btn-primary">{busy?'Submitting…':'Confirm and submit request'}</button>
  </>}
  <p role="status">{status}</p>
 </form>;
}
