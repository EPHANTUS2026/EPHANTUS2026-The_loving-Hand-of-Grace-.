import Image from 'next/image';
import ImageTextOverlay from './ImageTextOverlay';
import {bannerImages} from '@/lib/page-banners';

export default function PageHero({eyebrow,title,description,backgroundImage,overlayDirection='left'}){
  const banner = bannerImages[backgroundImage];
  return <section style={banner ? {'--banner-aspect': `${banner.width} / ${banner.height}`} : undefined} className={`relative isolate overflow-hidden bg-gradient-to-b from-grace-50 to-white py-16 sm:py-20${banner ? ' lg:aspect-[var(--banner-aspect)] lg:py-0' : ''}`}>
    {backgroundImage && <>
      <Image src={banner || backgroundImage} alt="" fill priority fetchPriority="high" placeholder={banner ? "blur" : "empty"} sizes="100vw" className="-z-20 object-cover object-[center_72%]"/>
      <ImageTextOverlay direction={overlayDirection}/>
    </>}
    <div className={`container-page${banner ? ' lg:absolute lg:inset-x-0 lg:top-20' : ''}`}><p className={`eyebrow${backgroundImage ? ' image-banner-label' : ''}`}>{eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1><p className={`lead${backgroundImage ? ' image-banner-description' : ''}`}>{description}</p></div>
  </section>;
}
