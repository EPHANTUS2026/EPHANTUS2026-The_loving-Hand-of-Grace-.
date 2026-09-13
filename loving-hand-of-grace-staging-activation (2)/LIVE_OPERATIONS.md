# Live Care Operations

This build removes synthetic operational records from the rehabilitation-centre workspace. The persisted journey is:

**Admission → Client Record → Care Plan → Sessions → Discharge → Aftercare**

GraceFlow is the state-control and audit layer around that journey. It coordinates and validates workflow state; it does not make clinical decisions.

## Apply migrations

Apply in order:

1. `supabase/migrations/001_operational_platform.sql`
2. `supabase/migrations/002_grace_intelligence_platform.sql`
3. `supabase/migrations/003_live_care_operations.sql`

Migration 003 adds live care sessions, discharge plans, aftercare plans/reviews, workflow write permissions, client-record fields, and privacy hardening.

## Live routes

- `/staff/admissions` — live admissions pipeline
- `/staff/admissions/[id]` — screening, assessment, client creation and GraceFlow transition control
- `/staff/clients/[id]` — longitudinal client record
- `/staff/clients/[id]/care-plan` — live care plan and goals
- `/staff/clients/[id]/sessions` — schedule and complete sessions
- `/staff/clients/[id]/discharge` — human-reviewed discharge planning
- `/staff/clients/[id]/aftercare` — aftercare plan and follow-up reviews
- `/graceflow` — live workflow instances and task queue
- `/staff/schedule` — live appointments + care sessions
- `/staff/documents` — live document register
- `/staff/billing` — live invoices and payment records
- `/admin` and `/admin/analytics` — live aggregate management views
- `/portal` — authenticated Grace client check-ins with live mood history
- `/family` — consent-scoped family updates and appointments

## GraceFlow transition prerequisites

The server rejects invalid stage progression:

- Screening → Assessment requires a screening summary.
- Assessment → Admission ready requires an assessment summary.
- Admission ready → Admitted requires a linked client record.
- Admitted → Treatment requires an active care plan.
- Treatment → Discharge requires a discharge plan at least ready for review.
- Discharge → Aftercare requires an aftercare plan.
- Aftercare → Closed requires a completed aftercare plan.

Every accepted transition updates the admission record, synchronises the linked client/workflow state, and writes an audit event.

## Security note

RLS is row-level, not column-level. Migration 003 removes direct client access to `care_plans` because that table contains `confidential_clinical_context`. Client-safe summaries should be exposed only through explicitly bounded server endpoints or purpose-built safe views/functions. Care-session clinical notes are not directly selectable by clients.

Management analytics use authenticated server-side aggregate queries and should not be expanded into routine access to clinical note content.
