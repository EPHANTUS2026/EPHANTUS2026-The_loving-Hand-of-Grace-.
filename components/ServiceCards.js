import Link from 'next/link';
import {services,serviceSlugs} from '@/lib/services';

export default function ServiceCards(){
  return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{serviceSlugs.map(slug=>{
    const service=services[slug];
    return <Link key={slug} href={`/services/${slug}`} className="card block hover:border-grace-600 hover:bg-grace-50 active:bg-grace-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grace-700">
      <h2 className="text-xl font-bold text-slate-950">{service.title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{service.shortDescription}</p>
      <span className="mt-5 inline-block text-sm font-bold text-grace-800">Explore service <span aria-hidden="true">→</span></span>
    </Link>;
  })}</div>;
}
