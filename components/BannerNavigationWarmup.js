'use client';
import {useEffect} from 'react';
import {getImageProps} from 'next/image';
import {routeBanners} from '@/lib/page-banners';

export default function BannerNavigationWarmup(){
 useEffect(()=>{
  const warmed=new Map();
  function warm(event){
   if(navigator.connection?.saveData)return;
   const link=event.target.closest?.('a[href]');if(!link)return;
   const url=new URL(link.href,window.location.href);
   if(url.origin!==window.location.origin)return;
   const path=url.pathname.replace(/\/$/,'');const banner=routeBanners[path];
   if(!banner||warmed.has(path))return;
   const {props}=getImageProps({src:banner,alt:'',fill:true,sizes:'100vw'});
   const image=new window.Image();
   image.onerror=()=>warmed.delete(path);
   warmed.set(path,image);
   image.sizes=props.sizes;image.srcset=props.srcSet;image.src=props.src;
  }
  document.addEventListener('pointerover',warm);
  document.addEventListener('focusin',warm);
  document.addEventListener('touchstart',warm,{passive:true});
  return()=>{document.removeEventListener('pointerover',warm);document.removeEventListener('focusin',warm);document.removeEventListener('touchstart',warm);warmed.clear();};
 },[]);
 return null;
}
