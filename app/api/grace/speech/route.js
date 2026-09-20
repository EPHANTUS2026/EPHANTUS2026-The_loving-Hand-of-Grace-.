import {NextResponse} from 'next/server';

const MAX_CHARS=5000;
const AZURE_VOICE='en-KE-AsiliaNeural';

function escapeXml(value=''){
  return value.replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));
}

export async function POST(req){
  const {text}=await req.json().catch(()=>({}));
  if(!text||typeof text!=='string')return NextResponse.json({error:'Text is required.'},{status:400});
  if(text.length>MAX_CHARS)return NextResponse.json({error:'Text is too long for read aloud.'},{status:413});

  const key=process.env.AZURE_SPEECH_KEY;
  const region=process.env.AZURE_SPEECH_REGION;
  if(!key||!region)return NextResponse.json({provider:false,fallback:'browser',voice:AZURE_VOICE},{status:503});

  const ssml=`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-KE"><voice name="${AZURE_VOICE}"><prosody rate="-8%" pitch="+1%" volume="-4%">${escapeXml(text)}</prosody></voice></speak>`;
  try{
    const response=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{
      method:'POST',
      headers:{
        'Ocp-Apim-Subscription-Key':key,
        'Content-Type':'application/ssml+xml',
        'X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent':'LovingHandOfGrace-Grace'
      },
      body:ssml,
      cache:'no-store'
    });
    if(!response.ok)return NextResponse.json({provider:false,fallback:'browser',voice:AZURE_VOICE},{status:502});
    return new NextResponse(await response.arrayBuffer(),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store','X-Grace-Voice':AZURE_VOICE}});
  }catch{
    return NextResponse.json({provider:false,fallback:'browser',voice:AZURE_VOICE},{status:502});
  }
}
