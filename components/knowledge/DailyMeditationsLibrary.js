'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import {SparklesIcon,BookmarkIcon,CheckCircleIcon,CalendarDaysIcon,MagnifyingGlassIcon} from '@heroicons/react/24/outline';

const themes=['All','Acceptance','Courage','Hope','Gratitude','Relationships','Recovery','Self-awareness','Forgiveness','Resilience','Purpose','Reintegration','Family','Mindfulness'];

export default function DailyMeditationsLibrary({meditations=[],todayIso}){
  const [query,setQuery]=useState('');
  const [theme,setTheme]=useState('All');
  const [selected,setSelected]=useState(meditations.find(x=>x.meditation_date===todayIso)||meditations[0]||null);
  const [busy,setBusy]=useState('');
  const [notice,setNotice]=useState('');
  const filtered=useMemo(()=>meditations.filter(m=>{
    const q=query.trim().toLowerCase();
    const qok=!q||[m.title,m.excerpt,m.theme].some(v=>String(v||'').toLowerCase().includes(q));
    return qok&&(theme==='All'||m.theme===theme);
  }),[meditations,query,theme]);

  async function progress(action,meditation){
    setBusy(action);setNotice('');
    try{
      const r=await fetch('/api/meditations/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,meditation_id:meditation.id})});
      const data=await r.json();
      if(!r.ok) throw new Error(data?.error||'Action failed');
      setNotice(action==='save'?'Saved to My Reflections.':'Marked as read.');
    }catch(e){setNotice(e.message||'That action could not be completed.');}
    finally{setBusy('');}
  }

  return <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbff,#f7f7fb)] text-slate-900">
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
      <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.18em] text-violet-700">Daily Meditations</div><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">A moment for today. A library for the journey.</h1><p className="mt-4 text-lg leading-8 text-slate-600">Short, approved reflections to support recovery, self-awareness, hope and personal growth.</p></div>

      {!meditations.length&&<div className="mt-10 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black">No published meditations yet</h2><p className="mt-2 text-slate-600">Approved Daily Meditations will appear here after clinical and spiritual review.</p></div>}

      {selected&&<section className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_.7fr]">
        <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.06)] ring-1 ring-slate-100 sm:p-8">
          <div className="text-xs font-black uppercase tracking-[.16em] text-violet-700">{new Date(`${selected.meditation_date}T12:00:00`).toLocaleDateString('en-KE',{month:'long',day:'numeric'}).toUpperCase()}</div>
          <h2 className="mt-3 text-3xl font-black">{selected.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">{selected.theme}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{selected.reading_time_minutes} min read</span></div>
          <div className="mt-7 whitespace-pre-line text-[17px] leading-8 text-slate-700">{selected.body}</div>
          {selected.reflection_question&&<div className="mt-7 rounded-2xl bg-violet-50/70 p-5"><div className="text-xs font-black uppercase tracking-[.12em] text-violet-700">Reflect</div><p className="mt-2 text-lg font-semibold leading-7 text-slate-800">{selected.reflection_question}</p></div>}
          {selected.practice&&<div className="mt-4 rounded-2xl bg-slate-50 p-5"><div className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Practice for today</div><p className="mt-2 leading-7 text-slate-700">{selected.practice}</p></div>}
          <div className="mt-7 flex flex-wrap gap-3"><button disabled={busy==='save'} onClick={()=>progress('save',selected)} className="min-h-11 rounded-xl bg-slate-900 px-4 font-bold text-white"><BookmarkIcon className="mr-2 inline h-4 w-4"/>Save</button><button disabled={busy==='complete'} onClick={()=>progress('complete',selected)} className="min-h-11 rounded-xl bg-slate-100 px-4 font-bold text-slate-800"><CheckCircleIcon className="mr-2 inline h-4 w-4"/>Mark as Read</button><Link href={`/grace?context=my_space&meditation=${encodeURIComponent(selected.id)}`} className="inline-flex min-h-11 items-center rounded-xl bg-violet-100 px-4 font-bold text-violet-900"><SparklesIcon className="mr-2 h-4 w-4"/>Reflect with Grace</Link></div>
          {notice&&<p aria-live="polite" className="mt-4 text-sm text-slate-600">{notice}</p>}
        </article>
        <aside className="space-y-4"><div className="rounded-[28px] bg-gradient-to-br from-violet-50 to-white p-6 ring-1 ring-violet-100"><div className="flex items-center gap-2 text-sm font-black text-violet-800"><SparklesIcon className="h-5 w-5"/>A moment with Grace</div><h3 className="mt-3 text-2xl font-black">Recite the Serenity Prayer with me</h3><p className="mt-2 text-sm leading-6 text-slate-600">Take a quiet moment with Grace.</p><Link href="/grace/prayer" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 font-bold text-white">Begin quietly</Link><p className="mt-4 text-xs leading-5 text-slate-500">Prefer a non-religious reflection? A secular acceptance, courage and wisdom mode is available.</p></div></aside>
      </section>}

      {!!meditations.length&&<section className="mt-12"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">Browse all meditations</h2><p className="mt-1 text-sm text-slate-500">Explore by theme or return to a previous date.</p></div><div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDaysIcon className="h-5 w-5"/>{meditations.length} reflections available</div></div>
      <div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><span className="sr-only">Search meditations</span><MagnifyingGlassIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search meditations..." className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label><select aria-label="Filter meditation theme" value={theme} onChange={e=>setTheme(e.target.value)} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:ring-2 focus:ring-violet-100">{themes.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(m=><button key={m.id} onClick={()=>setSelected(m)} className="min-h-44 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400"><div className="text-[11px] font-black uppercase tracking-[.13em] text-violet-700">{m.theme}</div><h3 className="mt-2 text-xl font-black">{m.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{m.excerpt||m.body}</p><div className="mt-4 text-xs font-semibold text-slate-400">{new Date(`${m.meditation_date}T12:00:00`).toLocaleDateString('en-KE',{month:'short',day:'numeric'})} · {m.reading_time_minutes} min</div></button>)}</div></section>}
    </section>
  </main>;
}
