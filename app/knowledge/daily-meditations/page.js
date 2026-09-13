import DailyMeditationsLibrary from '@/components/knowledge/DailyMeditationsLibrary';
import {dbSelect} from '@/lib/supabase-rest';

export default async function DailyMeditationsPage(){
  const todayIso=new Date().toISOString().slice(0,10);
  let meditations=[];
  try{
    meditations=await dbSelect('meditations','status=eq.published&clinical_review_status=eq.approved&spiritual_review_status=eq.approved&select=id,slug,title,excerpt,body,reflection_question,practice,meditation_date,theme,reading_time_minutes,published_at&order=meditation_date.desc&limit=366');
  }catch{}
  return <DailyMeditationsLibrary meditations={meditations||[]} todayIso={todayIso}/>;
}
