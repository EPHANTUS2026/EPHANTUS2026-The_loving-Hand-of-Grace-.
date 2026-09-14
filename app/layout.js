import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GraceAmbient from '@/components/grace/GraceAmbient';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.org'),
  title: { default: 'The Loving Hand of Grace | Rehabilitation & Treatment Centre', template: '%s | The Loving Hand of Grace' },
  description: 'Compassionate, structured and confidential rehabilitation and treatment support for individuals and families in Kenya.',
  openGraph: { title:'The Loving Hand of Grace', description:'A safe place to begin again.', type:'website', locale:'en_KE' },
  robots: { index:true, follow:true }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Header/><main>{children}</main><GraceAmbient/><FloatingWhatsAppButton/><Footer/></body></html>;
}
