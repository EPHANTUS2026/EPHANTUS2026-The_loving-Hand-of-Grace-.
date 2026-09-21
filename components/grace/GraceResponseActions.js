'use client';

import {useEffect,useRef,useState} from 'react';
import {
  ClipboardDocumentIcon, SpeakerWaveIcon, HandThumbUpIcon, HandThumbDownIcon,
  EllipsisHorizontalIcon, ArrowPathIcon, BookmarkIcon, ShareIcon,
  FlagIcon, DocumentMagnifyingGlassIcon, StopIcon, PlayIcon
} from '@heroicons/react/24/outline';

const feedbackReasons=['Incorrect','Not relevant','Hard to understand','Too long','Too short','Felt impersonal','Source problem','Potentially unsafe','Other'];

function speechText(value=''){
  return String(value)
    .replace(/\p{Extended_Pictographic}/gu,'')
    .replace(/[\uFE0E\uFE0F\u200D]/g,'')
    .replace(/[*_~`>#]/g,' ')
    .replace(/https?:\/\/\S+/gi,'')
    .replace(/\s+([,.;!?])/g,'$1')
    .replace(/[ \t]{2,}/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

export default function GraceResponseActions({
  text='', sources=[], context='grace', onRegenerate=null, canRegenerate=false,
  onBranch=null, canBranch=false, authenticated=true
}){
  const [copied,setCopied]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [feedback,setFeedback]=useState(null);
  const [feedbackOpen,setFeedbackOpen]=useState(false);
  const [feedbackMode,setFeedbackMode]=useState('feedback');
  const [reading,setReading]=useState(false);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [saved,setSaved]=useState(false);
  const audioRef=useRef(null);
  const [status,setStatus]=useState('');
  const menuRef=useRef(null);

  useEffect(()=>()=>{try{window.speechSynthesis?.cancel()}catch{}try{audioRef.current?.pause()}catch{}},[]);
  useEffect(()=>{
    if(!menuOpen)return;
    function onKey(e){
      if(e.key==='Escape'){setMenuOpen(false);return;}
      if(!['ArrowDown','ArrowUp'].includes(e.key))return;
      const items=[...(menuRef.current?.querySelectorAll('button:not([disabled])')||[])];
      if(!items.length)return;
      e.preventDefault();
      const current=items.indexOf(document.activeElement);
      const next=e.key==='ArrowDown'?(current+1)%items.length:(current-1+items.length)%items.length;
      items[next].focus();
    }
    document.addEventListener('keydown',onKey);
    return()=>document.removeEventListener('keydown',onKey);
  },[menuOpen]);

  async function copy(){
    try{await navigator.clipboard.writeText(text);setCopied(true);setStatus('Copied');setTimeout(()=>setCopied(false),1600)}catch{setStatus('Couldn’t copy this response.');}
  }

  function selectGraceVoice(){
    const voices=window.speechSynthesis?.getVoices?.()||[];
    const kenyaEnglish=voices.filter(v=>/^en-KE$/i.test(v.lang));
    const english=voices.filter(v=>/^en(?:-|$)/i.test(v.lang));
    const femaleHints=/female|woman|zira|aria|samantha|victoria|karen|moira|fiona|serena|susan|hazel|sonia/i;
    return kenyaEnglish.find(v=>femaleHints.test(v.name))||kenyaEnglish[0]||english.find(v=>femaleHints.test(v.name))||english[0]||null;
  }

  async function startReading(){
    const spokenText=speechText(text);
    if(!spokenText){setStatus('There is no readable text in this response.');return;}
    try{
      const response=await fetch('/api/grace/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:spokenText})});
      if(response.ok&&String(response.headers.get('content-type')||'').startsWith('audio/')){
        const blob=await response.blob(); const url=URL.createObjectURL(blob);
        const audio=new Audio(url); audioRef.current=audio; audio.playbackRate=speed;
        audio.onended=()=>{URL.revokeObjectURL(url);audioRef.current=null;setReading(false);setPaused(false)};
        audio.onerror=()=>{URL.revokeObjectURL(url);audioRef.current=null;setReading(false);setPaused(false);setStatus('Read aloud stopped.')};
        await audio.play(); setReading(true);setPaused(false);setStatus('Reading aloud · Grace Kenyan English voice'); return;
      }
    }catch{}
    if(!('speechSynthesis' in window)){setStatus('Read aloud is not available in this browser.');return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(spokenText);
    const voice=selectGraceVoice();
    if(voice)u.voice=voice;
    u.lang=voice?.lang||'en-KE';
    u.rate=Math.min(speed,1)*0.88;
    u.pitch=1.0;
    u.volume=0.88;
    u.onend=()=>{setReading(false);setPaused(false)};
    u.onerror=()=>{setReading(false);setPaused(false);setStatus('Read aloud stopped.')};
    window.speechSynthesis.speak(u);
    setReading(true);setPaused(false);setStatus(voice?.lang?.toLowerCase()==='en-ke'?'Reading aloud · Kenyan English':'Reading aloud · warm English voice');
  }
  function togglePause(){if(!reading)return startReading();const a=audioRef.current;if(a){if(paused){a.play();setPaused(false);setStatus('Reading resumed')}else{a.pause();setPaused(true);setStatus('Reading paused')}return}if(paused){window.speechSynthesis.resume();setPaused(false);setStatus('Reading resumed')}else{window.speechSynthesis.pause();setPaused(true);setStatus('Reading paused')}}
  function stopReading(){try{audioRef.current?.pause();audioRef.current=null}catch{}try{window.speechSynthesis.cancel()}catch{}setReading(false);setPaused(false);setStatus('Reading stopped')}
  function restartReading(){stopReading();setTimeout(startReading,0)}

  async function sendFeedback(sentiment,reason=''){
    try{
      const r=await fetch('/api/grace/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sentiment,reason,has_sources:sources.length>0})});
      if(!r.ok) throw new Error();
      setFeedback(sentiment);setFeedbackOpen(false);setStatus('Thanks for the feedback');
    }catch{setStatus('Couldn’t send feedback.');}
  }

  async function save(){
    if(!authenticated){setStatus('Sign in to save this response.');return;}
    try{
      const r=await fetch('/api/grace/saved-responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({response_text:text,sources,context})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.confirmed)throw new Error();
      setSaved(true);setStatus('Saved');setMenuOpen(false);
    }catch{setStatus('Couldn’t save this response.');}
  }

  async function share(){
    if(!window.confirm('This response may contain private information. Review it before sharing. Continue?'))return;
    try{
      if(navigator.share){await navigator.share({text});setStatus('Shared');}
      else{await navigator.clipboard.writeText(text);setStatus('Copied for sharing');}
      setMenuOpen(false);
    }catch(e){if(e?.name!=='AbortError')setStatus('No share link was created.');}
  }

  function viewSources(){setMenuOpen(false);document.getElementById(`sources-${encodeURIComponent(text.slice(0,24))}`)?.scrollIntoView({behavior:'smooth',block:'nearest'});}

  const id=`sources-${encodeURIComponent(text.slice(0,24))}`;
  const iconButton='inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400';

  return <div className="mt-2" aria-label="Grace response actions">
    {sources.length>0&&<details id={id} className="mb-1 hidden text-xs text-slate-500 sm:block"><summary className="cursor-pointer font-semibold text-violet-700">Sources · {sources.length}</summary><div className="mt-2 space-y-2 rounded-2xl bg-violet-50/70 p-3">{sources.map((s,i)=><div key={s.id||i}><b className="text-slate-800">{s.title||'Source'}</b>{s.section?` · ${s.section}`:''}{s.updated?<><br/>Updated {s.updated}</>:null}</div>)}</div></details>}

    <div className="flex max-w-full items-center gap-0.5 overflow-visible" role="toolbar" aria-label="Response actions">
      <button type="button" onClick={copy} aria-label="Copy Grace response" title="Copy" className={iconButton}><ClipboardDocumentIcon className="h-4 w-4"/><span className="hidden sm:inline">{copied?'Copied':'Copy'}</span></button>
      <button type="button" onClick={reading?togglePause:startReading} aria-label={reading?(paused?'Resume reading Grace response':'Pause reading Grace response'):'Read Grace response aloud'} title="Read aloud" className={iconButton}>{reading&&paused?<PlayIcon className="h-4 w-4"/>:<SpeakerWaveIcon className="h-4 w-4"/>}<span className="hidden sm:inline">{reading?(paused?'Resume':'Reading…'):'Read aloud'}</span></button>
      <button type="button" onClick={()=>sendFeedback('helpful')} aria-label="Mark response as helpful" title="Helpful" aria-pressed={feedback==='helpful'} className={`${iconButton} ${feedback==='helpful'?'text-violet-700 bg-violet-50':''}`}><HandThumbUpIcon className="h-4 w-4"/><span className="sr-only sm:not-sr-only">Helpful</span></button>
      <button type="button" onClick={()=>{setFeedbackMode('feedback');setFeedbackOpen(true)}} aria-label="Mark response as not helpful" title="Not helpful" aria-pressed={feedback==='not_helpful'} className={`${iconButton} ${feedback==='not_helpful'?'text-violet-700 bg-violet-50':''}`}><HandThumbDownIcon className="h-4 w-4"/><span className="sr-only sm:not-sr-only">Not helpful</span></button>
      <div className="relative">
        <button type="button" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Open response actions" title="More" className={iconButton}><EllipsisHorizontalIcon className="h-5 w-5"/><span className="hidden sm:inline">More</span></button>
        {menuOpen&&<div ref={menuRef} role="menu" className="absolute right-0 z-50 mt-1 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
          {canRegenerate&&onRegenerate&&<button role="menuitem" onClick={()=>{setMenuOpen(false);onRegenerate()}} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"><ArrowPathIcon className="h-4 w-4"/>Regenerate response</button>}
          {sources.length>0&&<button role="menuitem" onClick={viewSources} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"><DocumentMagnifyingGlassIcon className="h-4 w-4"/>View sources</button>}
          {canBranch&&onBranch&&<button role="menuitem" onClick={()=>{setMenuOpen(false);onBranch()}} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400">Start new branch</button>}
          <button role="menuitem" onClick={save} disabled={saved} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60"><BookmarkIcon className="h-4 w-4"/>{saved?'Saved ✓':'Save response'}</button>
          <button role="menuitem" onClick={share} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"><ShareIcon className="h-4 w-4"/>Share</button>
          <div className="my-1 border-t border-slate-100"/>
          <button role="menuitem" onClick={()=>{setMenuOpen(false);setFeedbackMode('report');setFeedbackOpen(true)}} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"><FlagIcon className="h-4 w-4"/>Report response</button>
        </div>}
      </div>
    </div>

    {reading&&<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><button onClick={restartReading} className="rounded-lg px-2 py-1 hover:bg-slate-100">Restart</button><button onClick={stopReading} className="rounded-lg px-2 py-1 hover:bg-slate-100"><StopIcon className="mr-1 inline h-3.5 w-3.5"/>Stop</button><label className="ml-1">Speed <select value={speed} onChange={e=>{setSpeed(Number(e.target.value));if(reading)restartReading()}} className="rounded-lg border border-slate-200 bg-white px-1.5 py-1"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label></div>}

    {feedbackOpen&&<div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs"><div className="font-bold text-slate-800">{feedbackMode==='report'?'Report this response':'What could Grace have done better?'}</div><div className="mt-2 flex flex-wrap gap-2">{(feedbackMode==='report'?['Incorrect','Potentially harmful','Privacy concern','Inappropriate','Broken source','Other']:feedbackReasons).map(reason=><button key={reason} onClick={()=>sendFeedback(feedbackMode==='report'?'report':'not_helpful',reason)} className="min-h-9 rounded-full bg-slate-100 px-3 text-slate-700 hover:bg-slate-200">{reason}</button>)}</div><button onClick={()=>setFeedbackOpen(false)} className="mt-2 text-slate-500">Cancel</button></div>}
    <div className="sr-only" aria-live="polite">{status}</div>
    {status&&<div className="mt-1 text-[11px] text-slate-400" aria-hidden="true">{status}</div>}
  </div>;
}
