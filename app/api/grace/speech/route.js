import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createHmac} from 'node:crypto';
import {dbRpc,getSession} from '@/lib/supabase-rest';
import {speechReady,speechText,speechVoices,synthesizeSpeech} from '@/lib/grace/speech.mjs';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
const error=(status,message)=>NextResponse.json({error:message},{status,headers});
export async function POST(req){
 if(req.headers.get('origin')!==new URL(req.url).origin)return error(403,'Invalid request origin.');
 if(!speechReady())return error(503,'Grace’s female voice is not configured.');
 try{
  const reader=req.body.getReader();let size=0;const parts=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>24000){await reader.cancel();return error(413,'Response too long for playback.');}parts.push(value);}
  const body=JSON.parse(Buffer.concat(parts).toString());
  if(body?.consent!==true||typeof body.text!=='string'||body.text.length>6000||!speechVoices[body.language]||Object.keys(body).some(k=>!['text','language','consent'].includes(k)))return error(400,'Invalid speech request.');
  const text=speechText(body.text);if(!text)return error(400,'No readable response text.');
  // Protected portal responses are not sent to a new external provider in this rollout.
  if(await getSession())return error(403,'External voice playback is unavailable for signed-in conversations.');
  const owner=cookies().get('lhg_grace_browser')?.value;const secret=process.env.GRACE_CONVERSATION_SECRET;
  if(!owner||!secret||secret.length<32)return error(503,'Start a Grace conversation before voice playback.');
  const key=createHmac('sha256',secret).update('speech:'+owner).digest('hex');
  if(!await dbRpc('consume_grace_model_quota',{p_key:key}))return error(429,'Voice playback limit reached. Try again later.');
  const audio=await synthesizeSpeech({text,language:body.language,signal:req.signal});
  return new Response(audio,{headers:{...headers,'Content-Type':'audio/mpeg','X-Grace-Voice':speechVoices[body.language].name}});
 }catch{return error(503,'Grace’s female voice is unavailable. Please try again later.');}
}
