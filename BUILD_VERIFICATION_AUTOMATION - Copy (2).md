# GraceFlow Automation Build Verification

## Completed checks

- `node --check` passed for:
  - `lib/graceflow-automation.js`
  - `lib/graceflow-control.js`
  - workflow designer API
  - event ingestion API
  - engine tick API
  - engine resume API
- conflict-marker scan returned no merge-conflict markers in app/components/lib/migrations.
- no new npm dependency was introduced by the automation-engine upgrade.
- migration 005 contains RLS for designer/governance/runtime tables and creates `current_staff_id()` used by notification policies.

## Full Next.js build

A fresh `npm install --ignore-scripts --no-audit --no-fund` was attempted for 120 seconds. Package installation did not complete before the execution limit, and `next` was therefore unavailable locally. A complete `npm run build` could not be executed in this environment.

Run in a networked development/CI environment:

```bash
npm install
npm run build
```

Then apply migrations 001–005 in order to the target Supabase project.
