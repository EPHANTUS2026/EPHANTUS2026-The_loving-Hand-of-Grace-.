import Link from 'next/link';import ConfirmAccount from './ConfirmAccount';
export const metadata={title:'Confirm your personal account',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Confirm(){return <section className="bg-grace-50 px-5 py-16"><div className="mx-auto max-w-lg rounded-3xl bg-white p-8"><h1 className="mb-5 text-2xl font-black">Confirm your account</h1><ConfirmAccount/><Link href="/login" className="mt-5 inline-block underline">Return to sign in</Link></div></section>;}
