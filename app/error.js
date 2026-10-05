'use client';

import {useEffect} from 'react';

export default function Error({error, reset}) {
  useEffect(() => { console.error('LHG route error', error); }, [error]);
  return <main className="grid min-h-[60vh] place-items-center bg-slate-50 px-6 py-20">
    <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.18em] text-grace-700">The Loving Hand of Grace</p>
      <h1 className="mt-3 text-3xl font-black text-slate-950">We’re restoring this page</h1>
      <p className="mt-3 text-slate-600">This page encountered a temporary server error. Please try again.</p>
      <div className="mt-6 flex justify-center gap-3"><button onClick={() => reset()} className="rounded-full bg-grace-700 px-5 py-3 font-bold text-white">Try again</button><a href="/" className="rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-700">Return home</a></div>
    </section>
  </main>;
}
