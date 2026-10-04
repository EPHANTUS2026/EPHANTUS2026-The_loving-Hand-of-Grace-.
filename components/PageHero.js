import Image from 'next/image';

export default function PageHero({eyebrow,title,description,backgroundImage}){
  return <section className="relative isolate overflow-hidden bg-gradient-to-b from-grace-50 to-white py-16 sm:py-20">
    {backgroundImage && <>
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-grace-50"/>
      <Image src={backgroundImage} alt="" fill priority sizes="100vw" className="-z-20 object-contain object-center"/>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/[0.78] sm:bg-gradient-to-r sm:from-white/[0.96] sm:via-white/[0.86] sm:to-white/[0.34]"/>
    </>}
    <div className="container-page"><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1><p className="lead">{description}</p></div>
  </section>;
}
