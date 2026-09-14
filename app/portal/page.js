import Link from 'next/link';
import {requireSession} from '@/lib/auth';
import {dbSelect} from '@/lib/supabase-rest';
import GraceExperience from '@/components/grace/GraceExperience';

export default async function Portal(){
 const session=await requireSession(['client']);
 const name=session?.profile?.full_name?.split(' ')?.[0]||'there';
 const linked=Boolean(session.profile.client_id);
 const checkins=linked?await dbSelect('grace_checkins',`client_id=eq.${encodeURIComponent(session.profile.client_id)}&select=id,mood_score,craving_level,coping_tool,created_at&order=created_at.desc&limit=14`,session.token).catch(()=>[]):[];
 return <>
   <section className="bg-[linear-gradient(180deg,#faf8ff_0%,#f7f8fc_100%)] px-4 pt-5 sm:px-6 lg:px-8">
     <div className="mx-auto max-w-[1400px]">
       <Link
         href="/portal/recovery-passport"
         className="group flex min-h-28 items-center justify-between gap-5 rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 sm:p-6"
         aria-label="Open My Recovery Passport"
       >
         <div>
           <div className="text-xs font-black uppercase tracking-[.18em] text-violet-700">My Space · Private</div>
           <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">My Recovery Passport</h2>
           <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">See your verified recovery journey, milestones, goals, appointments, approved documents and aftercare in one place.</p>
           {!linked&&<p className="mt-2 text-xs font-semibold text-amber-700">Your account needs to be linked to a care record before Passport information can appear.</p>}
         </div>
         <span className="shrink-0 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-violet-700">Open Passport →</span>
       </Link>
     </div>
   </section>
   <GraceExperience name={name} clinicLinked={linked} initialCheckins={checkins||[]} authenticated/>
 </>;
}
