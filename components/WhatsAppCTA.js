'use client';

import {useMemo} from 'react';
import {buildWhatsAppUrl,getWhatsAppContextMessage} from '@/lib/whatsapp';

export default function WhatsAppCTA({messageContext='default',label='Chat with us on WhatsApp',className='',source='website',showIcon=true}){
  const phone=process.env.NEXT_PUBLIC_WHATSAPP_PUBLIC_NUMBER || process.env.NEXT_PUBLIC_CENTRE_PHONE || '';
  const {message}=getWhatsAppContextMessage({page:messageContext});
  const href=useMemo(()=>buildWhatsAppUrl({phone,message,source,context:messageContext}),[phone,message,source,messageContext]);
  if(!href)return null;
  function track(){try{window.dispatchEvent(new CustomEvent('lhg:analytics',{detail:{event:'whatsapp_context_clicked',source,context:messageContext}}))}catch{}}
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} aria-label={label} className={className || 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2'}>
    {showIcon&&<span aria-hidden="true" className="text-base">◉</span>}{label}
  </a>;
}
