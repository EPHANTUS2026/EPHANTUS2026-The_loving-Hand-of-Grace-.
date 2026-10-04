import Image from 'next/image';
import aboutBanner from '@/public/images/about/counselling-space.webp';
import teamBanner from '@/public/images/team/team-background.webp';
import contactBanner from '@/public/images/contact/garden-path.webp';
import knowledgeBanner from '@/public/images/knowledge/library.webp';
import treatmentBanner from '@/public/images/treatment/garden-bench.webp';
import lifeBanner from '@/public/images/life-at-grace/creative-activities.webp';
import journeyBanner from '@/public/images/recovery-journey/support-path.webp';

const bannerImages = {
  '/images/about/counselling-space.webp': aboutBanner,
  '/images/team/team-background.webp': teamBanner,
  '/images/contact/garden-path.webp': contactBanner,
  '/images/knowledge/library.webp': knowledgeBanner,
  '/images/treatment/garden-bench.webp': treatmentBanner,
  '/images/life-at-grace/creative-activities.webp': lifeBanner,
  '/images/recovery-journey/support-path.webp': journeyBanner,
};

export default function PageHero({eyebrow,title,description,backgroundImage}){
  const banner = bannerImages[backgroundImage];
  return <section style={banner ? {'--banner-aspect': `${banner.width} / ${banner.height}`} : undefined} className={`relative isolate overflow-hidden bg-gradient-to-b from-grace-50 to-white py-16 sm:py-20${banner ? ' lg:aspect-[var(--banner-aspect)] lg:py-0' : ''}`}>
    {backgroundImage && <>
      <Image src={backgroundImage} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[center_72%]"/>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/80 sm:bg-gradient-to-r sm:from-white/95 sm:via-white/85 sm:to-white/30"/>
    </>}
    <div className={`container-page${banner ? ' lg:absolute lg:inset-x-0 lg:top-20' : ''}`}><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1><p className="lead">{description}</p></div>
  </section>;
}
