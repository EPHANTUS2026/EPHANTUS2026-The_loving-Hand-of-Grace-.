# Grace PRD implementation and release register

Baseline: attached Grace AI PRD v1.0. Both supplied copies have identical document text. This register describes engineering evidence, not clinical approval or production certification. Changes target the existing LHG staging project and canonical Supabase database.

## Requirement register

Owners below are accountable roles awaiting named centre appointments. Engineering Passed means tested implementation only; all broad-release sign-offs remain required. Deployment for this increment: pending staging CI certification.

| Requirement | Priority | Description | Owner | Component / evidence | Status |
|---|---|---|---|---|---|
| GR CON 01 | P0 | Identity and tone | Product / clinical | lib/grace/orchestrator.js; components/grace/GraceChatPanel.js; verify:grace | Outstanding |
| GR CON 02 | P0 | Context and clarification | Product / clinical | lib/grace/orchestrator.js; components/grace/GraceChatPanel.js; verify:grace | Outstanding |
| GR CON 03 | P0 | Honesty and grounding | Product / clinical | lib/grace/orchestrator.js; components/grace/GraceChatPanel.js; verify:grace | Passed |
| GR CON 04 | P0 | Healthy interaction | Product / clinical | lib/grace/orchestrator.js; components/grace/GraceChatPanel.js; verify:grace | Outstanding |
| GR ADM 01 | P0 | Service knowledge | Operations | service data; Action Gateway; booking integration; service tests; staging release gate | Outstanding |
| GR ADM 02 | P0 | Practical preparation | Operations | service data; Action Gateway; booking integration; service tests; staging release gate | Outstanding |
| GR ADM 03 | P1 | Assessment pathway | Operations | service data; Action Gateway; booking integration; service tests; staging release gate | Outstanding |
| GR ADM 04 | P1 | Appointment workflow | Operations | service data; Action Gateway; booking integration; service tests; staging release gate | Outstanding |
| GR CLI 01 | P1 | Recovery Passport | Clinical / engineering | GraceExperience; check-in RPC; Recovery Passport; check-in tests; deployed receipt and isolation gate | Outstanding |
| GR CLI 02 | P1 | Daily check in | Clinical / engineering | GraceExperience; check-in RPC; Recovery Passport; check-in tests; deployed receipt and isolation gate | Outstanding |
| GR CLI 03 | P1 | Support requests | Clinical / engineering | GraceExperience; check-in RPC; Recovery Passport; check-in tests; deployed receipt and isolation gate | Outstanding |
| GR CLI 04 | P1 | Recovery education | Clinical / engineering | GraceExperience; check-in RPC; Recovery Passport; check-in tests; deployed receipt and isolation gate | Outstanding |
| GR FAM 01 | P0 | General support | Privacy / clinical | family consent projections; relationship authority; family consent and revocation staging matrix | Outstanding |
| GR FAM 02 | P1 | Scoped consent | Privacy / clinical | family consent projections; relationship authority; family consent and revocation staging matrix | Outstanding |
| GR FAM 03 | P1 | Revocation | Privacy / clinical | family consent projections; relationship authority; family consent and revocation staging matrix | Outstanding |
| GR FAM 04 | P1 | Safe communications | Privacy / clinical | family consent projections; relationship authority; family consent and revocation staging matrix | Outstanding |
| GR STF 01 | P1 | Assigned work | Clinical | staff relationship authority; operational queues; staging role and assignment matrix | Outstanding |
| GR STF 02 | P1 | Clinical approval | Clinical | staff relationship authority; operational queues; staging role and assignment matrix | Deferred |
| GR HND 01 | P0 | Transfer to a person | Operations | GraceRequestForm; atomic request gateway; workflow events; atomic request and queue receipt tests | Outstanding |
| GR HND 02 | P0 | Ownership and status | Operations | GraceRequestForm; atomic request gateway; workflow events; atomic request and queue receipt tests | Blocked |
| GR SAF 01 | P0 | Recognising urgent concerns | Clinical | emergency-config; safety policy; crisis preflight; verify:grace critical cases | Outstanding |
| GR SAF 02 | P0 | Immediate response | Clinical | emergency-config; safety policy; crisis preflight; verify:grace critical cases | Outstanding |
| GR SAF 03 | P0 | Escalation authority | Clinical | emergency-config; safety policy; crisis preflight; verify:grace critical cases | Blocked |
| GR SAF 04 | P0 | Failure behaviour | Clinical | emergency-config; safety policy; crisis preflight; verify:grace critical cases | Outstanding |
| GR VOI 01 | P0 | Female Read Aloud | Privacy / language | speech endpoint; Azure neural voices; ResponseActions; speech mock tests; real listening review pending | Blocked |
| GR VOI 02 | P1 | Voice input | Privacy / language | speech endpoint; Azure neural voices; ResponseActions; speech mock tests; real listening review pending | Deferred |
| GR UX 01 | P0 | Accessibility | Product / engineering | GraceChatPanel; ResponseActions; shared navigation; build; browser and assistive technology review pending | Outstanding |
| GR UX 02 | P0 | Website integration | Product / engineering | GraceChatPanel; ResponseActions; shared navigation; build; browser and assistive technology review pending | Outstanding |
| GR UX 03 | P0 | Responsive feedback | Product / engineering | GraceChatPanel; ResponseActions; shared navigation; build; browser and assistive technology review pending | Outstanding |
| GR KNO 01 | P0 | Governed knowledge | Content / clinical | approved knowledge RPC; expiry; source projection; retrieval attack and grounding evaluations | Outstanding |
| GR KNO 02 | P0 | Answer evidence | Content / clinical | approved knowledge RPC; expiry; source projection; retrieval attack and grounding evaluations | Outstanding |
| GR KNO 03 | P0 | Retrieval isolation | Content / clinical | approved knowledge RPC; expiry; source projection; retrieval attack and grounding evaluations | Passed |
| GR KNO 04 | P0 | Content ingestion | Content / clinical | approved knowledge RPC; expiry; source projection; retrieval attack and grounding evaluations | Outstanding |
| GR MEM 01 | P0 | Session context | Privacy | encrypted bounded chat context; explicit clearing; chat runtime privacy tests | Passed |
| GR MEM 02 | P1 | Persistent preferences | Privacy | encrypted bounded chat context; explicit clearing; chat runtime privacy tests | Deferred |
| GR MEM 03 | P1 | Clinical context | Privacy | encrypted bounded chat context; explicit clearing; chat runtime privacy tests | Outstanding |
| GR MEM 04 | P1 | Consent and withdrawal | Privacy | encrypted bounded chat context; explicit clearing; chat runtime privacy tests | Outstanding |
| GR ACT 01 | P0 | Policy enforcement | Engineering / operations | typed Action Gateway; HMAC retry receipts; authority, atomic requests and failure gates | Passed |
| GR ACT 02 | P0 | Execution integrity | Engineering / operations | typed Action Gateway; HMAC retry receipts; authority, atomic requests and failure gates | Outstanding |
| GR ACT 03 | P0 | Receipts and audit | Engineering / operations | typed Action Gateway; HMAC retry receipts; authority, atomic requests and failure gates | Outstanding |
| GR SEC 01 | P0 | Identity and isolation | Privacy / security | Supabase RLS; backend credentials; strict schemas; authority and injection suite; provider review pending | Outstanding |
| GR SEC 02 | P0 | Provider and infrastructure controls | Privacy / security | Supabase RLS; backend credentials; strict schemas; authority and injection suite; provider review pending | Blocked |
| GR SEC 03 | P0 | Abuse and prompt injection | Privacy / security | Supabase RLS; backend credentials; strict schemas; authority and injection suite; provider review pending | Passed |
| GR EVAL 01 | P0 | Versioned evaluation set | Clinical / privacy / language | versioned evaluation catalogue; 400 draft configurations; human review pending | Blocked |

