import Link from 'next/link';
import PageHero from '@/components/PageHero';

const spaces=[
 {title:'Reception & welcome',description:'A calm first point of contact for arrival, orientation and practical assistance as clients and families begin their journey with Grace.'},
 {title:'Accommodation',description:'Residential spaces intended to support rest, routine, privacy and the everyday structure that forms part of recovery.'},
 {title:'Counselling rooms',description:'Private environments for confidential counselling, therapeutic conversations and appropriate one-to-one support.'},
 {title:'Group therapy spaces',description:'Supportive spaces for facilitated group sessions, shared learning and recovery-focused connection with others.'},
 {title:'Dining',description:'A communal setting for meals and healthy daily routines, supporting structure, connection and everyday wellbeing.'},
 {title:'Wellness areas',description:'Spaces for appropriate wellness, reflection and restorative activities that complement the wider recovery journey.'},
 {title:'Garden & outdoor areas',description:'Outdoor environments for fresh air, quiet reflection, appropriate recreation and connection with the natural environment.'},
 {title:'Family spaces',description:'Appropriate spaces for consent-aware family visits, communication and reconnection as part of supported recovery.'},
 {title:'Training & life-skills areas',description:'Learning environments for practical skills, personal development and preparation for sustainable reintegration.'},
 {title:'Recreation',description:'Spaces for healthy leisure, appropriate activity and positive social connection within the recovery environment.'},
 {title:'Reflection / worship spaces',description:'Quiet spaces for personal reflection and voluntary spiritual practice, respecting each person’s dignity and beliefs.'},
 {title:'Administration & support',description:'The operational setting where authorized staff coordinate admissions, care support and essential facility services.'}
];

const day=[
 ['Morning','Personal preparation, breakfast, reflection or wellbeing activity, and preparation for the day.'],
 ['Daytime','Counselling or therapeutic activities, recovery education, appropriate group activities, skills development, meals and breaks.'],
 ['Afternoon','Continued programme activities, wellness, recreation and personal development.'],
 ['Evening','Dinner, community or reflection time, appropriate peer connection and preparation for rest.']
];

const pillars=[
 ['Recovery & wellbeing','Structured routine, counselling, peer connection, healthy living, rest, wellness and recovery education can support the wider recovery journey. Individual care and schedules may differ.'],
 ['Community & connection','Life at Grace encourages respectful community, healthy communication, appropriate boundaries, shared responsibility and positive social connection.'],
 ['Learning & life skills','Where available within an individual programme, practical learning can support communication, healthy routines, goal setting, personal responsibility and preparation for reintegration.'],
 ['Reflection & personal growth','Quiet reflection, values, meaning and voluntary spiritual practice can form part of personal growth while respecting each person’s dignity and beliefs.']
];

export default function Page(){
 return <main className="overflow-x-hidden">
  <PageHero eyebrow="Life at Grace" title="Recovery is more than treatment. It is rebuilding everyday life." description="Explore the spaces, routines, relationships and experiences that can support recovery, wellbeing and reintegration at The Loving Hand of Grace."/>

  <section className="section"><div className="container-page">
   <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
    <div><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">The experience</div><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Life centred on the person.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Life at Grace is about more than rooms. It is the everyday environment around safety, dignity, connection, learning and progress through recovery. Programme activities and individual schedules vary according to appropriate care planning.</p></div>
    <div className="flex flex-wrap gap-3 lg:justify-end"><Link href="/contact" className="btn-primary">Talk to Admissions</Link><Link href="/grace" className="btn-secondary">Ask Grace</Link></div>
   </div>
  </div></section>

  <section className="section bg-slate-50"><div className="container-page">
   <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">A day at Grace</div><h2 className="mt-3 text-3xl font-black text-slate-950">Structure without pretending every journey is identical.</h2><p className="mt-3 text-sm leading-7 text-slate-600">This is an orientation to the rhythm of a day, not a fixed timetable. Activities vary according to individual care plans and programme requirements.</p></div>
   <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{day.map(([title,description],i)=><article key={title} className="card min-w-0"><div className="text-xs font-black text-grace-700">{String(i+1).padStart(2,'0')}</div><h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
  </div></section>

  <section className="section"><div className="container-page">
   <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Explore our spaces</div><h2 className="mt-3 text-3xl font-black text-slate-950">Spaces that support everyday recovery.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Only approved and verified facility information should appear here. Facility photography and accessibility details can be introduced progressively after review.</p></div>
   <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{spaces.map((space,i)=><article key={space.title} className="card h-full min-w-0 overflow-hidden"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Space {String(i+1).padStart(2,'0')}</div><h3 className="mt-4 break-words text-xl font-black leading-tight text-slate-950">{space.title}</h3><p className="mt-3 break-words text-sm leading-6 text-slate-600">{space.description}</p></article>)}</div>
  </div></section>

  <section className="section bg-slate-950 text-white"><div className="container-page">
   <div className="max-w-3xl"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-300">Recovery in everyday life</div><h2 className="mt-3 text-3xl font-black">Wellbeing, connection, capability and growth.</h2></div>
   <div className="mt-8 grid gap-4 md:grid-cols-2">{pillars.map(([title,description])=><article key={title} className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-6"><h3 className="text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{description}</p></article>)}</div>
  </div></section>

  <section className="section"><div className="container-page">
   <div className="grid gap-6 lg:grid-cols-2">
    <article className="card"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Family & circle of care</div><h2 className="mt-3 text-2xl font-black text-slate-950">Relationships matter. Consent matters too.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Families can be important partners in recovery, but participation and information sharing must remain governed by client consent, privacy, safeguarding, clinical appropriateness and authorization. Private recovery information never belongs on this public page.</p></article>
    <article className="card"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Life beyond Grace</div><h2 className="mt-3 text-2xl font-black text-slate-950">Preparing for the next chapter.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Recovery continues beyond residential care. Appropriate aftercare, recovery planning, family reintegration, skills development, goals and ongoing support can help people prepare for greater stability and independence.</p><Link href="/portal" className="mt-5 inline-flex font-bold text-grace-700">My Space →</Link></article>
   </div>
  </div></section>

  <section className="section bg-grace-50"><div className="container-page">
   <div className="rounded-3xl border border-grace-100 bg-white p-6 sm:p-8 lg:p-10"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Want to understand more?</div><h2 className="mt-3 max-w-2xl text-3xl font-black text-slate-950">Start with a conversation.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Ask general questions about life at the centre or speak with Admissions. Grace should use approved centre knowledge and must not invent facility capabilities or disclose private client information.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="btn-primary">Talk to Admissions</Link><Link href="/grace" className="btn-secondary">Ask Grace</Link></div></div>
  </div></section>
 </main>
}