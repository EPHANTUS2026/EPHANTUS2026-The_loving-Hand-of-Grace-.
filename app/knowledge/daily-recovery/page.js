import Link from 'next/link';
import {publishedMeditations} from '@/lib/daily-recovery';

export const dynamic='force-dynamic';
export const metadata={title:'Daily Recovery | The Loving Hand of Grace',description:'Reflections for recovery, families and everyday encouragement.'};
export default async function DailyRecovery(){
 let meditations=[],unavailable=false;
 try{meditations=await publishedMeditations();}catch{unavailable=true;}
 const featured=meditations.find(m=>m.slug==='beginning-again')||meditations.find(m=>m.featured);
 return <div className="section bg-slate-50 text-slate-900"><div className="container-page">
  <nav aria-label="Breadcrumb" className="mb-6 text-sm"><Link href="/knowledge" className="font-bold text-grace-700 underline">Knowledge</Link><span aria-hidden="true"> / </span><span>Daily Recovery</span></nav>
  <h1 className="text-4xl font-black sm:text-5xl">Daily Recovery</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">Reflections for recovery, families and everyday encouragement. Take a quiet moment, consider a question, and choose one small next step. Faith-based passages are optional.</p>
  {featured&&<section aria-label="Featured meditation" className="mt-8 rounded-3xl border border-grace-200 bg-white p-6 sm:p-8"><p className="text-sm font-bold text-grace-700">Featured · {featured.theme}</p><h2 className="mt-3 text-3xl font-black">{featured.title}</h2><p className="mt-4 max-w-3xl text-lg leading-8">{featured.main_quotation||featured.excerpt}</p><Link className="btn btn-primary mt-5" href={'/knowledge/daily-recovery/'+featured.slug}>Read featured meditation</Link></section>}
  {unavailable?<p role="status" className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">The reflection library is temporarily unavailable. Please try again later.</p>:!meditations.length&&<p className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">No meditations are published yet. Reflections will appear after the Centre’s required reviews.</p>}
  {!!meditations.length&&<section className="mt-10" aria-label="All meditations"><h2 className="text-2xl font-black">Explore the reflections</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{meditations.map(m=><article key={m.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-grace-700">{m.theme}</p><h3 className="mt-3 text-2xl font-black">{m.title}</h3>{m.audience&&<p className="mt-2 text-sm text-slate-600">{m.audience}</p>}<p className="mt-4 flex-1 text-base leading-7 text-slate-700">{(m.excerpt||m.main_quotation||m.body).slice(0,145)}{(m.excerpt||m.main_quotation||m.body).length>145?'…':''}</p><Link className="mt-5 inline-flex min-h-11 items-center font-bold text-grace-700 underline underline-offset-4 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-grace-700" href={'/knowledge/daily-recovery/'+m.slug} aria-label={'Read meditation: '+m.title}>Read meditation →</Link></article>)}</div></section>}
  <div className="mt-10 flex flex-wrap gap-4"><Link href="/knowledge" className="btn btn-secondary">Return to Knowledge</Link><Link href="/knowledge/daily-meditations" className="btn btn-secondary">Date-based meditation library</Link></div>
 </div></div>;
}
