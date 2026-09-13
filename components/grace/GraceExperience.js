'use client';

import {useEffect,useMemo,useState} from 'react';
import {
  SparklesIcon, BookOpenIcon, ArrowPathIcon, HeartIcon, MapPinIcon,
  Squares2X2Icon, XMarkIcon, PaperAirplaneIcon, ShieldCheckIcon,
  CheckCircleIcon, ChevronRightIcon, PauseIcon, PlayIcon
} from '@heroicons/react/24/outline';

const moods=[
  {score:5,emoji:'😊',label:'Great'},
  {score:4,emoji:'🙂',label:'Good'},
  {score:3,emoji:'😐',label:'Okay'},
  {score:2,emoji:'😟',label:'Low'},
  {score:1,emoji:'😔',label:'Struggling'},
];

const copingOptions=['Talking to someone','Exercise','Prayer / reflection','Breathing','Grounding','Rest','Music','Journaling','Meeting / group','Time outdoors','Routine','Other'];

const copingTools=[
  {id:'breathing',title:'Box breathing',description:'A paced breathing exercise: inhale, hold, exhale, hold.',icon:ArrowPathIcon},
  {id:'grounding',title:'5-4-3-2-1 grounding',description:'A sensory grounding exercise using what you can notice around you.',icon:Squares2X2Icon},
  {id:'compassion',title:'Self-compassion pause',description:'A short optional reflection for responding to a difficult moment with kindness.',icon:HeartIcon},
  {id:'body',title:'Body scan',description:'A slow body-awareness exercise. Stop at any time.',icon:MapPinIcon},
];

const library=[
  {category:'UNDERSTANDING ADDICTION',title:'Understanding the Cycle of Addiction',description:'How addiction can affect reward, habits and decision-making.'},
  {category:'COPING SKILLS',title:'Riding Out a Craving: The 4 Ds',description:'Delay, Distract, Deep-breathe, De-catastrophize.'},
];

function SourceDetails({sources=[]}){
  const [open,setOpen]=useState(false);
  if(!sources.length) return null;
  return <div className="mt-3">
    <button onClick={()=>setOpen(!open)} className="text-xs font-semibold text-violet-700 hover:text-violet-900">Why Grace said this</button>
    {open&&<div className="mt-2 rounded-2xl bg-violet-50/70 p-3 text-xs leading-5 text-slate-600">
      {sources.map(s=><div key={s.id} className="mb-2 last:mb-0"><b className="text-slate-800">{s.title}</b> · {s.section}<br/>Updated {s.updated}</div>)}
    </div>}
  </div>
}

