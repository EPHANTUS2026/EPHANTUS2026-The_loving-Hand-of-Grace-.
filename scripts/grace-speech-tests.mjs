import assert from 'node:assert/strict';
import {speechReady,speechSsml,speechText,synthesizeSpeech} from '../lib/grace/speech.mjs';
const sample='Hello, I’m Grace, the centre’s AI assistant. I’m here to listen and help you explore the support available. We can take this one step at a time.';
assert.equal(speechReady({}),false);
assert.equal(speechText('## Hello **Grace**\n[Support](https://example.org)\n<!--secret-->\n```hidden```'),'Hello Grace\nSupport');
assert.match(speechSsml(sample,'en'),/en-KE-AsiliaNeural/);
assert.match(speechSsml('Habari, mimi ni Grace. Tunaweza kuchukua hatua moja kwa wakati.','sw'),/sw-KE-ZuriNeural/);
assert.match(speechSsml('A & B','en'),/A &amp; B/);
assert.match(speechSsml(sample,'en'),/rate="-8%"/);
assert.throws(()=>speechSsml('hello','fr'));
const env={GRACE_TTS_ENABLED:'true',GRACE_TTS_PROCESSING_APPROVED:'true',AZURE_SPEECH_KEY:'synthetic',AZURE_SPEECH_REGION:'eastus'};
let calls=0;
await synthesizeSpeech({text:sample,language:'en',env,fetcher:async(url,options)=>{
 calls++;assert.equal(url,'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'synthetic');assert.match(options.body,/en-KE-AsiliaNeural/);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};
}});
assert.equal(calls,1);
await assert.rejects(synthesizeSpeech({text:sample,language:'en',env:{}}));
await assert.rejects(synthesizeSpeech({text:sample,language:'sw',env,fetcher:async()=>({ok:false})}));
console.log('PASS configured female voice IDs, English/Kiswahili SSML, sanitisation, escaping, relaxed pacing, configuration gates and provider errors (mocked audio only)');
