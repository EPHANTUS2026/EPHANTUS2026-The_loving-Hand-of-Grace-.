import {requireSession} from '@/lib/auth';
import {dbSelect} from '@/lib/supabase-rest';
import GraceExperience from '@/components/grace/GraceExperience';
export default async function Portal(){
 const session=await requireSession(['client']);
 const name=session?.profile?.full_name?.split(' ')?.[0]||'there';
 const checkins=await dbSelect('grace_checkins',`client_id=eq.${encodeURIComponent(session.profile.client_id)}&select=id,mood_score,craving_level,coping_tool,created_at&order=created_at.desc&limit=14`,session.token).catch(()=>[]);
 return <GraceExperience name={name} clinicLinked={Boolean(session.profile.client_id)} initialCheckins={checkins||[]} authenticated/>;
}
