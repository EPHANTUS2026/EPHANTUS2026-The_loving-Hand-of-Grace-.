# Production-hardening verification

## Passed locally

- `node scripts/check-imports.mjs` — all `@/` imports resolve.
- `node --check` — all non-JSX server/API/library JavaScript and verification scripts parse successfully.
- No new npm dependencies were introduced.
- Canonical contact configuration is present for phone/WhatsApp, email and Joska address.
- Migration sequence now runs through `007_production_hardening.sql`.
- Scheduler, knowledge governance, provider-health, notification-outbox and observability modules are present and import-resolvable.

## Full Next.js build

A fresh `npm install --ignore-scripts --no-audit --no-fund` was attempted for 180 seconds. Dependency installation did not complete before the execution timeout, so `next build` could not be run in this sandbox.

This is an environment limitation, not a successful build claim. Run the following in CI/staging with normal package-network access:

```bash
npm ci
npm run verify
npm run build
```

## Deployment gates

Before production use with real client data:

1. Apply migrations 001–007 to a staging Supabase project.
2. Exercise RLS using role-specific test accounts.
3. Configure email/SMS/WhatsApp adapters using non-sensitive test messages.
4. Schedule `POST /api/graceflow/scheduler` with `x-graceflow-secret`.
5. Validate notification retries/dead-letter behavior.
6. Publish reviewed Knowledge articles and verify expired content is excluded.
7. Rehearse backup/restore and incident-response procedures.
8. Complete security/privacy/legal review appropriate to the Centre and jurisdiction.
