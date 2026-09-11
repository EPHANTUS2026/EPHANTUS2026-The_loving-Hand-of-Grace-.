# The Loving Hand of Grace — Operational Care Platform

A Next.js 14 rehabilitation-centre platform with the public website, GRACE Intelligence Platform, GraceFlow orchestration, admissions, client records, care plans, sessions, discharge, aftercare, scheduling, consent/documents, billing/M-PESA scaffolding, family access and management analytics.

## Production principle

**GraceFlow automates coordination, never clinical judgement.**

Clinical professionals retain authority for assessment, diagnosis, treatment decisions, discharge, safeguarding and other consequential care decisions.

## Setup

1. Copy `.env.example` to `.env.local` and configure Supabase.
2. Apply the SQL migrations in numeric order from `supabase/migrations/`.
3. Create Supabase Auth users and corresponding `profiles` records with the correct role/client/staff relationship.
4. Run:

```bash
npm install
npm run dev
```

For production verification:

```bash
npm run build
npm start
```

See `LIVE_OPERATIONS.md` for the database-backed operational workflow and `GRACE_ARCHITECTURE.md` for Grace governance and safety architecture.

## Required environment variables

See `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY` and all M-PESA secrets server-side only.

## Important deployment work before real client data

- Review the schema, retention, access rules and consent model with qualified Kenyan privacy/legal and clinical governance advisers.
- Apply all migrations and test Row Level Security using accounts for every role.
- Configure backups, logging, key rotation, incident response and secure document storage.
- Verify all Centre programme, contact, staff, emergency and pricing information before publishing it to Grace Knowledge.
- Run GRACE EVAL and security tests before enabling production AI actions.
- Use Safaricom Daraja sandbox before production M-PESA credentials.

No synthetic operational records are used by the live staff, family, billing, GraceFlow or management screens in this build.

## GraceFlow Enterprise Engine

The staff-only workflow engine is available at `/staff/graceflow` through the Staff Portal navigation. Apply `supabase/migrations/004_graceflow_enterprise_engine.sql` after migrations 001–003. See `GRACEFLOW_ENTERPRISE.md` for the architecture, integrated modules and security model.

## GraceFlow Automation Engine (Migration 005)

GraceFlow now includes a versioned visual workflow designer, deterministic conditional routing, approval matrices, schedules, SLA timers, escalation notifications, resumable automation runs, cross-module record actions, a staff notification centre, and executive process analytics.

See `GRACEFLOW_AUTOMATION_ENGINE.md` and apply `supabase/migrations/005_graceflow_automation_engine.sql` after migrations 001–004.


## Latest production-hardening phase

Apply `supabase/migrations/007_production_hardening.sql` after migration 006. This phase adds the secure GraceFlow scheduler, notification outbox, connector health, governed Knowledge publishing/expiry, engine-run observability and management health controls. See `PRODUCTION_HARDENING.md` and `BUILD_VERIFICATION_PRODUCTION.md`.
