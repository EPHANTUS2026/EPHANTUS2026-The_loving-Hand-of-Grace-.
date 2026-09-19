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

export default function Page(){
 return <><PageHero eyebrow="Life at Grace" title="A calm environment designed around recovery, dignity and capability." description="Explore the spaces that support recovery, family connection, learning, wellbeing and reintegration. Verified facility photography and additional details can be introduced as they are approved."/>
 <section className="section overflow-hidden"><div className="container-page">
  <div className="mb-8 max-w-3xl"><p className="text-sm leading-7 text-slate-600">Life at Grace is designed around the person, not simply the programme. These spaces describe how different parts of the environment support safety, dignity, connection and progress through recovery.</p></div>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{spaces.map((space,i)=><article key={space.title} className="card h-full min-w-0 overflow-hidden">
   <div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Space {String(i+1).padStart(2,'0')}</div>
   <h2 className="mt-4 break-words text-xl font-black leading-tight text-slate-950">{space.title}</h2>
   <p className="mt-3 break-words text-sm leading-6 text-slate-600">{space.description}</p>
  </article>)}</div>
  <div className="mt-8 rounded-3xl border border-grace-100 bg-grace-50 p-6 sm:p-8"><h2 className="text-xl font-black text-slate-950">A clearer view of the facility is coming progressively.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Only approved and verified facility information should appear here. Photography, accessibility guidance and virtual-tour media can be added as they are reviewed, without making unverified claims about the centre.</p></div>
 </div></section></>
}