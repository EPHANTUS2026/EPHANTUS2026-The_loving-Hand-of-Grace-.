import Link from 'next/link';
import {notFound} from 'next/navigation';
import {publishedMeditation} from '@/lib/daily-recovery';
import MeditationReading from '@/components/knowledge/MeditationReading';
import MeditationShare from '@/components/knowledge/MeditationShare';
export const dynamic='force-dynamic';
export async function generateMetadata(props) {
 const params = await props.params;
 const m=await publishedMeditation(params.slug).catch(()=>null);
 return m?{title:m.title+' | Daily Recovery',description:'A reflection for '+m.theme.toLowerCase()+'.'}:{title:'Meditation unavailable',robots:{index:false,follow:false}};
}
export default async function MeditationPage(props) {
 const params = await props.params;
 const m=await publishedMeditation(params.slug);
 if(!m)notFound();
 return <div className="section bg-slate-50"><div className="mx-auto max-w-3xl px-4 sm:px-6">
 <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm"><Link href="/knowledge" className="text-grace-700 underline">Knowledge</Link><span aria-hidden="true">/</span><Link href="/knowledge/daily-recovery" className="text-grace-700 underline">Daily Recovery</Link></nav>
 <MeditationReading meditation={m}/><MeditationShare/>
 <div className="mt-7 flex flex-wrap gap-4"><Link href="/knowledge/daily-recovery" className="btn btn-secondary">Return to Daily Recovery</Link><Link href="/knowledge" className="btn btn-secondary">Return to Knowledge</Link></div>
 </div></div>;
}
