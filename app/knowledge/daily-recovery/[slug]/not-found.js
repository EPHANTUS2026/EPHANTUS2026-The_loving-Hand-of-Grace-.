import Link from 'next/link';

export default function MeditationUnavailable(){
 return <main className="section bg-slate-50 text-slate-900"><section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
  <p className="text-sm font-bold text-grace-700">Daily Recovery</p>
  <h1 className="mt-3 text-3xl font-black">This meditation is not available yet</h1>
  <p className="mt-4 text-base leading-8 text-slate-700">The link may refer to a reflection that has not been published, or an address that is no longer available. Reflections appear publicly after the Centre’s required reviews.</p>
  <p className="mt-3 text-base leading-8 text-slate-700">You can return to Daily Recovery or explore the existing recovery resources in Knowledge.</p>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/knowledge/daily-recovery" className="btn btn-primary">Return to Daily Recovery</Link><Link href="/knowledge" className="btn btn-secondary">Explore Knowledge</Link></div>
 </section></main>;
}
