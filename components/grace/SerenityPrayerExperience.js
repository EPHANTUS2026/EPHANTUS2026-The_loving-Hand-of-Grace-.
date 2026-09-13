'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import {SparklesIcon,XMarkIcon,PauseIcon,PlayIcon} from '@heroicons/react/24/outline';

const prayerLines=[
  'God, grant me the serenity',
  'to accept the things I cannot change,',
  'the courage to change the things I can,',
  'and the wisdom to know the difference.'
];

const secularLines=[
  'May I meet what I cannot change with acceptance.',
  'May I find courage for what is within my control.',
  'May I grow in wisdom to know the difference.'
];

export default function SerenityPrayerExperience(){
  const [mode,setMode]=useState(null);
  const [started,setStarted]=useState(false);
  const [step,setStep]=useState(0);
  const [paused,setPaused]=useState(false);
  const [done,setDone]=useState(false);
  const [reflection,setReflection]=useState(null);
  const lines=useMemo(()=>mode==='secular'?secularLines:prayerLines,[mode]);

  async function log(action){
    try{await fetch('/api/grace/prayer-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,mode:mode||'recite'})});}catch{}
  }
  async function begin(selected){setMode(selected);setStarted(true);setStep(0);setDone(false);setReflection(null);try{await fetch('/api/grace/prayer-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',mode:selected})});}catch{}}
  async function next(){if(paused)return;if(step>=lines.length-1){setDone(true);await log('complete');}else setStep(s=>s+1)}

  return <div className="min-h-screen bg-[radial-gradient(circle_at_50%_15%,rgba(221,214,254,.8),transparent_35%),linear-gradient(#fcfbff,#f8f7fb)] text-slate-900">
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 text-sm font-bold text-violet-800"><span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100"><SparklesIcon className="h-4 w-4"/></span>A moment with Grace</div><Link href="/knowledge/daily-meditations" aria-label="Leave quiet mode" className="rounded-full p-2 text-slate-500 hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"><XMarkIcon className="h-5 w-5"/></Link></div>

      {!started&&<section className="my-auto py-16 text-center"><h1 className="text-4xl font-black tracking-tight sm:text-5xl">We can take this slowly together.</h1><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">There’s nothing you need to do except be here for this moment.</p><div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2"><button onClick={()=>begin('recite')} className="min-h-14 rounded-2xl bg-violet-700 px-5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-400">Recite with Grace</button><button onClick={()=>begin('quiet')} className="min-h-14 rounded-2xl bg-white px-5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400">Read quietly</button><button onClick={()=>begin('reflect')} className="min-h-14 rounded-2xl bg-white px-5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400">Reflect on the prayer</button><button onClick={()=>begin('secular')} className="min-h-14 rounded-2xl bg-white px-5 font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400">Prefer a non-religious reflection?</button></div><p className="mx-auto mt-6 max-w-lg text-xs leading-5 text-slate-500">This is optional spiritual or reflective support. Grace does not claim divine authority and prayer does not replace counselling, clinical care or emergency help.</p></section>}

      {started&&!done&&mode==='quiet'&&<section className="my-auto py-16 text-center"><div className="mx-auto max-w-2xl space-y-6 text-2xl font-semibold leading-relaxed text-slate-800 sm:text-3xl">{prayerLines.map(line=><p key={line}>{line}</p>)}</div><div className="mt-12 flex justify-center gap-3"><button onClick={()=>setDone(true)} className="min-h-12 rounded-2xl bg-violet-700 px-6 font-bold text-white">Continue</button><Link href="/knowledge/daily-meditations" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-bold text-slate-600">Leave quietly</Link></div></section>}

      {started&&!done&&mode!=='quiet'&&<section className="my-auto py-16 text-center" aria-live="polite"><div className="text-xs font-black uppercase tracking-[.18em] text-violet-700">{mode==='secular'?'Acceptance · Courage · Wisdom':'Quiet Grace Mode'}</div><p className="mx-auto mt-8 max-w-2xl text-3xl font-semibold leading-relaxed text-slate-900 sm:text-5xl motion-reduce:transition-none">{lines[step]}</p><div className="mt-14 flex flex-wrap justify-center gap-3"><button onClick={()=>setPaused(v=>!v)} className="min-h-12 rounded-2xl bg-white px-5 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">{paused?<><PlayIcon className="mr-2 inline h-4 w-4"/>Resume</>:<><PauseIcon className="mr-2 inline h-4 w-4"/>Pause</>}</button><button onClick={next} disabled={paused} className="min-h-12 rounded-2xl bg-violet-700 px-6 font-bold text-white disabled:opacity-50">{step>=lines.length-1?'Finish':'Continue'}</button><Link href="/knowledge/daily-meditations" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-bold text-slate-600">Leave quietly</Link></div></section>}

      {done&&<section className="my-auto py-16 text-center"><div className="text-sm font-bold text-violet-700">A moment with Grace</div><h2 className="mx-auto mt-4 max-w-xl text-3xl font-black sm:text-4xl">Would you like to stay with one part for a moment?</h2>{!reflection?<div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-2">{['Acceptance','Courage','Wisdom'].map(x=><button key={x} onClick={()=>setReflection(x)} className="min-h-12 rounded-2xl bg-white px-5 font-bold shadow-sm ring-1 ring-slate-200">{x}</button>)}<Link href="/knowledge/daily-meditations" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-violet-700 px-5 font-bold text-white">I’m okay for now</Link></div>:<div className="mx-auto mt-8 max-w-xl rounded-[28px] bg-white p-7 text-left shadow-sm ring-1 ring-slate-100"><div className="text-xs font-black uppercase tracking-[.14em] text-violet-700">{reflection}</div><p className="mt-3 text-xl font-semibold leading-8">{reflection==='Acceptance'?'What feels outside your control today?':reflection==='Courage'?'What is one small action that is within your control?':'Would it help to separate what you can change from what you cannot?'}</p><p className="mt-4 text-sm leading-6 text-slate-500">You do not have to answer. Your reflection is not stored by this experience.</p><Link href="/knowledge/daily-meditations" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 font-bold text-white">Finish quietly</Link></div>}</section>}
    </main>
  </div>;
}
