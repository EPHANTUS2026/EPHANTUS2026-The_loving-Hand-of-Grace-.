export const speechVoices = Object.freeze({en:{name:'en-KE-AsiliaNeural',locale:'en-KE'},sw:{name:'sw-KE-ZuriNeural',locale:'sw-KE'}});
export function speechText(value){
 return String(value).replace(/```[\s\S]*?```/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/^[ \t]*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/gm,'').replace(/[*_`~]/g,'').trim();
}
const escapeXml=s=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function speechReady(env=process.env){return env.GRACE_TTS_ENABLED==='true'&&env.GRACE_TTS_PROCESSING_APPROVED==='true'&&Boolean(env.AZURE_SPEECH_KEY)&&/^[a-z0-9]+$/.test(env.AZURE_SPEECH_REGION||'');}
export function speechSsml(text,language){
 const voice=speechVoices[language];if(!voice)throw new Error('unsupported_language');
 return `<speak version="1.0" xml:lang="${voice.locale}"><voice name="${voice.name}"><prosody rate="-8%">${escapeXml(speechText(text))}</prosody></voice></speak>`;
}
export async function synthesizeSpeech({text,language,signal,env=process.env,fetcher=fetch}){
 if(!speechReady(env))throw new Error('speech_unavailable');
 const response=await fetcher(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',redirect:'error',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000),headers:{'Ocp-Apim-Subscription-Key':env.AZURE_SPEECH_KEY,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3'},body:speechSsml(text,language)});
 if(!response.ok)throw new Error('speech_unavailable');
 return response.arrayBuffer();
}
