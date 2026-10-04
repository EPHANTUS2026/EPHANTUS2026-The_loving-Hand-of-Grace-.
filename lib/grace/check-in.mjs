export const copingOptions=Object.freeze(['Talking to someone','Exercise','Prayer / reflection','Breathing','Grounding','Rest','Music','Journaling','Meeting / group','Time outdoors','Routine','Other']);
export function checkinPayload(body){
 if(!body||Object.keys(body).some(k=>!['mood','craving','coping','note'].includes(k))||!Number.isInteger(body.mood)||body.mood<1||body.mood>5||!Number.isInteger(body.craving)||body.craving<0||body.craving>10||!Array.isArray(body.coping)||body.coping.length>copingOptions.length||body.coping.some(x=>!copingOptions.includes(x))||typeof body.note!=='string'||body.note.length>2000)throw new Error('Invalid check-in values.');
 return {mood_score:body.mood,craving_level:body.craving,coping_tool:[...new Set(body.coping)].join(' | ')||null,note:body.note.trim()||null};
}
export async function persistCheckin(session,payload,insert){
 if(!session?.profile?.is_active||session.profile.role!=='client'||!session.profile.client_id||!session.token)throw new Error('unauthorised');
 const rows=await insert('grace_checkins',{...payload,client_id:session.profile.client_id},{admin:false,token:session.token});
 const row=rows?.[0];
 if(!row?.id||!row?.created_at)throw new Error('unconfirmed');
 return {id:row.id,created_at:row.created_at};
}
