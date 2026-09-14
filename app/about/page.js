import PageHero from '@/components/PageHero';
import CTA from '@/components/CTA';
import { HeartIcon, SparklesIcon, UserGroupIcon, AcademicCapIcon, HandRaisedIcon, ShieldCheckIcon, HomeModernIcon, GlobeAltIcon, SunIcon } from '@heroicons/react/24/outline';

export const metadata={title:'About | Loving Hand of Grace',description:'Our vision, mission, core goals and commitment to compassionate, holistic and professional rehabilitation and recovery.'};

const goals=[
  [HeartIcon,'Restore Lives','Provide comprehensive rehabilitation and recovery programmes that address the physical, emotional, psychological, social and spiritual needs of every individual.'],
  [SunIcon,'Renew Hope','Create a caring and supportive environment where every person is valued, respected and encouraged to believe in a better future.'],
  [ShieldCheckIcon,'Promote Lasting Recovery','Equip individuals with the knowledge, skills, confidence and support necessary to overcome addiction and prevent relapse.'],
  [UserGroupIcon,'Rebuild Families','Strengthen families through counselling, education, reconciliation and ongoing support throughout the recovery journey.'],
  [AcademicCapIcon,'Empower for Independence','Provide life-skills, vocational training, mentorship and personal-development opportunities that enable clients to become self-reliant and productive.'],
  [GlobeAltIcon,'Promote Prevention','Raise awareness about substance abuse and related challenges through education, outreach, advocacy and early intervention within communities.'],
  [HomeModernIcon,'Support Reintegration','Help recovering individuals successfully return to their families, workplaces, churches and communities as responsible and productive members of society.'],
  [SparklesIcon,'Nurture Spiritual and Personal Growth','Encourage values of faith, grace, integrity, responsibility, forgiveness, resilience and purpose as foundations for lasting transformation.'],
  [HandRaisedIcon,'Build Strong Partnerships','Collaborate with families, communities, healthcare professionals, churches, government agencies and other organisations to strengthen recovery and expand our impact.'],
];

export default function About(){return <>
  <PageHero eyebrow="About us" title="Restoring lives. Renewing hope. Transforming communities." description="Loving Hand of Grace Rehabilitation Center is committed to compassionate, holistic and professional rehabilitation for individuals and families affected by addiction and other life challenges."/>

  <section className="section"><div className="container-page grid gap-7 lg:grid-cols-2">
    <article className="rounded-[2rem] border border-grace-100 bg-grace-50 p-8 sm:p-10"><p className="eyebrow">Our Vision</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">A leading centre of excellence in rehabilitation and recovery.</h2><p className="mt-5 leading-8 text-slate-700">Where individuals affected by addiction and life challenges find healing, regain their dignity, discover purpose, and are empowered to build healthy, productive and meaningful lives.</p></article>
    <article className="rounded-[2rem] border border-violet-100 bg-violet-50 p-8 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-violet-700">Our Mission</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">To restore lives through compassion, dignity, faith and professional care.</h2><p className="mt-5 leading-8 text-slate-700">Through counselling, therapy, spiritual guidance, life-skills development, education, mentorship and community support, we create a safe and nurturing environment where individuals can heal, grow, rebuild relationships and successfully transition into independent and productive lives.</p></article>
  </div></section>

  <section className="section bg-slate-50"><div className="container-page"><div className="max-w-3xl"><p className="eyebrow">Our Core Goals</p><h2 className="h2">Recovery that reaches the whole person, family and community.</h2><p className="lead">Our work combines rehabilitation, hope, practical capability, family restoration, prevention, reintegration, personal growth and partnership.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{goals.map(([Icon,title,description])=><article key={title} className="card h-full"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-grace-100"><Icon className="h-6 w-6 text-grace-800"/></div><h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></article>)}</div></div></section>

  <section className="section"><div className="container-page"><div className="overflow-hidden rounded-[2.25rem] bg-slate-950 px-7 py-10 text-white sm:px-10 lg:px-14 lg:py-14"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[.22em] text-grace-300">Our Commitment</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Every life deserves another chance.</h2><p className="mt-5 text-lg leading-8 text-slate-300">At Loving Hand of Grace, we believe that addiction does not define a person. We extend a loving hand, a listening heart and a pathway to recovery, helping individuals move from struggle to strength, from hopelessness to hope, and from dependency to purposeful living.</p><div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold tracking-wide text-grace-200">Restoring Lives • Renewing Hope • Transforming Communities</div></div></div></div></section>

  <CTA/>
</>}
