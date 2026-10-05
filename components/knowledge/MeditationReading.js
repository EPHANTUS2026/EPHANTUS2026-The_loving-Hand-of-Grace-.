import {publicationDate} from '@/lib/daily-recovery';

export default function MeditationReading({meditation:m,preview=false}){
 const date=publicationDate(m.published_at);
 return <article className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-8">
  <p className="text-sm font-bold text-grace-700">{m.theme}{m.audience?' · '+m.audience:''}</p>
  <h1 className="mt-3 wrap-break-word text-3xl font-black sm:text-4xl">{m.title}</h1>
  {preview?<p className="mt-3 text-sm font-semibold text-amber-800">Editorial preview · awaiting required reviews · not published</p>:date&&<p className="mt-3 text-sm text-slate-600">Published {date} · Africa/Nairobi</p>}
  {m.main_quotation?<><blockquote className="mt-7 whitespace-pre-line text-lg leading-8">{m.main_quotation}</blockquote>{m.supporting_text&&<p className="mt-5 whitespace-pre-line text-base leading-8">{m.supporting_text}</p>}</>:<div className="mt-7 whitespace-pre-line text-base leading-8">{m.body}</div>}
  {m.reflection_question&&<section className="mt-7 rounded-2xl bg-grace-50 p-5"><h2 className="text-sm font-bold text-grace-700">{m.reflection_label||'Reflection'}</h2><p className="mt-2 text-lg font-semibold leading-8">{m.reflection_question}</p></section>}
  {m.practice&&<section className="mt-5 rounded-2xl bg-slate-50 p-5"><h2 className="font-bold">Practice</h2><p className="mt-2 whitespace-pre-line leading-7">{m.practice}</p></section>}
  {m.optional_scripture&&<details className="mt-7 rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-grace-700">Optional scripture · choose whether to read</summary><p className="mt-4 leading-7">{m.optional_scripture}</p><p className="mt-2 text-sm text-slate-600">Supplied excerpt; no Bible translation specified.</p></details>}
  {m.safety_note&&<aside className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-label="Support and safety note"><h2 className="font-bold">Support and safety note</h2><p className="mt-2 text-sm leading-7">{m.safety_note}</p></aside>}
  <p className="mt-7 text-sm leading-6 text-slate-600">A reflection for encouragement, not clinical advice. You can take what is helpful and leave what is not.</p>
 </article>;
}
