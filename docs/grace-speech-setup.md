# Grace female voice candidate — not audio-certified

Current production integration used unconfigured browser speech synthesis. This candidate replaces only Read Aloud playback with Microsoft Azure Speech neural TTS behind the existing Next.js backend.

## Explicit voices

- English (Kenya): en-KE-AsiliaNeural, female.
- Kiswahili (Kenya): sw-KE-ZuriNeural, female.
- SSML prosody rate: -8%; original pitch. These voices do not support arbitrary voice-direction prompts. Natural sentence punctuation provides pauses. Tone must be accepted by a human listener; relaxed rate alone does not prove empathy or fluency.
- No default or male fallback. The UI reports playback unavailable.

Official references:
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech

## Required server configuration

Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION on the correct LHG staging project, never NEXT_PUBLIC variables. After approving Microsoft's processing/privacy terms for this use, set GRACE_TTS_PROCESSING_APPROVED=true and GRACE_TTS_ENABLED=true. Confirm provider diagnostic logging/retention is appropriate; no text/audio is logged or permanently cached by this application.

Uses Grace's existing conversationSecret resolver (dedicated GRACE_CONVERSATION_SECRET or its domain-separated existing-server-secret derivation) and consume_grace_model_quota RPC, with a separate speech-prefixed identity. Quota failures deny speech. A Grace browser session cookie must exist: send a chat message before playback. Visitor conversation only; signed-in portal speech is deliberately unavailable until external processing of protected responses is approved and governed. Do not weaken that boundary.

### Verified staging setup gap — 5 October 2026

The canonical project's environment-variable inventory contains none of
AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, GRACE_TTS_ENABLED or
GRACE_TTS_PROCESSING_APPROVED. No values were decrypted. Azure provisioning
and account ownership are not verified. The Vercel connection does not itself
provision Microsoft Azure Speech.

In the existing LHG Azure Speech resource, obtain its key and region through
the authorised operator. Enter the key directly into the canonical Vercel
project's environment settings as a sensitive, server-only Preview variable;
never paste it into chat, source files or public variables. Set the matching
region. Scope these settings to repair/lhg-launch-completion-20261005 where
possible. Edwin's privacy review must record processing acceptance before
GRACE_TTS_PROCESSING_APPROVED=true; enable GRACE_TTS_ENABLED=true only for
the approved staging test. Redeploy the intended candidate and rerun identity
and assurance checks. Verify both voices and actual desktop/mobile playback
before describing the service as available. No production settings were changed.

User must explicitly consent to sending the selected response to Azure and click Read Aloud. No automatic playback. Text is submitted in POST body, never URL. API errors contain no submitted text. Audio is held in memory and its object URL revoked on end, stop, replacement, navigation/unmount or backgrounding. Language is explicitly selectable, including for mixed-language responses. No speech API credentials reach the browser.

## Acceptance gate before publication

Use English sample:
“Hello, I’m Grace, the centre’s AI assistant. I’m here to listen and help you explore the support available. We can take this one step at a time.”

Use Kiswahili sample:
“Habari, mimi ni Grace, msaidizi wa kituo. Niko hapa kukusikiliza na kukusaidia kuelewa msaada unaopatikana. Tunaweza kuchukua hatua moja kwa wakati.”

1. Verify named voices in the configured region's voices/list API.
2. Generate and listen to both samples. Have a fluent Kiswahili listener assess pronunciation and approve calm, clear tone.
3. On desktop and mobile test click-only start, pause/resume, stop, restart, speed, different response replacement, navigation, backgrounding and cancellation during generation.
4. Test unavailable/misconfigured provider, quota failure and signed-in boundary: clear status, no default voice fallback.
5. Check only selected visible response text is sent; Markdown, code blocks, HTML comments and images are stripped. Text is not in logs, URLs, analytics or persistent client storage; responses are private/no-store.

Current verification: speech unit/provider mock tests and production build pass. Real audio, live endpoint and desktop/mobile controls are NOT verified. Do not describe candidate as complete.
