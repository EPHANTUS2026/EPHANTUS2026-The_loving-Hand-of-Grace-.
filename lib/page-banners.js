import aboutBanner from '@/public/images/about/counselling-space.webp';
import teamBanner from '@/public/images/team/team-background.webp';
import contactBanner from '@/public/images/contact/garden-path.webp';
import knowledgeBanner from '@/public/images/knowledge/library.webp';
import treatmentBanner from '@/public/images/treatment/garden-bench.webp';
import lifeBanner from '@/public/images/life-at-grace/creative-activities.webp';
import journeyBanner from '@/public/images/recovery-journey/support-path.webp';

export const bannerImages = {
  '/images/about/counselling-space.webp': aboutBanner,
  '/images/team/team-background.webp': teamBanner,
  '/images/contact/garden-path.webp': contactBanner,
  '/images/knowledge/library.webp': knowledgeBanner,
  '/images/treatment/garden-bench.webp': treatmentBanner,
  '/images/life-at-grace/creative-activities.webp': lifeBanner,
  '/images/recovery-journey/support-path.webp': journeyBanner,
};


export const routeBanners={
  "/about":bannerImages["/images/about/counselling-space.webp"],
  "/team":bannerImages["/images/team/team-background.webp"],
  "/contact":bannerImages["/images/contact/garden-path.webp"],
  "/knowledge":bannerImages["/images/knowledge/library.webp"],
  "/programs":bannerImages["/images/treatment/garden-bench.webp"],
  "/life-at-grace":bannerImages["/images/life-at-grace/creative-activities.webp"],
  "/recovery-journey":bannerImages["/images/recovery-journey/support-path.webp"],
};
