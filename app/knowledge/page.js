import PageHero from '@/components/PageHero';
import { ArrowTopRightOnSquareIcon, BookOpenIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import {dbAdminSelect} from '@/lib/supabase-rest';

const resources=[
  {
    title:'Just for Today',
    subtitle:'Daily Meditation for Recovering Addicts',
    description:"Start your day with today's Just for Today meditation from Narcotics Anonymous World Services.",
    href:'https://na.org/daily-meditations/jft/',
    cta:"Read Today's Meditation",
    Icon:BookOpenIcon
  },
  {
    title:'A Spiritual Principle a Day',
    subtitle:'Daily Recovery Reflection',
    description:"Explore today's spiritual-principle reflection through the official Narcotics Anonymous daily meditation resources.",
    href:'https://na.org/daily-meditations/',
    cta:"Read Today's Spiritual Principle",
    Icon:CalendarDaysIcon
  }
];

export default async function Page(){
  let rows=[];
  try{rows=await dbAdminSelect('knowledge_articles','approval_status=eq.APPROVED&archived=eq.false&select=id,title,summary,last_reviewed_at,next_review_at,version&order=updated_at.desc&limit=50')}catch{}
  return <>
    <PageHero eyebrow="Knowledge" title="Trusted resources for recovery, reflection and continued growth." description="Access reviewed Centre information and clearly attributed external recovery resources. Grace does not present unverified information as institutional truth."/>
    <section className="section bg-grace-50">
      <div className="container-page">
        <p className="eyebrow">Daily Recovery</p>
        <h2 className="h2">A day at a time.</h2>
        <p className="lead max-w-3xl">Access trusted daily recovery reflections and spiritual resources that can support reflection, recovery and personal growth.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {resources.map(({title,subtitle,description,href,cta,Icon})=><article key={title} className="card">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grace-100"><Icon className="h-6 w-6 text-grace-800"/></div>
            <p className="mt-5 text-xs font-black uppercase tracking-[.14em] text-grace-700">{subtitle}</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{title}</h3>
            <p className="mt-3 leading-7 text-slate-600">{description}</p>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={cta+' on the Narcotics Anonymous World Services website — opens in a new tab'} className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-grace-800 hover:underline">
              {cta}<ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true"/>
            </a>
            <p className="mt-3 text-xs text-slate-500">Official Narcotics Anonymous World Services resource · Opens in a new tab</p>
          </article>)}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          Narcotics Anonymous owns and publishes these external resources. The Loving Hand of Grace provides convenient access and does not reproduce or represent itself as the publisher of NA literature.
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container-page">
        <p className="eyebrow">Centre Knowledge</p>
        <h2 className="h2">Reviewed information for recovery, families and care navigation.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rows.length?rows.map(a=><article key={a.id} className="card"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Approved · v{a.version}</div><h3 className="mt-3 text-xl font-black">{a.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{a.summary}</p><div className="mt-5 text-xs text-slate-400">Reviewed {a.last_reviewed_at?new Date(a.last_reviewed_at).toLocaleDateString('en-KE'):'—'}</div></article>):<div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 md:col-span-2">No approved public knowledge articles have been published yet.</div>}
        </div>
      </div>
    </section>
  </>;
}
