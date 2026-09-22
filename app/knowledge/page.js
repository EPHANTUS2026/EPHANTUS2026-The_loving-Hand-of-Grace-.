import Link from 'next/link';
import PageHero from '@/components/PageHero';
import {dbAdminSelect} from '@/lib/supabase-rest';
import {RECOVERY_RESOURCES} from '@/lib/recovery-resources';

const literature=[
  RECOVERY_RESOURCES.basicText,
  RECOVERY_RESOURCES.livingClean,
  RECOVERY_RESOURCES.aaBigBook,
  RECOVERY_RESOURCES.aaTwelveAndTwelve
];
const daily=[RECOVERY_RESOURCES.jft,RECOVERY_RESOURCES.spiritualPrinciple];

function ResourceCard({resource}){
  return <article className="card flex h-full flex-col">
    <div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">{resource.provider}</div>
    <h3 className="mt-3 text-xl font-black">{resource.title}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-500">{resource.subtitle}</p>
    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{resource.description}</p>
    <a className="mt-5 inline-flex font-bold text-grace-700 underline underline-offset-4" href={resource.officialUrl} target="_blank" rel="noopener noreferrer">Open official resource ↗</a>
  </article>
}

export default async function Page(){
  let rows=[];
  try{rows=await dbAdminSelect('knowledge_articles','approval_status=eq.APPROVED&archived=eq.false&select=id,title,summary,last_reviewed_at,next_review_at,version&order=updated_at.desc&limit=50')}catch{}
  return <>
    <PageHero eyebrow="Knowledge" title="Recovery knowledge, literature and care navigation." description="Use reviewed Centre knowledge alongside official fellowship literature. Grace does not reproduce, invent or present external fellowship literature as Centre-authored content."/>
    <section className="section"><div className="container-page">
      <div className="mb-8 flex flex-wrap gap-3">
        <a className="btn btn-primary" href="#recovery-literature">Recovery Literature</a>
        <a className="btn btn-secondary" href="#daily-recovery">Daily Recovery</a>
        <a className="btn btn-secondary" href="#centre-knowledge">Centre Knowledge</a>
      </div>
      <div id="recovery-literature">
        <div className="mb-5"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Official external resources</div><h2 className="mt-2 text-2xl font-black">Recovery Literature</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Open fellowship-approved literature from the official Narcotics Anonymous and Alcoholics Anonymous publishers. LHG links to these sources rather than copying or altering their books.</p></div>
        <div className="grid gap-4 md:grid-cols-2">{literature.map(r=><ResourceCard key={r.id} resource={r}/>)}</div>
      </div>
      <div id="daily-recovery" className="mt-12">
        <div className="mb-5"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Daily recovery</div><h2 className="mt-2 text-2xl font-black">Daily Meditations & Reflections</h2><p className="mt-2 text-sm leading-6 text-slate-600">Use the official daily resources, or open LHG's date-aware Daily Meditations experience.</p></div>
        <div className="mb-4"><Link className="font-bold text-grace-700 underline underline-offset-4" href="/knowledge/daily-meditations">Open Daily Meditations →</Link></div>
        <div className="grid gap-4 md:grid-cols-2">{daily.map(r=><ResourceCard key={r.id} resource={r}/>)}</div>
      </div>
      <div id="centre-knowledge" className="mt-12">
        <div className="mb-5"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Governed institutional knowledge</div><h2 className="mt-2 text-2xl font-black">Reviewed Centre Knowledge</h2></div>
        <div className="grid gap-4 md:grid-cols-2">{rows.length?rows.map(a=><article key={a.id} className="card"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Approved · v{a.version}</div><h3 className="mt-3 text-xl font-black">{a.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{a.summary}</p><div className="mt-5 text-xs text-slate-400">Reviewed {a.last_reviewed_at?new Date(a.last_reviewed_at).toLocaleDateString('en-KE'):'—'}</div></article>):<div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 md:col-span-2">No approved public Centre knowledge articles have been published yet. Official recovery literature above remains available.</div>}</div>
      </div>
    </div></section>
  </>
}
