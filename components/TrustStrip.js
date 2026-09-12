import { HeartIcon, ShieldCheckIcon, UserGroupIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
const items=[
  [HeartIcon,'Compassionate care','A respectful, non-judgmental recovery environment.'],
  [ShieldCheckIcon,'Privacy & dignity','Enquiries and personal information are handled discreetly.'],
  [UserGroupIcon,'Family involvement','Support systems are included where appropriate and agreed.'],
  [ClipboardDocumentCheckIcon,'Structured pathway','Clear steps from first enquiry through transition and aftercare.']
];
export default function TrustStrip(){return <section className="border-y border-slate-200 bg-white"><div className="container-page grid gap-0 sm:grid-cols-2 lg:grid-cols-4">{items.map(([Icon,t,d])=><div key={t} className="flex gap-4 border-slate-200 px-2 py-7 sm:px-6 lg:border-r lg:first:border-l"><Icon className="h-7 w-7 shrink-0 text-grace-700"/><div><div className="font-bold text-slate-950">{t}</div><p className="mt-1 text-sm leading-6 text-slate-600">{d}</p></div></div>)}</div></section>}
