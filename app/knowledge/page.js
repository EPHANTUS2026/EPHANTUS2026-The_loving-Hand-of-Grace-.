import PageHero from '@/components/PageHero';
import {dbAdminSelect} from '@/lib/supabase-rest';
import DailyRecovery from '@/components/knowledge/DailyRecovery';
import {RECOVERY_RESOURCES} from '@/lib/recovery-resources';
import {ArrowTopRightOnSquareIcon} from '@heroicons/react/24/outline';

const naMeetings=[
 ['Hakika NA Group','Tuesday, Thursday, Saturday','5:00 pm - 6:00 pm','KAG Church, Next to GPO Mtwapa'],
 ['Ask It, Baskit - Easy Does It Group','Tuesday','6:30 am - 7:30 pm','Muguga Green Primary School, Westlands'],
 ['Literature - Easy Does It Group','Thursday','6:30 pm - 7:30 pm','Muguga Green Primary School, Westlands'],
 ['Back to Basics - Easy Does It Group','Friday','6:30 pm - 7:30 pm','Muguga Green Primary School, Westlands'],
 ['JFT Group','Monday','5:00 pm - 6:00 pm','FPFK Church, Diani'],
 ['Tumaini NA Group','Wednesday','4:30 am - 5:30 am','Majengo Social Hall, Opposite Qubaa Mosque'],
 ['Don Bosco Boys Training Institute','Wednesday','6:00 pm - 7:00 pm','Don Bosco Boys Training Institute']
];

const aaMeetings=[
 ['Nairobi','All Saints Cathedral','12:30-1:30 pm Monday'],
 ['Nairobi','Nairobi Place, Mokoyeti Rd, Karen — Tumaini Group','6:00-7:00 pm Monday'],
 ['Nairobi','Holy Family Basilica','6:15-7:15 pm Monday'],
 ['Nairobi','Holy Family Basilica Beginners','12:30-1:30 pm Tuesday'],
 ['Nairobi','Lavington United Church','6:30-7:30 pm Tuesday'],
 ['Nairobi','Holy Family Basilica Church','12:30-1:30 pm Wednesday'],
 ['Nairobi','Consolata Church Westlands','6:00-7:00 pm Wednesday'],
 ['Nairobi','Nairobi Place Mokoyeti Rd','6:30-7:30 pm Wednesday'],
 ['Nairobi','Runda Evergreen PCEA Church','6:30-7:30 pm Thursday'],
 ['Nairobi','St Andrews PCEA next to UON','12:30-1:30 pm Thursday'],
 ['Nairobi','All Saints Cathedral','12:30-1:30 pm Friday'],
 ['Nairobi','Nairobi Place','6:00-7:00 pm Friday'],
 ['Nairobi','Lavington United Church','6:30-7:30 pm Friday'],
 ['Nairobi','Eden House (Limuru Road Parklands)','7:00-8:00 pm Friday'],
 ['Nairobi','Nairobi Hospital Anderson Center, 10th floor','9:00-10:00 am Saturday'],
 ['Nairobi','Rohim Church Utawala Benedicta','10:00-11:00 am Saturday'],
 ['Nairobi','Nairobi Place Kafuga','10:00-11:00 am Saturday'],
 ['Nairobi','Tune Up Group — Our Lady of Guadalupe, Adams Arcade','4:00 pm Saturday'],
 ['Nairobi','Candle Light Group — Regina Caeli Karen','6:00-7:00 pm Monday'],
 ['Kiambu','Karura Community Chapel','3:00-4:00 pm Saturday'],
 ['Thika','St Peter the Rock Catholic Church, Thika','4:00 pm Sunday'],
 ['Thika','Abundant Life Church Kiamumbi','4:00-5:00 pm Sunday'],
 ['Machakos / Athi River','Mavuno Hill City','11:00 am-12:00 pm Wednesday; 2:00-3:00 pm Sunday'],
 ['Mombasa','Mombasa Hospital Sisters’ Mess','12:30-1:30 pm Monday, Wednesday, Friday'],
 ['Kwale / Diani','Eden House Lalapazi','11:00 am-12:00 pm Saturday'],
 ['Nyandarua','The Chapel, Nanyuki Cottage Hospital','1:00-2:00 pm, second Thursday of every month'],
 ['Nakuru','Nakuru Central SDA Church, Bondeni Estate','1:00-2:00 pm Wednesday'],
 ['Meru','Igoji Catholic Church','5:00-6:00 pm Wednesday; 2:00-3:00 pm Sunday']
];