## Implemented increment

- Check-ins now use an authenticated security-invoker RPC, immutable submissions and UUID retry keys. Concurrent retries return the same committed receipt; changed retry content conflicts instead of overwriting. Nairobi local day and visible receipt references support reconciliation.
- Clinical check-in reads require both professional scope and active case assignment. Workflow events are emitted in the same database transaction, with only record reference and local day; clinical answers are not copied to general operational metadata.
- Public urgent guidance bypasses model and database dependencies. Existing rules remain responsible for detecting urgent wording; clinical review is still required.
- The assistant displays its access context, direct human-contact and privacy links, explicit clearing, mobile source references, keyboard dialog controls and reduced-motion scrolling. Account-context changes cancel pending responses and audio.
- Female Read Aloud code selects Azure en-KE-AsiliaNeural and sw-KE-ZuriNeural explicitly. It has no browser-default or male fallback. Server credentials and processing approval are required; playback remains unavailable until configured. Mock tests do not verify voice quality.
- Evaluation catalogue: 400 synthetic role/language configurations across 40 base situations, including 200 Kiswahili configurations. All are marked pending centre review. These are not 400 independently reviewed clinical situations and do not certify PRD accuracy thresholds.

## Architecture and authority

| Boundary | Permitted flow | Safeguard |
|---|---|---|
| Public assistant | Published approved facts and session messages | No Recovery Passport projection; expiring knowledge; bounded encrypted context |
| Client | Own authorised records, check-ins and requests | Authenticated server identity, row policies and committed receipts |
| Family | General information plus specifically consented fields | Active relationship and current consent; revocation checked server-side |
| Staff | Assigned records within professional scope | Role plus assignment plus action purpose; administrator role alone is insufficient |
| Action Gateway | Allowlisted typed requests | Confirmation, authoritative validation, idempotency and honest queue status |
| GraceFlow | Operational execution and status | Stored events; queue receipt does not imply human response |

