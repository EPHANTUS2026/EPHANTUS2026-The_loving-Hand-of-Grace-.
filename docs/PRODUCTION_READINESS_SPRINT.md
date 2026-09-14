# Loving Hand Production Readiness Sprint

## Transactions, Grounding, Security Proof, Reliability & Operational Certification

Status: ACTIVE
Baseline readiness: 74%
Release target: >=90% with zero unresolved critical safety, privacy, authorization or transaction defects.

## Governing release rule
Nothing is production-ready because it exists. It is production-ready because it is reproducible, authorized, transaction-safe, governed, observable, tested and proven to fail safely.

## Scope freeze
Until this sprint exits, do not add major net-new product features. Work is restricted to completing, hardening, testing and proving existing production-critical capabilities.

## P0 workstreams

### 1. Booking transaction engine
- Implement atomic final booking confirmation RPC.
- Require a valid unexpired slot hold.
- Enforce idempotency.
- Prevent double booking under concurrency.
- Create booking event and notification-outbox record in the same transaction boundary where appropriate.
- Configure synthetic booking staff and availability in staging.
- Prove hold, confirm, duplicate confirm, expired hold and simultaneous booking scenarios.

Exit: one and only one confirmed booking can own a slot; failures cannot leave ambiguous booking state.

### 2. Grace governed knowledge grounding
- Replace starter hard-coded institutional knowledge as runtime authority with approved database-backed retrieval.
- Only published/approved Centre knowledge may support institutional claims.
- Preserve GENERAL education labeling where institutional verification is unavailable.
- Return provenance and source metadata.
- Preserve safety/policy precedence over retrieval.
- Seed only reviewed synthetic/approved staging knowledge.
- Expand Grace adversarial/evaluation suite and persist eval evidence.

Exit: institutional answers are traceable to governed knowledge and unknowns fail safely.

### 3. Security and identity proof
- Create synthetic authenticated client identities linked to synthetic client records.
- Test Client A -> Client B denial.
- Test client -> staff/admin denial.
- Test spoofed staff context denial.
- Test Passport reflection isolation.
- Test family/consent boundaries where implemented.
- Test unauthenticated direct API access.
- Test role matrix for high-risk operations.

Exit: automated adversarial access suite passes with no critical authorization defect.

### 4. Recovery Passport E2E
- Prove client login -> My Space -> own Passport.
- Prove stage/milestone/goal/appointment projections.
- Prove private reflection persistence and isolation.
- Prove Grace Passport grounding against only client-visible verified data.
- Prove clinical notes remain excluded.
- Preserve synthetic super-admin preview as read-only and isolated.

Exit: authenticated synthetic client E2E passes and cross-client access fails.

### 5. Connector and notification reliability
- No connector may report Enabled without successful provider health verification.
- Verify Email/Resend, SMS/Africa's Talking and WhatsApp/Meta independently before enabling.
- Exercise outbox -> provider -> delivery receipt lifecycle with synthetic destinations/allowlists only.
- Test retry, degraded state and dead-letter behavior.
- Do not fail core booking transaction solely because a messaging provider is unavailable.

Exit: connector UI state reflects verified reality and notification failure is observable/retryable.

### 6. Failure engineering and GraceFlow transaction safety
- Identify multi-write workflows that can partially commit.
- Move production-critical multi-write actions to transactional DB functions or compensating state machines.
- Add durable idempotency for Grace -> GraceFlow actions.
- Prove Grace reports execution failure truthfully and never claims success before read-back confirmation.

Exit: injected failures cannot produce false confirmations or unsafe partial state.

### 7. CI and release certification
Production Assurance must gate:
- static/import checks
- Grace evals
- schema contract
- Recovery Passport contract
- booking transaction tests
- RLS/adversarial role matrix
- synthetic browser E2E
- notification reliability tests
- accessibility checks
- production build

Critical failure = release blocked.

### 8. Observability and incident readiness
- Create production-health view/dashboard from audit/system/workflow/connector/notification/eval signals.
- Define alert-worthy conditions.
- Verify dead-letter inspection/replay controls.
- Document incident response, rollback and escalation ownership.
- Perform backup/restore drill and record evidence.

Exit: operators can detect, diagnose, contain and recover from a production incident.

## Mandatory certification scenarios
1. Grace emotional-support response respects professional boundaries.
2. Grace institutional answer cites approved governed source.
3. Unknown institutional question fails safely without invention.
4. Real synthetic booking slot can be held and atomically confirmed.
5. Two concurrent users cannot book the same slot.
6. Expired hold cannot be confirmed.
7. Repeated confirmation request is idempotent.
8. Grace action creates a confirmed GraceFlow request only after durable success.
9. GraceFlow failure never produces a success claim.
10. Meditation publication requires governance approvals.
11. Client A cannot access Client B.
12. Browser-supplied staff context does not grant staff authority.
13. Private Passport reflection remains isolated.
14. Notification failure retries and becomes observable/dead-lettered when exhausted.
15. Crisis/safety policy overrides routine workflow or reflective content.
16. Production Assurance blocks release when any critical scenario fails.
17. Backup can be restored into an isolated environment with integrity checks.

## Readiness bands
- 74% baseline: strong staging architecture, production blocked.
- 80%: atomic booking + synthetic identities + transaction proof.
- 85%: governed Grace grounding + expanded eval evidence.
- 88%: adversarial security + Passport E2E + connector/failure proof.
- 90-93%: browser/mobile/accessibility + observability + backup/incident certification.

## Release decision
GO requires >=90% AND zero unresolved P0 defects.
NO-GO if any critical privacy, safety, authorization, transaction-integrity, data-loss or false-confirmation defect remains, regardless of numeric score.