function MeetingTable({rows,kind}){
 return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
  <table className="w-full min-w-[680px] text-left text-sm">
   <thead className="bg-slate-950 text-white"><tr>{kind==='NA'?<><th className="p-4">Group</th><th className="p-4">Day</th><th className="p-4">Time</th><th className="p-4">Venue</th></>:<><th className="p-4">County</th><th className="p-4">Place</th><th className="p-4">Time</th></>}</tr></thead>
   <tbody>{rows.map((r,i)=><tr key={i} className="border-t border-slate-100">{r.map((v,j)=><td key={j} className="p-4 align-top text-slate-700">{v}</td>)}</tr>)}</tbody>
  </table>
 </div>
}

export default async function Page(){
 let rows=[];
 try{rows=await dbAdminSelect('knowledge_articles','approval_status=eq.APPROVED&archived=eq.false&select=id,title,summary,last_reviewed_at,next_review_at,version&order=updated_at.desc&limit=50')}catch{}
 return <><PageHero eyebrow="Knowledge" title="Reviewed information for recovery, families and care navigation." description="Recovery resources, peer-support meeting information and approved institutional knowledge. Meeting schedules can change; confirm with the relevant group before travelling."/>
 <section className="section"><div className="container-page space-y-12"><DailyRecovery/>
  <div id="na-literature"><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Recovery Literature · Narcotics Anonymous</div><h2 className="mt-2 text-2xl font-black text-slate-950">NA Recovery Books</h2><p className="mt-2 text-sm text-slate-600">Access fellowship-approved literature through Narcotics Anonymous World Services. Loving Hand of Grace provides the gateway only and does not reproduce these copyrighted books.</p></div><div className="grid gap-5 md:grid-cols-2">{[RECOVERY_RESOURCES.basicText,RECOVERY_RESOURCES.livingClean].map(resource=><article key={resource.id} className="card flex flex-col"><h3 className="text-xl font-black text-slate-950">{resource.title}</h3><p className="mt-1 text-sm font-semibold text-grace-700">{resource.subtitle}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{resource.description}</p><a href={resource.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-grace-800 px-5 py-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-grace-500 focus:ring-offset-2" aria-label={'Open '+resource.title+' on the Narcotics Anonymous World Services website — opens in a new tab'}>Explore Official Resource <ArrowTopRightOnSquareIcon aria-hidden="true" className="h-4 w-4"/></a><p className="mt-3 text-xs text-slate-500">Official Narcotics Anonymous World Services resource · external website</p></article>)}</div></div>
  <div><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Peer support · Narcotics Anonymous</div><h2 className="mt-2 text-2xl font-black text-slate-950">NA Meeting Schedule</h2><p className="mt-2 text-sm text-slate-600">Meeting groups, times and venues supplied to The Loving Hand of Grace. Please confirm meeting times with the relevant group before travelling, as schedules may change.</p></div><MeetingTable rows={naMeetings} kind="NA"/></div>
  <div><div className="mb-5"><div className="text-xs font-black uppercase tracking-[.16em] text-grace-700">Peer support · Alcoholics Anonymous</div><h2 className="mt-2 text-2xl font-black text-slate-950">AA Physical Meetings in Kenya</h2><p className="mt-2 text-sm text-slate-600">Physical meeting information reproduced from the supplied Kenya schedule. Some entries in the source do not include a meeting time and are therefore not presented as confirmed timed meetings here.</p></div><MeetingTable rows={aaMeetings} kind="AA"/><p className="mt-3 text-xs text-slate-500">AA source help lines: 0724 219570 · 0799458616 (Ladies) · 070557100 · 070570979</p></div>
  <div><h2 className="mb-4 text-2xl font-black text-slate-950">Approved Grace Knowledge</h2><div className="grid gap-4 md:grid-cols-2">{rows.length?rows.map(a=><article key={a.id} className="card"><div className="text-xs font-black uppercase tracking-[.14em] text-grace-700">Approved · v{a.version}</div><h3 className="mt-3 text-xl font-black">{a.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{a.summary}</p><div className="mt-5 text-xs text-slate-400">Reviewed {a.last_reviewed_at?new Date(a.last_reviewed_at).toLocaleDateString('en-KE'):'—'}</div></article>):<div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 md:col-span-2">No additional approved public knowledge articles have been published yet.</div>}</div></div>
 </div></section></>
}