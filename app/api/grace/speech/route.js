import {NextResponse} from 'next/server';

const MAX_CHARS=5000;

export async function POST(req){
  const {text}=await req.json().catch(()=>({}));
  if(!text||typeof text!=='string')return NextResponse.json({error:'Text is required.'},{status:400});
  if(text.length>MAX_CHARS)return NextResponse.json({error:'Text is too long for read aloud.'},{status:413});

  const endpoint=process.env.GRACE_TTS_ENDPOINT;
  const apiKey=process.env.GRACE_TTS_API_KEY;
  const voice=process.env.GRACE_TTS_VOICE_ID;
  if(!endpoint||!apiKey||!voice)return NextResponse.json({provider:false,fallback:'browser'},{status:503});

  try{
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        text,
        voice,
        locale:'en-KE',
        profile:'grace',
        style:{gender:'female',tone:'soft',empathy:'high',pace:'gentle'}
      }),
      cache:'no-store'
    });
    if(!response.ok)return NextResponse.json({provider:false,fallback:'browser'},{status:502});
    const type=response.headers.get('content-type')||'audio/mpeg';
    if(!type.startsWith('audio/'))return NextResponse.json({provider:false,fallback:'browser'},{status:502});
    return new NextResponse(await response.arrayBuffer(),{headers:{'Content-Type':type,'Cache-Control':'private, no-store','X-Grace-Voice':'provider'}});
  }catch{
    return NextResponse.json({provider:false,fallback:'browser'},{status:502});
  }
}
