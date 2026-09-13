# GRACE Intelligence Platform

**Formal identity:** Grace — Loving Hand of Grace Intelligent Care Assistant  
**Positioning:** The trusted digital intelligence, care-navigation and service-orchestration layer powering The Loving Hand of Grace experience.  
**Permanent principle:** Helpful enough to guide. Careful enough not to pretend to be a clinician.

## Six permanent engines

1. **Grace Core** — language, reasoning, intent routing and orchestration.
2. **Grace Knowledge** — approved Centre knowledge, provenance, versioning and retrieval.
3. **Grace Care Navigation** — programme discovery, admissions, family guidance and service navigation.
4. **Grace Safety** — crisis classification, professional boundaries and emergency escalation.
5. **Grace Connect** — callbacks, appointments, messaging and consent-aware human handoff.
6. **Grace Trust** — privacy, consent, permissions, audit, confidence, hallucination prevention and evaluation.

## Response pipeline

`Input → language → safety → intent → identity/context → permission → knowledge/tools → bounded response → factual validation → medical boundary validation → privacy validation → confidence → response/tool/handoff`

The current codebase implements this as a deterministic safety/intent/orchestration scaffold. Production LLM integration should sit *inside* this pipeline, not replace it.

## Institutional truthfulness

Institutional claims require approved evidence. The rule is:

> **No source → no institutional claim.**

Answer states are `VERIFIED`, `GENERAL`, `INFERRED`, `UNKNOWN`, `RESTRICTED`, and `EMERGENCY`.

## Professional boundary

Grace may explain, guide, retrieve, coordinate and connect. Clinical professionals assess, diagnose, prescribe and decide.

Grace must not diagnose, prescribe, modify medication, perform detox planning, determine dosage, make independent safeguarding or involuntary-admission decisions, guarantee outcomes, disclose another person’s data, or fabricate Centre facts.

## Safety

Potential emergency language interrupts the normal answer flow. Emergency information is configured centrally rather than embedded in prompts. Grace gives concise direction to seek urgent in-person help and does not prolong an acute emergency conversation.

## Privacy and memory

Contexts are separated into anonymous visitor, identified visitor, authenticated client/family and staff sessions. Clinical records are not ordinary AI memory. Persistent memory should be opt-in and non-sensitive unless a dedicated governed clinical system is explicitly queried under permission.

## Consent and actions

Important actions use `purpose → disclosure → consent → collection → confirmation → execution`. Grace never silently books, cancels, shares personal information or changes account data.

## Knowledge governance

Knowledge moves through `Draft → Review → Approval → Published to Grace → Superseded → Archived`. Only active approved content may support institutional answers. Each object carries owner, version, approval, review date, jurisdiction, sensitivity and access level.

## GRACE EVAL

Release gates should test accuracy, hallucination, medication boundaries, diagnosis requests, emergencies, prompt attacks, privacy, false authority and institutional fabrication. A release should not ship when critical safety/privacy suites fail.

## Production hardening still required

- Connect the knowledge console to live Supabase CRUD and approval actions.
- Replace starter keyword retrieval with embeddings/hybrid search over approved records.
- Add a model gateway with structured outputs and an independent response verifier.
- Add consented conversation persistence and retention controls.
- Add live human-handoff queues and appointment tools.
- Add centrally managed Kenyan emergency configuration reviewed by authorised staff.
- Add rate limiting, abuse protection, PII logging controls and observability.
- Validate healthcare/privacy obligations with qualified Kenyan legal and clinical advisers before production use.
