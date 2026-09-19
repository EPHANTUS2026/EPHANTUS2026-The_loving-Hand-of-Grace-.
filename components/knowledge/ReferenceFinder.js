'use client';

import {useMemo,useState} from 'react';
import {ArrowTopRightOnSquareIcon,MagnifyingGlassIcon} from '@heroicons/react/24/outline';

const references=[
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:"Bill's Story",pages:'1–16',keywords:['story','beginning','recovery'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'There Is a Solution',pages:'17–29',keywords:['solution','fellowship','recovery'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'More About Alcoholism',pages:'30–43',keywords:['alcoholism','powerlessness'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'We Agnostics',pages:'44–57',keywords:['faith','agnostic','spirituality'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'How It Works',pages:'58–71',keywords:['steps','program','inventory'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'Into Action',pages:'72–88',keywords:['action','amends','inventory'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'Working With Others',pages:'89–103',keywords:['service','sponsorship','helping others'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'To Wives',pages:'104–121',keywords:['family','relationships'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'The Family Afterward',pages:'122–135',keywords:['family','home','relationships'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'To Employers',pages:'136–150',keywords:['work','employment'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'AA',book:'Alcoholics Anonymous — Big Book',section:'A Vision For You',pages:'151–164',keywords:['hope','future','fellowship'],url:'https://www.aa.org/the-big-book'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Am I an Addict?',pages:'1',keywords:['addict','newcomer','self-assessment'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Welcome to Narcotics Anonymous',pages:'9',keywords:['welcome','newcomer'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'For the Newcomer',pages:'15',keywords:['newcomer','starting recovery'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Another Look',pages:'21',keywords:['addiction','recovery'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'How It Works',pages:'28',keywords:['steps','program','recovery'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Self-Acceptance',pages:'102',keywords:['acceptance','self-acceptance'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Sponsorship, Revised',pages:'107',keywords:['sponsor','sponsorship'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:"One Addict's Experience with Acceptance, Faith, and Commitment",pages:'117',keywords:['acceptance','faith','commitment'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Just for Today',pages:'122',keywords:['today','daily','meditation'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Staying Clean on the Outside',pages:'127',keywords:['staying clean','community','reintegration'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'},
 {fellowship:'NA',book:'An Introductory Guide to Narcotics Anonymous',section:'Recovery and Relapse',pages:'135',keywords:['relapse','recovery'],url:'https://na.org/e-lit/an-introductory-guide-to-na/'}
];

const norm=v=>String(v||'').toLowerCase().replace(/[–—]/g,'-').trim();
const pageMatches=(pages,q)=>{
 const nums=(q.match(/\d+/g)||[]).map(Number); if(!nums.length)return false;
 const p=(pages.match(/\d+/g)||[]).map(Number); if(!p.length)return false;
 const lo=p[0],hi=p[p.length-1]; return nums.some(n=>n>=lo&&n<=hi);
};

export default function ReferenceFinder(){
 const [query,setQuery]=useState('');
 const [fellowship,setFellowship]=useState('ALL');
 const results=useMemo(()=>{const q=norm(query);return references.filter(r=>{
  if(fellowship!=='ALL'&&r.fellowship!==fellowship)return false;
  if(!q)return true;
  const hay=norm([r.book,r.section,r.pages,...r.keywords].join(' '));
  return hay.includes(q)||pageMatches(r.pages,q);
 }).slice(0,12)},[query,fellowship]);
 return <section id="reference-finder" className="rounded-[2rem] border border-grace-100 bg-grace-50 p-5 sm:p-7">
  <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Recovery Literature Reference Finder</div>
   <h2 className="mt-2 text-2xl font-black text-slate-950">Find a chapter, page or recovery topic.</h2>
   <p className="mt-2 text-sm leading-6 text-slate-600">Search approved reference metadata, then continue reading on the official AA or NA website. Loving Hand of Grace does not copy the books into this search index.</p>
  </div>
  <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
   <label className="relative block"><span className="sr-only">Search recovery literature references</span><MagnifyingGlassIcon aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Try “page 58”, “acceptance”, “relapse” or “sponsorship”' className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-grace-500 focus:ring-2 focus:ring-grace-200"/></label>
   <div className="flex rounded-2xl border border-slate-200 bg-white p-1" aria-label="Filter by fellowship">{['ALL','NA','AA'].map(x=><button key={x} type="button" onClick={()=>setFellowship(x)} className={'min-h-10 rounded-xl px-4 text-sm font-bold '+(fellowship===x?'bg-grace-800 text-white':'text-slate-600 hover:bg-slate-50')}>{x==='ALL'?'All':x}</button>)}</div>
  </div>
  <div className="mt-5 grid gap-3">{results.length?results.map((r,i)=><article key={r.fellowship+r.section+i} className="rounded-2xl border border-slate-200 bg-white p-5">
   <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-grace-700"><span>{r.fellowship}</span><span aria-hidden="true">·</span><span>{r.pages.includes('–')?'Pages':'Page'} {r.pages}</span></div>
   <h3 className="mt-2 text-lg font-black text-slate-950">{r.section}</h3><p className="mt-1 text-sm text-slate-600">{r.book}</p>
   <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-bold text-grace-800">Open official source <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-4 w-4"/></a>
  </article>):<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No verified reference metadata matches that search yet. Try a chapter, page number, or another recovery topic.</div>}</div>
  <p className="mt-4 text-xs leading-5 text-slate-500">Reference metadata is edition/source specific. Confirm the page shown on the official source before citing it in clinical, educational or group work.</p>
 </section>
}