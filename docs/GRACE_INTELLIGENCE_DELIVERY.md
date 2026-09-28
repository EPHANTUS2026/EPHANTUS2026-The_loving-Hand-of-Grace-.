# Grace intelligence implementation evidence

## Scope and baseline
LHG only. Baseline: existing Grace constitution, authority, adversarial,
intelligence, bilingual, retrieval-attack, hallucination and intent suites passed
before runtime changes. These deterministic checks do not establish conversational
quality. No live model, clinical review or participant pilot is claimed.

## Requirements and evidence
| Phase | Implemented evidence | Remaining acceptance work |
| --- | --- | --- |
| 1 Evaluation | 200 synthetic configurations (40 cases across five roles), development/held-out split, authenticated review capture | Centre review, full automated candidate runner and scored baseline on the held-out suite |
| 2 Conversation | Server-side Responses adapter, structured schema, bounded history, encrypted owner-bound 30-minute context, timeout/cancellation, consent and configuration gates | Live model selection, multilingual continuity measurement, summarisation and protected-session context |
| 3 Knowledge | Existing governed retrieval retained; final retrieved answer quality check corrected; model source IDs validated | Reviewed Centre corpus, semantic retrieval, conflict handling and semantic citation evaluation |
| 4 Actions | Chat confirmation form, atomic requests, idempotency, conflict rejection, durable submitted/queued receipt, server-only RPC | Owned status lookup, downstream acknowledgement and concurrent integration test |
| 5 Personalisation | Existing protected projections/authority retained; no protected records enter external model | Authorised role-specific synthesis and optional preference memory lifecycle |
| 6 Support | Emergency routing now precedes Passport/resource branches; model instructions retain clinical boundaries | Reviewed multilingual safety/support library and handoff pilot |
| 7 Reliability | Request bounds, provider timeout/cancellation, model quota, process-local circuit breaker, non-sensitive usage counters and fallback disclosure | Safe streaming, fleet-wide outage coordination, cost dashboard and load benchmarks |
| 8 Pilot | Authorised reviewer screen at /admin/grace/evaluations; immutable review records tied to candidate SHA and evidence ID | Genuine Centre reviews, staff pilot, protected preview and live release gates |

## Configuration and data processing
Enhanced model generation is OFF unless all are configured:
- GRACE_MODEL_ENABLED=true
- GRACE_EXTERNAL_PROCESSING_APPROVED=true (set only after actual organisational approval)
- OPENAI_API_KEY (server-side secret)
- GRACE_MODEL (selected through evaluation; no automatic default)
- GRACE_CONVERSATION_SECRET (independent random secret of at least 32 characters)

The visitor must also opt in through the chat control. Only unauthenticated
general-support conversations are eligible in this rollout. Authenticated
Passport responses use existing server-filtered deterministic behaviour.
Raw conversations and sensitive care records must not be sent to a provider
without the required data-processing review.

Provider API: https://developers.openai.com/api/docs/guides/structured-outputs
Requests use store:false; this alone is not a promise of zero provider retention.
Confirm contractual retention and processing settings before enabling.
No cross-provider fallback is configured.

Conversation tokens are AES-256-GCM encrypted, bound to a browser cookie and
server identity, held in component memory, bounded to eight turns and expire
after 30 minutes. New conversation clears the client-held context. There is
no cross-session preference store and no automatic clinical record creation.
Previous ciphertext remains cryptographically valid until expiry; reset is
not server-side revocation. Do not claim permanent deletion of provider data.

## Database and rollout
Apply grace_atomic_requests_and_quota before deploying the new action runtime.
Model quota: 30 calls per browser per hour and 500 globally per hour.
Cookies can be reset; the global cap is the final budget bound, not bot identity.
Grace requests: global quota of 100 new commands per hour.
New requests enter admissions triage; specialised staffing must be configured
and reviewed before claiming direct counsellor delivery.

Staging verification passed: 30 accepted quota consumes and a denied 31st;
identical request retry returns the same receipt; conflicting retry rejects;
anon/authenticated RPC access denied. All synthetic changes rolled back.
Evaluation review table denies public SELECT and service-role UPDATE/DELETE.
Reviewer identity comes from the server session; reviews are append-only.

Use scripts/staging/grace-runtime-tests.sql in an authorised staging SQL session.
It rolls back synthetic requests and quota use. Node tests use synthetic
provider responses and do not establish real-model response quality.

Rollback: disable GRACE_MODEL_ENABLED; existing deterministic support remains.
Keep additive migrations. Do not disable RLS, consent or deployment identity gates.

## Known release blockers
Rechecked 28 September: CI run 150 passed the production verification gate,
then rejected the exact staging identity request with HTTP 401. Stateful staging
tests were skipped. The connected Vercel team lists only zedhomeskenya, and
looking up LHG project prj_fabxbaSexQuS7In3lDTb2tGFxUHZ returns 404.
The project owner must reconnect Vercel with access to loving-hand-of-grace-staging
and synchronise that project's automation bypass credential with the repository
secret VERCEL_AUTOMATION_BYPASS_SECRET. Never paste the credential into chat.
Re-run the exact-SHA identity gate before transmitting synthetic login credentials.

Provider outage protection opens after three failed/invalid calls, suppresses
new calls for 30 seconds, and permits one recovery probe per process. Caller
cancellation does not count as provider failure; provider timeouts do. Late
results cannot heal a newer outage. State contains no conversation data and
resets on process restart. Database quotas remain the global spending bound;
this circuit is not distributed rate limiting. Synthetic regression tests cover
these transitions and confirm that no provider call occurs while open.

No provider credential/approved processing configuration was available locally.
Protected preview previously rejected CI with HTTP 401; verify current access
before sending test credentials. Actual clinical and pilot reviews remain
external requirements, not tasks an automated code change can certify.
