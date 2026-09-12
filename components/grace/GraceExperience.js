'use client';

import {useMemo,useState} from 'react';
import {
  SparklesIcon, BookOpenIcon, ArrowPathIcon, HeartIcon, MapPinIcon,
  Squares2X2Icon, XMarkIcon, PaperAirplaneIcon, ShieldCheckIcon,
  InformationCircleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

const moods=[
  {score:5,emoji:'😊',label:'Great'},
  {score:4,emoji:'🙂',label:'Good'},
  {score:3,emoji:'😐',label:'Okay'},
  {score:2,emoji:'😟',label:'Low'},
  {score:1,emoji:'😔',label:'Struggling'},
];

const copingTools=[
  {title:'Box breathing',description:'Inhale 4, hold 4, exhale 4, hold 4. Follow the rhythm.',icon:ArrowPathIcon},
  {title:'5-4-3-2-1 grounding',description:'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',icon:Squares2X2Icon},
  {title:'Self-compassion pause',description:"Hand on heart. Say: ‘This is hard. I’m doing my best. I can take one small step.’",icon:HeartIcon},
  {title:'Body scan',description:'Slowly notice each part of your body, toes to crown, without judgement.',icon:MapPinIcon},
];

const library=[
  {category:'UNDERSTANDING ADDICTION',title:'Understanding the Cycle of Addiction',description:'How addiction can affect reward, habits and decision-making.'},
  {category:'COPING SKILLS',title:'Riding Out a Craving: The 4 Ds',description:'Delay, Distract, Deep-breathe, De-catastrophize.'},
  {category:'RELAPSE PREVENTION',title:'Creating a Relapse Prevention Plan',description:'Map triggers, warning signs and support contacts.'},
  {category:'FAMILY SUPPORT',title:'Supporting a Loved One in Recovery',description:'Listening, boundaries and self-care for families.'},
];

function SourceDetails({sources=[]}){
  const [open,setOpen]=useState(false);
  if(!sources.length) return null;
  return <div className="mt-3">
    <button onClick={()=>setOpen(!open)} className="text-xs font-semibold text-violet-700 hover:text-violet-900">Why Grace said this</button>
    {open&&<div className="mt-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-3 text-xs leading-5 text-slate-600">
      {sources.map(s=><div key={s.id} className="mb-2 last:mb-0"><b className="text-slate-800">{s.title}</b> · {s.section}<br/>Updated {s.updated}</div>)}
    </div>}
  </div>
}

function GraceChat({open,onClose}){
  const [messages,setMessages]=useState([
    {role:'grace',text:"I'm Grace, the AI assistant for The Loving Hand of Grace. I can help you understand our services and find the right next step. I'm not a doctor, therapist or emergency service.",state:'VERIFIED'}
  ]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);

  async function send(e){
    e?.preventDefault(); const text=input.trim(); if(!text||loading)return;
    setMessages(m=>[...m,{role:'user',text}]); setInput(''); setLoading(true);
    try{
      const r=await fetch('/api/grace/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,context:'client_portal'})});
      const data=await r.json();
      setMessages(m=>[...m,{role:'grace',text:data.answer||data.error||'I could not answer that safely.',state:data.state,sources:data.sources||[],handoff:data.handoff}]);
    }catch{setMessages(m=>[...m,{role:'grace',text:'I could not connect just now. Please use the Centre contact options if you need assistance.',state:'UNKNOWN'}]);}
    finally{setLoading(false)}
  }

  if(!open)return null;
  return <div className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-sm sm:flex sm:items-end sm:justify-end sm:p-5">
    <section className="flex h-full w-full flex-col bg-white shadow-2xl sm:h-[720px] sm:max-h-[88vh] sm:w-[430px] sm:rounded-[30px]">
      <header className="flex items-start justify-between border-b border-slate-100 p-5">
        <div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><SparklesIcon className="h-6 w-6"/></div><div><h2 className="font-black text-slate-950">Talk to Grace</h2><p className="text-xs text-slate-500">Guidance with dignity. Support with boundaries.</p></div></div>
        <button aria-label="Close Grace" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><XMarkIcon className="h-5 w-5"/></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m,i)=><div key={i} className={m.role==='user'?'ml-12':'mr-8'}>
          <div className={m.role==='user'?'rounded-3xl rounded-br-lg bg-violet-600 px-4 py-3 text-sm leading-6 text-white':'rounded-3xl rounded-bl-lg bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700'}>{m.text}</div>
          {m.role==='grace'&&<><div className="mt-1.5 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>{m.state||'GENERAL'}</span>{m.handoff&&<span>· Human handoff: {m.handoff}</span>}</div><SourceDetails sources={m.sources}/></>}
        </div>)}
        {loading&&<div className="mr-8 rounded-3xl rounded-bl-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">Grace is checking approved information…</div>}
      </div>
      <div className="border-t border-slate-100 p-4"><div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900"><ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0"/>Grace does not diagnose, prescribe, replace professionals or manage emergencies.</div><form onSubmit={send} className="flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400" placeholder="Ask Grace…"/><button className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white hover:bg-violet-700"><PaperAirplaneIcon className="h-5 w-5"/></button></form></div>
    </section>
  </div>
}

