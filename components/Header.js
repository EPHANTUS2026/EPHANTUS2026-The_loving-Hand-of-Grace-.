'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon, PhoneIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const links = [['Treatment','/programs'],['Recovery Journey','/recovery-journey'],['Families','/family'],['Life at Grace','/life-at-grace'],['Knowledge','/knowledge'],['Contact','/contact'],['My Space','/portal']];
const aboutLinks = [['About Us','/about'],['Our Team','/team']];

export default function Header(){
  const [open,setOpen]=useState(false);
  const [aboutOpen,setAboutOpen]=useState(false);
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="container-page flex h-20 items-center justify-between">
      <Link href="/" className="flex min-w-0 items-center gap-3" onClick={()=>setOpen(false)}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grace-800 text-lg font-black text-white shadow-sm">LG</span>
        <span className="min-w-0"><span className="block truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">The Loving Hand of Grace</span><span className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-grace-700 sm:block">Rehabilitation & Treatment Centre</span></span>
      </Link>
      <nav className="hidden items-center gap-6 lg:flex">
        <div className="group relative">
          <button className="flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-grace-800" aria-haspopup="true">About Us <ChevronDownIcon className="h-4 w-4"/></button>
          <div className="invisible absolute left-0 top-full z-50 w-48 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{aboutLinks.map(([n,h])=><Link className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-grace-50 hover:text-grace-800" key={h} href={h}>{n}</Link>)}</div>
          </div>
        </div>
        {links.map(([n,h])=><Link className="text-sm font-semibold text-slate-700 transition hover:text-grace-800" key={h} href={h}>{n}</Link>)}<Link href="/contact" className="btn-primary"><PhoneIcon className="mr-2 h-4 w-4"/>Request Help</Link>
      </nav>
      <button aria-label="Toggle menu" aria-expanded={open} className="rounded-xl p-2 lg:hidden" onClick={()=>setOpen(!open)}>{open?<XMarkIcon className="h-7 w-7"/>:<Bars3Icon className="h-7 w-7"/>}</button>
    </div>
    {open && <div className="border-t bg-white lg:hidden"><div className="container-page grid gap-2 py-5">
      <button onClick={()=>setAboutOpen(!aboutOpen)} aria-expanded={aboutOpen} className="flex items-center justify-between rounded-xl px-3 py-3 text-left font-semibold hover:bg-grace-50"><span>About Us</span><ChevronDownIcon className={`h-4 w-4 transition ${aboutOpen?'rotate-180':''}`}/></button>
      {aboutOpen && <div className="ml-3 grid gap-1 border-l border-grace-100 pl-3">{aboutLinks.map(([n,h])=><Link onClick={()=>setOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-slate-700 hover:bg-grace-50" key={h} href={h}>{n}</Link>)}</div>}
      {links.map(([n,h])=><Link onClick={()=>setOpen(false)} className="rounded-xl px-3 py-3 font-semibold hover:bg-grace-50" key={h} href={h}>{n}</Link>)}<Link onClick={()=>setOpen(false)} href="/contact" className="btn-primary mt-2">Request Help</Link></div></div>}
  </header>
}
