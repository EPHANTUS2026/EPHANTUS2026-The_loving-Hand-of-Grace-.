import Link from 'next/link';
import {requireSession} from '@/lib/auth';
import {dbSelect} from '@/lib/supabase-rest';
import {meditationFields} from '@/lib/daily-recovery';
import MeditationReading from '@/components/knowledge/MeditationReading';
export const dynamic='force-dynamic';
export const metadata={title:'Daily Recovery editorial review',robots:{index:false,follow:false}};
export default async function EditorialReview(){
 const session=await requireSession(['administrator','manager','super_admin','clinical_director','director']);
 const rows=await dbSelect('meditations','select='+meditationFields+',status,clinical_review_status,spiritual_review_status&order=display_order.asc&limit=366',session.token);
 return <main className="section bg-slate-50"><div className="mx-auto max-w-3xl px-4 sm:px-6"><Link href="/admin" className="font-bold text-grace-700 underline">Return to management</Link><h1 className="mt-6 text-3xl font-black">Daily Recovery editorial review</h1><p className="mt-4 leading-7">These entries require recorded clinical and spiritual approval before publication through the existing publishing workflow. This preview does not record a review or publish content.</p><div className="mt-8 space-y-8">{rows.map(m=><section key={m.id}><p className="mb-3 text-sm font-semibold">Status: {m.status} · Clinical: {m.clinical_review_status} · Spiritual: {m.spiritual_review_status}</p><MeditationReading meditation={m} preview={m.status!=='published'}/></section>)}</div></div></main>;
}