export default function GraceExperience({name='there',clinicLinked=false,initialCheckins=[]}){
  const [mood,setMood]=useState(4); const [craving,setCraving]=useState(2); const [coping,setCoping]=useState(''); const [note,setNote]=useState('');
  const [saved,setSaved]=useState(false); const [saving,setSaving]=useState(false); const [chat,setChat]=useState(false); const [checkins,setCheckins]=useState(initialCheckins);
  const greeting=useMemo(()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'},[]);
  async function save(){setSaving(true);setSaved(false);try{const r=await fetch('/api/grace/check-in',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood,craving,coping,note})});if(r.ok){setSaved(true);setCheckins(v=>[{id:`local-${Date.now()}`,mood_score:mood,craving_level:craving,coping_tool:coping||null,created_at:new Date().toISOString()},...v].slice(0,14));}}finally{setSaving(false)}}

  return <div className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(199,210,254,.55),transparent_28%),radial-gradient(circle_at_55%_88%,rgba(204,251,241,.55),transparent_30%),linear-gradient(#fbfcff,#f8fbff)] text-slate-900">
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-10 sm:px-8 lg:pt-16">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100"><SparklesIcon className="h-4 w-4"/>Grace is here with you</div>
      <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{name==='there'?`${greeting}.`:`${greeting}, ${name}.`}</h1>
      <p className="mt-3 text-lg text-slate-500">There’s no rush here. You can check in, use a coping tool, or ask Grace for guidance.</p>

      {!clinicLinked&&<div className="mt-10 rounded-3xl border border-violet-100 bg-white/70 p-5 text-sm leading-6 text-slate-600 shadow-sm">Welcome to Grace. Your clinic can link your account so approved check-ins are saved to your care workspace. In the meantime, the coping tools below are here for you.</div>}

      <section className="mt-10 rounded-[30px] bg-white/90 p-6 shadow-[0_24px_70px_rgba(55,65,81,.08)] ring-1 ring-slate-100 sm:p-8">
        <h2 className="text-2xl font-black">How are you feeling right now?</h2><p className="mt-1 text-slate-500">Pick whatever feels true. There are no wrong answers.</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">{moods.map(m=><button key={m.score} onClick={()=>setMood(m.score)} className={`rounded-2xl border px-3 py-5 text-center transition ${mood===m.score?'border-violet-400 bg-violet-50 ring-2 ring-violet-100':'border-slate-200 bg-white hover:border-violet-200'}`}><div className="text-3xl">{m.emoji}</div><div className="mt-2 text-xs font-bold text-slate-600">{m.label}</div></button>)}</div>
        <div className="mt-8 flex items-center justify-between"><label className="font-bold text-slate-700">Craving level</label><span className="font-bold text-violet-600">{craving}/10</span></div>
        <input aria-label="Craving level" type="range" min="0" max="10" value={craving} onChange={e=>setCraving(Number(e.target.value))} className="mt-3 w-full accent-violet-600"/>
        <label className="mt-6 block font-bold text-slate-700">What helped you cope today?</label>
        <select value={coping} onChange={e=>setCoping(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 outline-none focus:border-violet-400"><option value="">Choose one (optional)</option><option>Breathing / grounding</option><option>Talked with someone</option><option>Movement / exercise</option><option>Prayer / reflection</option><option>Rest / sleep</option><option>Recovery meeting / support group</option><option>Other</option></select>
        <label className="mt-6 block font-bold text-slate-700">Anything on your mind?</label><textarea value={note} onChange={e=>setNote(e.target.value)} rows="4" placeholder="Write freely, or leave blank — it’s your space." className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-slate-600 outline-none focus:border-violet-400"/>
        <button onClick={save} disabled={saving} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-400 to-violet-400 px-6 py-4 font-bold text-white shadow-lg shadow-violet-100 transition hover:brightness-95 disabled:opacity-60">{saving?'Saving…':saved?'Check-in saved':'Save today’s check-in'}</button>
        {saved&&<div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-700"><CheckCircleIcon className="h-4 w-4"/>Saved securely.</div>}
      </section>

      <section className="mt-10 rounded-[30px] bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><h2 className="text-2xl font-black">Your mood over time</h2><p className="mt-1 text-slate-500">A gentle view of your journey — every dip and rise is part of it.</p>{checkins.length?<div className="mt-8"><div className="flex h-36 items-end gap-2 rounded-2xl bg-slate-50 p-4">{[...checkins].reverse().map(x=><div key={x.id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div title={`Mood ${x.mood_score}/5`} className="w-full rounded-t-lg bg-violet-300" style={{height:`${Math.max(18,Number(x.mood_score)*18)}px`}}/><span className="text-[9px] text-slate-400">{new Date(x.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>)}</div><div className="mt-3 text-xs text-slate-400">This chart reflects your saved check-ins only. It is a personal support view, not a diagnosis or clinical score.</div></div>:<div className="mt-8 grid min-h-32 place-items-center rounded-2xl bg-slate-50 text-sm text-slate-400">Your saved check-ins will appear here once you start.</div>}</section>

      <section className="mt-14"><h2 className="text-2xl font-black">Coping tools</h2><p className="mt-1 text-slate-500">Small, gentle practices you can turn to in any moment.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{copingTools.map(({title,description,icon:Icon})=><button key={title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-600"><Icon className="h-6 w-6"/></span><span><b className="block text-lg">{title}</b><span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span></span></button>)}</div></section>

      <section className="mt-12"><div className="flex items-center gap-2"><BookOpenIcon className="h-6 w-6 text-violet-600"/><h2 className="text-2xl font-black">From the library</h2></div><p className="mt-1 text-slate-500">Read when you’re ready — no pressure.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{library.map(x=><article key={x.title} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm"><div className="text-xs font-bold tracking-wide text-violet-600">{x.category}</div><h3 className="mt-2 text-lg font-black">{x.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{x.description}</p></article>)}</div></section>

      <section className="mt-12 rounded-[30px] border border-violet-100 bg-violet-50/60 p-6 sm:p-8"><div className="flex items-start gap-3"><InformationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-violet-700"/><div><h2 className="font-black">What Grace can and cannot do</h2><p className="mt-2 text-sm leading-6 text-slate-600">Grace can explain approved Centre information, guide admissions, provide general recovery education, help families, navigate services and coordinate human contact. Grace cannot diagnose, prescribe, manage emergencies, guarantee outcomes or make independent clinical decisions.</p></div></div></section>
      <div className="mt-14 text-center text-sm text-slate-400">Grace is with you, one moment at a time. <span aria-hidden>💜</span></div>
    </main>
    <button onClick={()=>setChat(true)} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 font-bold text-white shadow-xl shadow-violet-300/40"><SparklesIcon className="h-6 w-6"/>Talk to Grace</button>
    <GraceChat open={chat} onClose={()=>setChat(false)}/>
  </div>
}
