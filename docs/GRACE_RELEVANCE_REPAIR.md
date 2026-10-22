# Grace relevance repair

The previously deployed assistant has no OpenAI key/model flags or dedicated conversation secret configured in the LHG Vercel project. Existing public knowledge retrieval exposes only three approved mission/values articles. Whole-question English full-text searches require too many matching words; the fallback answers also lack subject-specific support and recent context.

This increment reuses the existing service catalogue and approved contact configuration for public website answers, with explicit website-source provenance and route links. It does not label website text as clinician-approved material. It offers targeted optional grounding for anxiety, recognises bare emotion words and retains bounded encrypted public-session context. Clinical and protected-record boundaries retain priority. No clinical facts, prices or availability are invented.

If a dedicated GRACE_CONVERSATION_SECRET is absent, a distinct encryption key is HMAC-derived from an existing sufficiently long server-only GRACEFLOW_ENGINE_SECRET, or the already configured server-only Supabase service credential when the engine secret is unsuitable. The root is never sent or used directly as a conversation key. A dedicated conversation secret remains preferable for independent rotation. No raw conversation is persisted server-side by this change. Credential rotation clears existing envelopes. Public anonymous keys are never used for encryption.

Deployment gates now test the actual anonymous HTTP path for “am anxious”, “I'm anxious”, “anxious”, grounding, services, location, fees, contextual yes/pronouns and urgent precedence. The live gate requires an encrypted conversation token rather than treating missing memory as a pass.

Free-form model conversation still requires OPENAI_API_KEY, GRACE_MODEL, GRACE_MODEL_ENABLED=true and GRACE_EXTERNAL_PROCESSING_APPROVED=true. Credentials must be entered securely; processing approval must reflect a real privacy decision. No setup or provider claim is fabricated. Users retain explicit opt-in to external AI processing.
