'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';

const links = [['About','/about'],['Treatment','/programs'],['Recovery Journey','/recovery-journey'],['Families','/family'],['Life at Grace','/life-at-grace'],['Knowledge','/knowledge'],['Contact','/contact'],['My Space','/portal']];

export default function Header(){
  const [open,setOpen]=useState(false);
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="container-page flex h-20 items-center justify-between">
      <Link href="/" className="flex min-w-0 items-center gap-3" onClick={()=>setOpen(false)}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grace-800 text-lg font-black text-white shadow-sm">LG</span>
        <span className="min-w-0"><span className="block truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">The Loving Hand of Grace</span><span className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-grace-700 sm:block">Rehabilitation & Treatment Centre</span></span>
      </Link>
      <nav className="hidden items-center gap-6 lg:flex">{links.map(([n,h])=><Link className="text-sm font-semibold text-slate-700 transition hover:text-grace-800" key={h} href={h}>{n}</Link>)}<Link href="/contact" className="btn-primary"><PhoneIcon className="mr-2 h-4 w-4"/>Request Help</Link></nav>
      <button aria-label="Toggle menu" aria-expanded={open} className="rounded-xl p-2 lg:hidden" onClick={()=>setOpen(!open)}>{open?<XMarkIcon className="h-7 w-7"/>:<Bars3Icon className="h-7 w-7"/>}</button>
    </div>
    {open && <div className="border-t bg-white lg:hidden"><div className="container-page grid gap-2 py-5">{links.map(([n,h])=><Link onClick={()=>setOpen(false)} className="rounded-xl px-3 py-3 font-semibold hover:bg-grace-50" key={h} href={h}>{n}</Link>)}<Link onClick={()=>setOpen(false)} href="/contact" className="btn-primary mt-2">Request Help</Link></div></div>}
  </header>
}
