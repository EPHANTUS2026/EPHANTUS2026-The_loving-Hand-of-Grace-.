# Production hardening — Recovery OS + GraceFlow

This phase closes locally implementable production gaps without inventing provider credentials or real clinical data.

## Added

- Secure `/api/graceflow/scheduler` cycle with an engine lease to reduce overlapping scheduler runs.
- Scheduler run history and privacy-safe system events.
- Notification outbox for email/SMS/WhatsApp with retries and terminal dead-letter state.
- Connector configuration health checks and `/api/system/health` for authorised management staff.
- Governed Knowledge publishing workflow: Draft → In Review → Approved/Published → Expired/Archived.
- Automatic expiry when `next_review_at` passes, immediately blocking expired content from Grace retrieval.
- Dedicated `/admin/grace/knowledge` governance screen.
- `grace_approved_knowledge` database view as the authoritative retrieval surface for institutional knowledge.

## Production scheduler

Call `POST /api/graceflow/scheduler` from one trusted scheduler every 1–5 minutes and send:

`x-graceflow-secret: <GRACEFLOW_ENGINE_SECRET>`

The cycle processes GraceFlow schedules/timers/SLA escalation/retries, queued external notifications, and stale Knowledge expiry.

## Provider configuration

Email, SMS and WhatsApp stay provider-neutral. Configure server-side webhook adapter endpoints in `.env` and never expose credentials in browser code or workflow definitions.

## Deployment gates

Before handling real client data:

1. Apply migrations 001–007 to staging.
2. Validate RLS with test accounts for each role.
3. Configure provider endpoints and test using non-sensitive payloads.
4. Schedule `/api/graceflow/scheduler` securely.
5. Publish only reviewed Knowledge articles.
6. Run full dependency install, lint/build, integration tests and backup/restore rehearsal in CI/staging.
7. Complete legal/privacy/security review appropriate to the Centre and Kenyan requirements.
