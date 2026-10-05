// Prepare owner-supplied reflections using an authorised user's existing RLS.
// This never manufactures clinical/spiritual approval or publishes drafts.
import fs from 'node:fs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token=process.env.LHG_PUBLISHER_TOKEN;
if(!url||!key||!token)throw new Error('Configure the existing Supabase URL, anon key and authorised LHG_PUBLISHER_TOKEN server-side.');
async function request(path,method='GET',body){
 const response=await fetch(url+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});
 if(!response.ok)throw new Error('Editorial request rejected: HTTP '+response.status);
 return response.json();
}
const entries=JSON.parse(fs.readFileSync(new URL('../content/daily-recovery-meditations.json',import.meta.url),'utf8'));
for(const entry of entries){
 const path='meditations?slug=eq.'+encodeURIComponent(entry.slug);
 const rows=await request(path);
 if(!rows.length){await request('meditations','POST',entry);continue;}
 const controlled=['title','theme','display_order','featured','audience','main_quotation','supporting_text','body','excerpt','reflection_question','reflection_label','optional_scripture','safety_note'];
 if(controlled.some(field=>rows[0][field]!==entry[field])){
  await request(path,'PATCH',{...entry,published_at:null,approved_at:null,approved_by:null,updated_at:new Date().toISOString()});
 }
}
console.log('Prepared five distinct reflections. Required review and publication status remain authoritative in the database.');
