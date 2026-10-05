import {dbSelect} from './supabase-rest';

export const meditationFields='id,slug,title,excerpt,body,reflection_question,practice,meditation_date,theme,reading_time_minutes,published_at,main_quotation,supporting_text,audience,optional_scripture,safety_note,reflection_label,display_order,featured';
// RLS verifies the content-bound, owner-authorised exception. This filter alone
// never grants public access, and changes_requested content remains private.
export const publicMeditationFilter='status=eq.published&or=(and(clinical_review_status.eq.approved,spiritual_review_status.eq.approved),owner_publication_exception_hash.not.is.null)';
export function validMeditationSlug(slug){return typeof slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=120;}
export async function publishedMeditations(){
 return dbSelect('meditations',publicMeditationFilter+'&select='+meditationFields+'&order=display_order.asc,published_at.desc.nullslast&limit=366');
}
export async function publishedMeditation(slug){
 if(!validMeditationSlug(slug))return null;
 const rows=await dbSelect('meditations',publicMeditationFilter+'&slug=eq.'+encodeURIComponent(slug)+'&select='+meditationFields+'&limit=1');
 return rows?.[0]||null;
}
export function publicationDate(value){return value?new Intl.DateTimeFormat('en-KE',{dateStyle:'long',timeZone:'Africa/Nairobi'}).format(new Date(value)):null;}
