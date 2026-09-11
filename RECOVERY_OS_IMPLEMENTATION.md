# Loving Hand of Grace — Recovery Operating Environment

This increment applies the architecture supplied on 11 September 2026 and upgrades the existing project incrementally rather than replacing it.

## Existing architecture inspected
- Next.js 14 App Router, React 18, Tailwind and Heroicons.
- Supabase/Postgres accessed through server-side REST helpers with RLS policies.
- Existing authenticated client, family, staff and management areas.
- Existing live admissions → client → care plan → sessions → discharge → aftercare path.
- Existing Grace governed-AI modules (safety, intent, knowledge, orchestration).
- Existing GraceFlow enterprise modules and v1 automation engine (versioned definitions, triggers, schedules, approvals, SLAs, escalation, notifications and analytics).

## Architectural transformation implemented
The project now explicitly follows four layers:
1. **Human Experience** — public recovery journey, guided care explorer, facility experience, knowledge centre, Recovery Passport, Family Hub and staff portal.
2. **Grace Intelligence** — governed conversational navigation and safety boundary; no browser-to-database privileged access.
3. **GraceFlow Orchestration** — event-driven workflow execution, task/approval/timer/connector/subflow/form primitives, retries and live process visibility.
4. **System of Record** — persisted recovery journey, milestones, skills, reintegration, consent, knowledge, workflow, notification, document, audit and integration data.

Permanent rule: **Grace interprets and guides. GraceFlow executes. The database remembers. Humans remain accountable.**

## Public experience added
- `/recovery-journey` — 12-stage interactive recovery continuum.
- `/care-explorer` — non-diagnostic guided care explorer.
- `/life-at-grace` — progressive facility-experience architecture ready for verified media/360 content.
- `/knowledge` — approved/not-expired knowledge only.
- Public navigation now follows About / Treatment / Recovery Journey / Families / Life at Grace / Knowledge / Contact / Ask Grace / Staff Portal.
- Contact information configured centrally: 0721 987 024 (call + WhatsApp), info@thelovinghandofgrace.org, Joska opposite Hon. Makau's farm.

## Recovery continuity added
Migration `006_recovery_os_and_graceflow_studio2.sql` introduces:
- configuration-driven recovery stage catalogue;
- recovery journeys and immutable transition events;
- approved recovery milestones;
- skills programmes/modules/plans/sessions/assessments;
- multi-dimensional reintegration plans/goals;
- purpose/scope/recipient/expiry/revocation-aware consent records and family access logs;
- governed knowledge articles/revisions/approvals;
- notification preferences/templates/deliveries;
- RBAC + ABAC policy entities and care-team assignments;
- immutable operational and Grace AI audit metadata;
- document versions/permissions/signatures;
- feature flags and privacy-safe system events.

The client now has `/portal/recovery-passport`, which intentionally avoids a single recovery percentage and exposes only client-safe fields selected server-side after authentication.

## GraceFlow Studio 2.0
- Drag-and-drop canvas positions persisted with versioned workflow graphs.
- Test payload editor and deterministic dry-run simulator.
- Execution replay from prior engine runs without mutating production state.
- Reusable subflow nodes.
- Workflow form nodes and Forms Builder.
- Business calendars for future business-time SLA calculations.
- Exponential connector retry queue and dead-letter isolation.
- Connector adapter boundary for Email, SMS and WhatsApp; provider endpoints and secrets are server-side environment variables.
- Live process map at `/staff/graceflow/process-map`.
- Studio operations at `/staff/graceflow/studio`.
- Connector/subflow/form nodes are executable in the GraceFlow engine.
- Engine tick now processes retries and moves exhausted failures into the dead-letter queue.

## Security decisions
- No connector credentials are exposed to the browser or stored directly in workflow definitions.
- Dry-run simulation never executes connectors or creates production module records.
- Recovery Passport uses authenticated server-side projection of explicitly safe fields; it does not grant broad client RLS access to clinical tables.
- Family Hub remains consent-governed and does not expose clinical/therapy/medication records by default.
- Expanded staff roles are represented in the database and staff-role helper, while workflow design remains restricted to management roles.
- AI audit stores operational metadata only; hidden model reasoning is not recorded.

## Production configuration still required
- Apply migrations 001 → 006 in order in a non-production environment first.
- Configure Supabase URL/anon/service-role keys.
- Configure the GraceFlow engine scheduler and `GRACEFLOW_ENGINE_SECRET`.
- Select and configure actual email/SMS/WhatsApp providers through the adapter environment variables.
- Validate Kenyan health/privacy/records-retention requirements with qualified legal/clinical governance personnel before live clinical use.
- Populate approved Knowledge Centre content and verified facility media.