function GraceChat({open,onClose}){
  const [messages,setMessages]=useState([{role:'grace',text:"I'm Grace. I can help you understand recovery information, explore a coping exercise or find the right next step. I don't replace your care team or emergency services.",state:'VERIFIED'}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);

  async function send(e){
    e?.preventDefault(); const text=input.trim(); if(!text||loading)return;
    setMessages(m=>[...m,{role:'user',text}]); setInput(''); setLoading(true);
    try{
      const r=await fetch('/api/grace/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,context:'my_space'})});
      const data=await r.json();
      setMessages(m=>[...m,{role:'grace',text:data.answer||data.error||'I could not answer that safely.',state:data.state,sources:data.sources||[],handoff:data.handoff}]);
    }catch{
      setMessages(m=>[...m,{role:'grace',text:'I could not connect just now. Please use the Centre contact options if you need assistance.',state:'UNKNOWN'}]);
    }finally{setLoading(false)}
  }

  if(!open)return null;
  return <div className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-sm sm:flex sm:items-end sm:justify-end sm:p-5">
    <section className="flex h-full w-full flex-col bg-white shadow-2xl sm:h-[720px] sm:max-h-[88vh] sm:w-[430px] sm:rounded-[30px]">
      <header className="flex items-start justify-between border-b border-slate-100 p-5">
        <div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><SparklesIcon className="h-6 w-6"/></div><div><h2 className="font-black text-slate-950">Grace</h2><p className="text-xs text-slate-500">Guidance with dignity. Support with boundaries.</p></div></div>
        <button aria-label="Close Grace" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"><XMarkIcon className="h-5 w-5"/></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {messages.map((m,i)=><div key={i} className={m.role==='user'?'ml-12':'mr-8'}>
          <div className={m.role==='user'?'rounded-3xl rounded-br-lg bg-violet-600 px-4 py-3 text-sm leading-6 text-white':'rounded-3xl rounded-bl-lg bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700'}>{m.text}</div>
          {m.role==='grace'&&<><div className="mt-1.5 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>{m.state||'GENERAL'}</span>{m.handoff&&<span>· Human handoff: {m.handoff}</span>}</div><SourceDetails sources={m.sources}/></>}
        </div>)}
        {loading&&<div className="mr-8 rounded-3xl rounded-bl-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">Grace is checking approved information…</div>}
      </div>
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900"><ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0"/>Grace can explain, guide and coordinate approved next steps. Clinical decisions remain with qualified professionals.</div>
        <form onSubmit={send} className="flex gap-2"><label className="sr-only" htmlFor="grace-message">Message to Grace</label><input id="grace-message" value={input} onChange={e=>setInput(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" placeholder="Message Grace…"/><button aria-label="Send message" className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"><PaperAirplaneIcon className="h-5 w-5"/></button></form>
      </div>
    </section>
  </div>
}

function cravingLabel(v){if(v===0)return 'None';if(v<=3)return 'Mild';if(v<=6)return 'Moderate';if(v<=8)return 'Strong';return 'Very strong'}

function MoodSelector({value,onChange,disabled}){
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{moods.map(m=><button type="button" key={m.score} aria-label={`${m.label} mood`} aria-pressed={value===m.score} disabled={disabled} onClick={()=>onChange(m.score)} className={`min-h-24 rounded-2xl px-3 py-4 text-center transition focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 ${value===m.score?'bg-violet-50 ring-2 ring-violet-200':'bg-slate-50 hover:bg-violet-50/70'}`}><div aria-hidden="true" className="text-2xl">{m.emoji}</div><div className="mt-2 text-xs font-bold text-slate-700">{m.label}</div></button>)}</div>
}

function CopingSelector({value,onChange,disabled}){
  function toggle(item){onChange(value.includes(item)?value.filter(x=>x!==item):[...value,item])}
  return <div className="flex flex-wrap gap-2">{copingOptions.map(item=><button type="button" key={item} disabled={disabled} aria-pressed={value.includes(item)} onClick={()=>toggle(item)} className={`min-h-11 rounded-full px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 ${value.includes(item)?'bg-violet-100 text-violet-900 ring-1 ring-violet-200':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>)}</div>
}

function ToolModal({tool,onClose}){
  const [running,setRunning]=useState(true);
  const [step,setStep]=useState(0);
  const [count,setCount]=useState(4);
  const phases=['Inhale','Hold','Exhale','Hold'];
  useEffect(()=>{
    if(!tool||tool.id!=='breathing'||!running)return;
    const id=setInterval(()=>setCount(c=>{if(c>1)return c-1;setStep(s=>(s+1)%4);return 4}),1000);
    return()=>clearInterval(id);
  },[tool,running]);
  useEffect(()=>{setStep(0);setCount(4);setRunning(true)},[tool]);
  if(!tool)return null;
  const grounding=['5 things you see','4 things you hear','3 things you can touch','2 things you smell','1 thing you taste'];
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm"><section className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={tool.title}>
    <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black">{tool.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">Optional wellbeing exercise. Stop whenever you want.</p></div><button onClick={onClose} aria-label="Exit exercise" className="rounded-xl p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"><XMarkIcon className="h-5 w-5"/></button></div>
    {tool.id==='breathing'&&<div className="mt-7 text-center"><div className={`mx-auto grid h-36 w-36 place-items-center rounded-full bg-violet-100 text-violet-800 transition-transform duration-1000 motion-reduce:transition-none ${phases[step]==='Inhale'?'scale-110':phases[step]==='Exhale'?'scale-90':'scale-100'}`}><div><div className="text-lg font-black">{phases[step]}</div><div className="text-4xl font-black">{count}</div></div></div><div className="mt-6 flex justify-center gap-2"><button onClick={()=>setRunning(v=>!v)} className="min-h-11 rounded-xl bg-slate-100 px-4 font-semibold">{running?<><PauseIcon className="mr-2 inline h-4 w-4"/>Pause</>:<><PlayIcon className="mr-2 inline h-4 w-4"/>Resume</>}</button><button onClick={()=>{setStep(0);setCount(4);setRunning(true)}} className="min-h-11 rounded-xl bg-slate-100 px-4 font-semibold">Restart</button></div></div>}
    {tool.id==='grounding'&&<div className="mt-6"><div className="rounded-2xl bg-slate-50 p-6 text-center"><div className="text-sm font-bold text-violet-700">Step {Math.min(step+1,5)} of 5</div><div className="mt-2 text-xl font-black">{grounding[Math.min(step,4)]}</div></div><div className="mt-4 flex justify-between"><button onClick={onClose} className="min-h-11 rounded-xl px-4 font-semibold text-slate-600">Exit</button><button onClick={()=>step>=4?onClose():setStep(s=>s+1)} className="min-h-11 rounded-xl bg-violet-600 px-4 font-semibold text-white">{step>=4?'Finish':'Next / Skip'}</button></div></div>}
    {tool.id==='compassion'&&<div className="mt-6 space-y-3 text-sm leading-6 text-slate-700"><p className="rounded-2xl bg-slate-50 p-4">Notice what is difficult without judging yourself for having the feeling.</p><p className="rounded-2xl bg-slate-50 p-4">You might remind yourself: “This is a hard moment, and I can choose one supportive next step.”</p><button onClick={onClose} className="min-h-11 rounded-xl bg-violet-600 px-4 font-semibold text-white">Done</button></div>}
    {tool.id==='body'&&<div className="mt-6 space-y-3 text-sm leading-6 text-slate-700"><p className="rounded-2xl bg-slate-50 p-4">Notice your feet, legs, hands, shoulders, jaw and breathing. You do not need to change anything. Simply notice what is present.</p><p className="text-xs text-slate-500">Audio is not enabled in this version.</p><button onClick={onClose} className="min-h-11 rounded-xl bg-violet-600 px-4 font-semibold text-white">Exit exercise</button></div>}
  </section></div>
}

function RecentCheckins({checkins}){
  const recent=[...checkins].slice(0,7).reverse();
  return <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between"><div><h3 className="font-black">Your recent check-ins</h3><p className="mt-1 text-xs text-slate-500">Personal trends, not a diagnosis or recovery score.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">7 days</span></div>
    {recent.length?<div className="mt-4"><div className="flex h-20 items-end gap-2">{recent.map(x=><div key={x.id} className="flex flex-1 flex-col items-center justify-end gap-1"><div aria-label={`Mood ${x.mood_score} of 5`} className="w-full rounded-t-md bg-violet-300" style={{height:`${Math.max(12,Number(x.mood_score)*11)}px`}}/><span className="text-[9px] text-slate-400">{new Date(x.created_at).toLocaleDateString(undefined,{weekday:'narrow'})}</span></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-2"><span className="text-slate-400">Mood</span><b className="block text-slate-700">{recent.at(-1)?.mood_score}/5 latest</b></div><div className="rounded-xl bg-slate-50 p-2"><span className="text-slate-400">Craving</span><b className="block text-slate-700">{recent.at(-1)?.craving_level}/10 latest</b></div></div></div>:<div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Your check-ins will appear here as you build your journey.</div>}
  </section>
}

export default function GraceExperience({name='there',clinicLinked=false,initialCheckins=[]}){
  const latestToday=useMemo(()=>initialCheckins.find(x=>new Date(x.created_at).toDateString()===new Date().toDateString())||null,[initialCheckins]);
  const [mood,setMood]=useState(latestToday?.mood_score||4);
  const [craving,setCraving]=useState(latestToday?.craving_level||0);
  const [coping,setCoping]=useState(latestToday?.coping_tool?String(latestToday.coping_tool).split(' | ').filter(Boolean):[]);
  const [note,setNote]=useState('');
  const [saved,setSaved]=useState(Boolean(latestToday));
  const [editing,setEditing]=useState(!latestToday);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [chat,setChat]=useState(false);
  const [tool,setTool]=useState(null);
  const [checkins,setCheckins]=useState(initialCheckins);
  const greeting=useMemo(()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'},[]);

  async function save(){
    setSaving(true);setSaveError('');
    try{
      const r=await fetch('/api/grace/check-in',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mood,craving,coping,note})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Check-in could not be saved.');
      const created={id:data.id||`local-${Date.now()}`,mood_score:mood,craving_level:craving,coping_tool:coping.join(' | ')||null,created_at:data.created_at||new Date().toISOString()};
      setCheckins(v=>[created,...v.filter(x=>new Date(x.created_at).toDateString()!==new Date().toDateString())].slice(0,30));
      setSaved(true);setEditing(false);setNote('');
    }catch(e){setSaveError(e.message||'Check-in could not be saved.');}
    finally{setSaving(false)}
  }

  return <div className="min-h-screen bg-[radial-gradient(circle_at_10%_4%,rgba(221,214,254,.55),transparent_25%),radial-gradient(circle_at_90%_20%,rgba(224,231,255,.5),transparent_24%),linear-gradient(#fcfcff,#f8f9fd)] text-slate-900">
    <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100"><SparklesIcon className="h-4 w-4"/>Grace is here with you</div><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{name==='there'?`${greeting}.`:`${greeting}, ${name}.`}</h1><p className="mt-2 text-base text-slate-500">How are you feeling today?</p></div>
        {!clinicLinked&&<div className="max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Your account is not yet linked to a care record. Personal check-ins may be unavailable until access is configured.</div>}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <section className="rounded-[28px] bg-white/95 p-5 shadow-[0_24px_70px_rgba(55,65,81,.08)] ring-1 ring-slate-100 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">{saved&&!editing?'Today’s check-in':'How are you feeling right now?'}</h2><p className="mt-1 text-sm text-slate-500">{saved&&!editing?'Saved for today. Update it only if you want to.':'Choose what feels closest.'}</p></div>{saved&&!editing&&<button onClick={()=>setEditing(true)} className="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700">Update check-in</button>}</div>

          {saved&&!editing?<div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-violet-50 p-4"><div className="text-xs font-semibold text-violet-600">Mood</div><div className="mt-1 text-lg font-black">{moods.find(x=>x.score===mood)?.label||mood}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-semibold text-slate-500">Craving</div><div className="mt-1 text-lg font-black">{craving}/10 · {cravingLabel(craving)}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-semibold text-slate-500">Coping</div><div className="mt-1 text-sm font-bold">{coping.length?coping.join(', '):'Not recorded'}</div></div><div className="sm:col-span-3"><button onClick={()=>setChat(true)} className="text-sm font-semibold text-violet-700">Would you like to talk with Grace about anything you entered? <span className="font-normal text-slate-500">Your private note is not shared automatically.</span></button></div></div>:<div className="mt-5">
            <MoodSelector value={mood} onChange={setMood} disabled={saving}/>
            <div className="mt-6"><div className="flex items-center justify-between"><label htmlFor="craving" className="font-bold text-slate-700">Craving level</label><span className="text-sm font-bold text-violet-700">{craving}/10 · {cravingLabel(craving)}</span></div><input id="craving" aria-valuetext={`${craving} of 10, ${cravingLabel(craving)}`} type="range" min="0" max="10" value={craving} disabled={saving} onChange={e=>setCraving(Number(e.target.value))} className="mt-3 w-full accent-violet-600"/><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>0 None</span><span>10 Very strong</span></div></div>
            <div className="mt-6"><div className="font-bold text-slate-700">What helped you cope today?</div><p className="mt-1 text-xs text-slate-500">Optional. Select any that apply.</p><div className="mt-3"><CopingSelector value={coping} onChange={setCoping} disabled={saving}/></div></div>
            <div className="mt-6"><div className="flex items-center justify-between"><label htmlFor="private-note" className="font-bold text-slate-700">Anything on your mind?</label><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Private check-in note</span></div><textarea id="private-note" value={note} onChange={e=>setNote(e.target.value)} rows="3" placeholder="Write freely, or leave this blank." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/><p className="mt-2 text-[11px] leading-5 text-slate-500">This note is saved as check-in data according to your care permissions. It is not sent to Grace AI automatically.</p></div>
            <div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={save} disabled={saving||!clinicLinked} className="min-h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 font-bold text-white shadow-lg shadow-violet-100 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{saving?'Saving…':'Save today’s check-in'}</button>{saved&&<button onClick={()=>setEditing(false)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600">Cancel update</button>}</div>
            <div aria-live="polite" className="mt-3">{saveError&&<div className="text-sm text-rose-700">{saveError}</div>}</div>
          </div>}
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-gradient-to-br from-white to-violet-50/70 p-5 shadow-sm ring-1 ring-violet-100"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-100 text-violet-700"><SparklesIcon className="h-5 w-5"/></span><h2 className="text-lg font-black">Grace</h2></div><p className="mt-3 text-sm leading-6 text-slate-600">I’m here if you’d like to talk through today, explore a coping exercise, or understand something about recovery.</p><div className="mt-4 grid gap-2"><button onClick={()=>setChat(true)} className="min-h-11 rounded-xl bg-violet-600 px-4 text-left text-sm font-semibold text-white">Talk with Grace</button><button onClick={()=>setChat(true)} className="min-h-11 rounded-xl bg-white px-4 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Help with a craving</button><button onClick={()=>setTool(copingTools[0])} className="min-h-11 rounded-xl bg-white px-4 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Try a coping exercise</button></div></section>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between"><h3 className="font-black">Tools for right now</h3><button onClick={()=>setTool(copingTools[0])} className="text-xs font-semibold text-violet-700">View all tools →</button></div><div className="mt-3 grid gap-2">{copingTools.slice(0,2).map(({id,title,description,icon:Icon})=><button key={id} onClick={()=>setTool(copingTools.find(x=>x.id===id))} className="flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5"/></span><span><b className="block text-sm">{title}</b><span className="block text-[11px] leading-4 text-slate-500">{description}</span></span></button>)}</div></section>

          <RecentCheckins checkins={checkins}/>
        </aside>
      </div>

      <section className="mt-5 rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2"><BookOpenIcon className="h-5 w-5 text-violet-600"/><h2 className="text-lg font-black">Recommended for you</h2></div><p className="mt-1 text-xs text-slate-500">Approved recovery resources selected from the Centre’s library.</p></div><a href="/knowledge" className="hidden text-sm font-semibold text-violet-700 sm:block">Explore the Recovery Library →</a></div><div className="mt-4 grid gap-3 md:grid-cols-2">{library.map(x=><article key={x.title} className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-bold tracking-wide text-violet-600">{x.category}</div><h3 className="mt-1 font-black">{x.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{x.description}</p></article>)}</div><a href="/knowledge" className="mt-4 inline-flex items-center text-sm font-semibold text-violet-700 sm:hidden">Explore the Recovery Library <ChevronRightIcon className="ml-1 h-4 w-4"/></a></section>
    </main>

    <GraceChat open={chat} onClose={()=>setChat(false)}/>
    <ToolModal tool={tool} onClose={()=>setTool(null)}/>
  </div>;
}