## Data flows and provider requirements

| Data class | Destination / processing | Release condition |
|---|---|---|
| Public chat | Browser plus bounded encrypted session context; optional OpenAI Responses | Processing approval, configured model, store:false, provider contract review |
| Personal records | Canonical Supabase authorised projections | No complete case history sent to external model; relationship tests pass |
| Selected public response audio | Azure Speech server endpoint; temporary browser object URL | Explicit click, server-only key, approved processing; no permanent audio cache |
| Support contact | Authorised operational request queue | Minimal fields and consent; receipt and owner coverage verified |
| Check-in statement | Client-owned database row | Append-only save; local day; idempotent receipt; no clinical content in operational event |
| Evaluation fixtures | Synthetic repository catalogue | Clinical, privacy and Kiswahili reviewers approve before broad release |

Numerical retention periods, processing locations and subcontractor/contract terms require qualified privacy review. Do not treat the 30-minute session limit as a complete care-record retention policy. Optional persistent preference memory, voice input, WhatsApp, multimodal processing and predictive clinical features remain outside this enabled increment.

## Release checklist and operational runbook

- Engineering: certify the exact deployed commit and canonical Vercel/Supabase identities; run static, Grace, production build and deployed security/receipt gates. Record immutable preview URL and migration state.
- Clinical: approve emergency wording, escalation routes, age/capacity scope, health knowledge and critical evaluation cases. No unverified hotline or 24-hour coverage claim is permitted.
- Privacy: approve actual notices, provider processing, retention classes, deletion/backup reconciliation, contracts and access-review procedures.
- Operations: appoint queue owners and backup coverage; publish confirmed hours and acknowledgement expectations; rehearse queued, received, answered, failed and unstaffed states.
- Voice/language: configure credentials securely, then listen to both named voices on supported desktop and mobile devices, including pause/resume/stop, navigation and shared-device behaviour.
- Evaluation: review and expand independent scenarios where necessary; record model/prompt/policy/knowledge versions and adjudication. Demonstrate all blocking gates plus 95% grounded factual and 90% eligible workflow targets on reviewed reference sets.
- Accessibility/performance: test mobile/tablet/desktop, keyboard, screen readers, contrast and representative Kenyan network profiles. Proposed latency and availability targets are unmeasured until recorded.
- Recovery: rehearse feature kill switches and rollback to a certified deployment. Applied additive database migrations remain compatible with prior application code; do not delete committed care data. Verify backup restoration and approved RTO/RPO separately.
- Release: named clinical, privacy, operations and engineering owners supply evidence before leadership approval. The November 7 date does not bypass incomplete gates.

## Remaining blockers and limitations

Azure credentials, approved provider processing and real voice listening evidence are not available. Named owners, current urgent contacts/coverage, privacy determinations, reviewed evaluation evidence and broad release sign-off cannot be supplied by code. Staff clinical draft approval, persistent optional preference memory and additional channels require separate completed implementation and review before enabling. Staging changes are not a claim that the complete PRD is production-ready.
