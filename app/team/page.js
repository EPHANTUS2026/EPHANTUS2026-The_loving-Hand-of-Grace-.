import PageHero from '@/components/PageHero';

export const metadata={
  title:'Our Team | Loving Hand of Grace',
  description:'Meet the multidisciplinary support team behind care, recovery and everyday life at Loving Hand of Grace.'
};

const team=[
  {
    role:'Director',
    docket:'Leadership, Governance & Strategic Direction',
    profile:'Provides overall leadership and stewardship of the facility, guiding its mission, governance, partnerships, service standards and long-term development while supporting a culture centred on dignity, accountability and recovery.',
    responsibilities:['Strategic leadership and governance','Organisational policy and quality oversight','Partnerships and stakeholder relations','Safeguarding culture and accountability']
  },
  {
    role:'Clinical Coordinator',
    docket:'Facility Operations & Client Welfare',
    profile:'Coordinates the day-to-day running of the facility so that programmes, people, spaces and support services work together safely and consistently. The Clinical Coordinator helps translate organisational standards into a dependable everyday recovery environment.',
    responsibilities:['Daily facility operations','Programme and staff coordination','Client welfare and service experience','Operational quality and escalation']
  },
  {
    role:'Psychiatrist',
    docket:'Psychiatric Assessment & Treatment',
    profile:'Provides specialist psychiatric assessment and treatment within an appropriate clinical scope, working with the wider care team to support people whose recovery journey includes mental-health or psychiatric needs.',
    responsibilities:['Psychiatric assessment','Treatment planning and clinical review','Medication oversight where clinically indicated','Multidisciplinary clinical collaboration']
  },
  {
    role:'Counselling Psychologist',
    docket:'Psychological Assessment & Therapy',
    profile:'Supports psychological wellbeing through professional assessment, counselling and evidence-informed therapeutic interventions, helping clients understand patterns, strengthen coping skills and work toward sustainable recovery goals.',
    responsibilities:['Psychological assessment','Individual and appropriate group therapy','Coping and emotional-regulation support','Recovery and relapse-prevention planning']
  },
  {
    role:'Addiction Counsellor',
    docket:'Addiction Recovery Counselling & Reintegration',
    profile:'Works closely with clients on the practical and behavioural dimensions of recovery, supporting insight, motivation, recovery skills, relapse-prevention planning and preparation for healthier relationships and community life.',
    responsibilities:['Addiction-focused counselling','Recovery education and goal setting','Relapse-prevention skills','Reintegration and continuing-recovery support']
  },
  {
    role:'Psychiatric Nurse',
    docket:'Nursing Care, Observation & Clinical Support',
    profile:'Provides nursing support within the multidisciplinary care environment, helping monitor wellbeing, support prescribed treatment, identify concerns that require escalation and promote safe, respectful day-to-day care.',
    responsibilities:['Nursing observation and support','Medication support within authorized scope','Physical and mental wellbeing monitoring','Clinical escalation and care coordination']
  }
];

function PortraitPlaceholder({role}){
  return <div className="grid aspect-[4/3] place-items-center rounded-[1.5rem] bg-gradient-to-br from-grace-50 to-slate-100 text-center">
    <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-grace-200 bg-white text-2xl font-black text-grace-700">{role.split(' ').map(word=>word[0]).join('').slice(0,2)}</div><p className="mt-3 text-xs font-bold uppercase tracking-[.16em] text-slate-500">Profile image coming soon</p></div>
  </div>
}

export default function TeamPage(){
  return <main>
    <PageHero eyebrow="Our Team" title="The people behind care, recovery and everyday support." description="Our multidisciplinary support team brings together leadership, operations, mental-health expertise, counselling and nursing support around the person and their recovery journey."/>

    <section className="section"><div className="container-page">
      <div className="max-w-3xl"><p className="eyebrow">Support team</p><h2 className="h2">Different disciplines. One commitment to recovery.</h2><p className="lead">These profiles describe each professional docket. Names, credentials, registration details and approved photographs can be added to the relevant profile once confirmed.</p></div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {team.map(member=><article key={member.role} className="card min-w-0 overflow-hidden">
          <PortraitPlaceholder role={member.role}/>
          <div className="mt-6 text-xs font-black uppercase tracking-[.16em] text-grace-700">{member.docket}</div>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{member.role}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">{member.profile}</p>
          <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Core responsibilities</p><ul className="mt-3 space-y-2">{member.responsibilities.map(item=><li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-grace-600"/><span>{item}</span></li>)}</ul></div>
        </article>)}
      </div>
      <p className="mt-8 max-w-4xl text-xs leading-6 text-slate-500">Team information is presented for general facility information. Individual assessment, diagnosis, treatment and clinical decisions remain subject to appropriate professional evaluation, consent, scope of practice and applicable care protocols.</p>
    </div></section>
  </main>
}
