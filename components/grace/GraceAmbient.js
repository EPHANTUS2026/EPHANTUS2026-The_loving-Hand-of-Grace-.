'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

function graceContext(pathname=''){
  if(pathname.startsWith('/programs') || pathname.startsWith('/services')) return {label:'Ask Grace about treatment', context:'treatment'};
  if(pathname.startsWith('/admissions')) return {label:'Ask Grace about admission', context:'admissions'};
  if(pathname.startsWith('/recovery-journey')) return {label:'Ask Grace about this stage', context:'recovery'};
  if(pathname.startsWith('/family')) return {label:'Ask Grace for family guidance', context:'family'};
  if(pathname.startsWith('/portal')) return {label:'Talk with Grace', context:'my_space'};
  if(pathname.startsWith('/knowledge')) return {label:'Ask Grace to explain', context:'knowledge'};
  if(pathname.startsWith('/contact')) return {label:'Ask Grace for help', context:'contact'};
  return {label:'Talk with Grace', context:'visitor'};
}

export default function GraceAmbient(){
  const pathname=usePathname() || '/';
  const [expanded,setExpanded]=useState(false);
  const {label,context}=graceContext(pathname);

  // Staff/admin workspaces use their governed staff-specific Grace experiences instead.
  if(pathname.startsWith('/staff') || pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/grace')) return null;

  return <div className="fixed bottom-5 right-4 z-40 sm:bottom-7 sm:right-7">
    {expanded && <div className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/15">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-extrabold text-slate-950">Grace</p><p className="mt-1 text-sm leading-6 text-slate-600">I can explain, guide and help you find the right next step. Clinical decisions remain with qualified professionals.</p></div>
        <button onClick={()=>setExpanded(false)} aria-label="Close Grace" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5"/></button>
      </div>
      <Link href={`/grace?context=${encodeURIComponent(context)}`} className="btn-primary mt-4 w-full justify-center">{label}</Link>
      <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">Grace guides. GraceFlow coordinates approved actions. Humans remain accountable for care decisions.</p>
    </div>}
    <button onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} aria-label={label} className="group flex items-center gap-2 rounded-full border border-grace-200 bg-white px-4 py-3 font-bold text-grace-900 shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-grace-300 hover:shadow-2xl">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-grace-800 text-white"><SparklesIcon className="h-4 w-4"/></span>
      <span className="max-w-[13rem] truncate text-sm">{label}</span>
    </button>
  </div>;
}
