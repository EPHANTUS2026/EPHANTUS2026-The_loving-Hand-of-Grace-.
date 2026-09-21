# GRACE-0 — Discovery & Threat Model

Audit date: 2026-09-20
Scope: current Loving Hand of Grace repository state before Grace master upgrade.

## Current-state architecture

The repository already has a meaningful Grace foundation. Grace is a conversational intelligence layer, GraceFlow is the workflow/orchestration layer, Supabase is the system of record, and Recovery Passport is an authenticated client projection. This separation must be preserved.

Existing Grace implementation includes:
- `lib/grace/constitution.js`: identity, personality, truthfulness and professional boundaries.
- `lib/grace/intent.js`, `safety.js`, `policy.js`, `orchestrator.js`: deterministic routing and safety scaffold.
- `lib/grace/knowledge.js`: governed knowledge retrieval.
- `lib/grace/actions.js` + `/api/grace/action`: confirmed GraceFlow request creation.
- `/api/grace/chat`: public chat plus authenticated Recovery Passport projection.
- `scripts/grace-evals.mjs`: starter safety/intent evaluation suite.
- GraceFlow routes, engine, events, scheduler, transitions and staff tooling already exist.
- Recovery Passport service, client route and verification script already exist.
- Role-based authentication and protected portal middleware already exist.
- Migrations 001–017 already define the operational, Grace, GraceFlow, Recovery Passport and authority-hardening history. Do not recreate these foundations.

## Capability inventory

Present or partially present: public Grace, English/Kiswahili intent handling, emergency interruption, clinical boundary copy, governed knowledge, Recovery Passport retrieval, explicit-consent GraceFlow actions, fail-closed action confirmation, role routing, client isolation tests, identity authority tests, journey integrity tests and CI release gates.

Incomplete against the master command: explicit operating-mode resolver, full 14-principle constitution enforcement metadata, non-diagnostic conversational-state model, hardened Clinical Authority Engine, authenticated client/family/staff context builder, family-consent engine, staff relationship-scoped Grace context, My Journey conversational projection, My Requests status retrieval, generalized Grace Action Gateway with idempotency, provider abstraction, memory/retention governance, structured audit/provenance schema for all consequential Grace operations, prompt-injection suite, broader bilingual evals, Grace telemetry and full acceptance matrix.

## Threat model / authority gaps

Release blockers:
1. Never trust a browser-supplied Grace context for protected modes. Server session must resolve client/family/staff modes.
2. Grace actions currently accept contact/context input and create workflow records with privileged database helpers; authenticated identity, actor authority and idempotency must be enforced before expanding consequential actions.
3. Family relationship must never imply access. Consent scope/expiry/revocation requires server-side proof.
4. Staff role alone must never expose arbitrary client context. Active assignment/relationship + purpose + scope are required.
5. Clinical outputs must never become authoritative merely because the model generated them.
6. Retrieved/user-supplied text must be treated as untrusted and unable to override constitution, safety, authorization or GraceFlow.
7. Audit logs must record decisions/provenance without storing hidden reasoning or unnecessary sensitive conversation text.

## Clinical boundary assessment

The repository already blocks diagnosis, prescribing, medication changes and independent clinical decisions in the Grace policy scaffold. The next hardening step is a dedicated Clinical Authority boundary that represents consequential clinical requests as human-review-required and only communicates authoritative outcomes after a server-confirmed professional record exists.

## Data flow target

Person → Grace UI → server-authenticated Grace conversation boundary → mode/intent/state/safety → minimum authorized context → governed knowledge/Recovery Passport/My Journey → clinical authority boundary when applicable → Grace Action Gateway → GraceFlow → authorized service/database → confirmed result → audit/provenance → response.

No LLM-to-database mutation and no browser-authored workflow truth.

## Project contamination check

No ZIWOS or ZED architecture is authorized in this project. GraceFlow remains the sole workflow/orchestration system. Any future occurrence of ZIWOS/ZED in active LHG application architecture is contamination and a release blocker.

## Prioritized implementation plan

GRACE-1: strengthen constitution, operating modes, conversational states and clinical-boundary contract.
GRACE-2: server-authoritative identity/consent/relationship context.
GRACE-3: knowledge provenance and untrusted-content boundary.
GRACE-4: Recovery Passport + My Journey authorized context.
GRACE-5: hardened structured Action Gateway with idempotency.
GRACE-6: support requests/My Requests through GraceFlow.
GRACE-7: safety escalation and model-independent fallback.
GRACE-8/9: family and staff authority matrices.
GRACE-10/11: recovery companion and memory governance.
GRACE-12/13: adversarial security and expanded evaluations.
GRACE-14: exact-SHA production certification.

## Migration decision

No GRACE-0 database migration. Existing structures must be reused first. Any later migration must be additive, narrowly justified, RLS-protected and independently reversible.

## Test plan and release gates

Expand the existing release gate to prove: anonymous protected-context denial; Client A/B isolation; family consent allow/deny/revocation; staff assignment allow/deny/revocation; forged role/client/relationship denial; prompt-injection resistance; no direct AI mutation; idempotent action replay; clinical-boundary enforcement; provider failure safe degradation; knowledge provenance; bilingual safety behavior.

Production sequence remains fail-closed: static/lint as available → Grace evals → schema contract → Recovery Passport contract → staging identity/authority → RLS/RPC boundaries → transaction/concurrency tests → journey integrity → E2E → build → exact-SHA staging verification.

Known infrastructure blocker remains external to Grace code: canonical Supabase Data API/PostgREST must be healthy before full staging certification can pass.

## First safe implementation change

GRACE-1 starts with pure policy code: explicit permanent constitution principles, server-resolvable operating-mode definitions, non-diagnostic conversational states, and a clinical-authority decision contract. It does not mutate database state, weaken existing safety, or replace GraceFlow.
