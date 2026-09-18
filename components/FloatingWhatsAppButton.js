'use client';

import {usePathname} from 'next/navigation';
import WhatsAppCTA from './WhatsAppCTA';
import {whatsappContextFromPath} from '@/lib/whatsapp';

const HIDDEN_PREFIXES=['/admin','/staff','/portal'];
const HIDDEN_EXACT=['/grace'];

export default function FloatingWhatsAppButton(){
  const pathname=usePathname()||'/';
  if(HIDDEN_PREFIXES.some(p=>pathname.startsWith(p))||HIDDEN_EXACT.includes(pathname))return null;
  const context=whatsappContextFromPath(pathname);
  return <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 sm:bottom-6 sm:right-6">
    <WhatsAppCTA messageContext={context} source={`floating:${pathname}`} label="Chat with us on WhatsApp" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2" />
  </div>;
}
