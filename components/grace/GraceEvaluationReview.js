'use client';
import {useState} from 'react';
export default function GraceEvaluationReview({scenarios,reviews}) {
 const [selected,setSelected]=useState(scenarios[0].id);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const scenario=scenarios.find(x=>x.id===selected);
 async function submit(event){
  event.preventDefault();if(busy)return;setBusy(true);
  const form=event.currentTarget;
  const data=Object.fromEntries(new FormData(form));
  try{
   const response=await fetch('/api/admin/grace/evaluation-reviews',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...data,scenarioId:selected,score:Number(data.score)})});
   setStatus(response.ok?'Review recorded. Refresh to view updated review history.':'Review could not be recorded.');
  }catch{setStatus('Review could not be recorded.');}finally{setBusy(false);}
 }
 return <div className="space-y-6">
  <p className="rounded-xl bg-amber-50 p-4 text-sm">200 synthetic scenarios: 40 conversation cases across five authority contexts. These require Centre review. They are not evidence of 200 successful conversations or a completed clinical pilot.</p>
  <label className="grid gap-2 font-semibold">Scenario<select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
   {scenarios.map(s=><option key={s.id} value={s.id}>{s.id} · {s.mode} · {s.category}</option>)}</select></label>
  <article className="card"><h2 className="text-lg font-bold">{scenario.mode} · {scenario.category}</h2>
   <p className="mt-4">{scenario.message}</p><p className="mt-4 text-sm text-slate-600">Expected behaviour: {scenario.expectation}</p>
   <p className="mt-2 text-xs">Split: {scenario.split}. Synthetic server identity must be configured in the test harness; typing a role into chat does not grant it.</p></article>
  <form onSubmit={submit} className="card grid gap-4">
   <h2 className="text-lg font-bold">Record a review of observed evidence</h2>
   <p className="text-sm text-slate-600">Review the actual candidate response and its evidence before scoring. Use only synthetic evidence identifiers here, never patient details.</p>
   <label className="grid gap-2">Candidate commit<input className="input" name="commit" pattern="[a-f0-9]{40}" required maxLength={40}/></label>
   <label className="grid gap-2">Evaluation evidence ID<input className="input" name="evidenceId" required pattern="[A-Za-z0-9_-]{1,100}" maxLength={100}/></label>
   <label className="grid gap-2">Usefulness score<select className="input" name="score" required><option value="">Select</option>{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="grid gap-2">Decision<select className="input" name="decision" required><option value="changes_required">Changes required</option><option value="accepted">Accepted for this scenario</option></select></label>
   <button className="btn-primary w-fit" disabled={busy}>{busy?'Saving…':'Record review'}</button><p role="status">{status}</p>
  </form>
  <section className="card"><h2 className="font-bold">Recent reviews</h2>{reviews.length?reviews.map(r=><p key={r.id} className="mt-3 text-sm">{r.scenario_id} · {r.decision} · {r.score}/5 · {r.candidate_commit.slice(0,8)}</p>):<p className="mt-3">No Centre reviews recorded.</p>}</section>
 </div>;
}
