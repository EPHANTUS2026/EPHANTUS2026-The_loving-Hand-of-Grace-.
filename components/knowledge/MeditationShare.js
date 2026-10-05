'use client';
import {useState} from 'react';
export default function MeditationShare(){
 const[notice,setNotice]=useState('');
 async function copy(){
  try{const url=new URL(window.location.href);url.search='';url.hash='';await navigator.clipboard.writeText(url.href);setNotice('Meditation link copied.');}
  catch{setNotice('Unable to copy here. You can copy this page’s address from your browser.');}
 }
 return <div className="mt-5"><button type="button" onClick={copy} className="btn btn-secondary focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-grace-700">Copy meditation link</button><p role="status" className="mt-2 text-sm text-slate-600">{notice}</p></div>;
}
