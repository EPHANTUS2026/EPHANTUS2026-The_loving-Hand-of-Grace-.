# Exact-commit staging certification — 5 October 2026

Verdict: NO-GO for production. The existing automated assurance gate passed;
this is not full browser, enterprise authority or human launch acceptance.

## Candidate identity

- Published SHA: `dd071d42c850bf06e5c5de66fc2fe76558a40952`.
- Source tree: `d6e4f83310fb0e317db33b20facf522a38edb5b7`.
- Branch: `repair/lhg-launch-completion-20261005`.
- Vercel project: `loving-hand-of-grace-staging`,
  `prj_fabxbaSexQuS7In3lDTb2tGFxUHZ`.
- Preview deployment: `dpl_B29YLcyRZ6CrVQdoCWaaFckKHH85`, READY.
- Preview: https://loving-hand-of-grace-staging-isfy26cdo-zedcollectionskenya.vercel.app/
- Supabase: `rpszhpjmchirzzndasrb`.
- Latest recorded applied migration: `20261005010009`;
  full inventory: `STAGING_MIGRATION_INVENTORY_20261005.json`.
- No migrations applied during this certification.

## CI evidence

Production Assurance run 182, run ID `37303873591`, job `111742751471`:
completed successfully on 5 October 2026 at approximately 11:39 UTC.

The workflow now runs on the repair branch and selects its canonical staging
branch alias rather than the stale staging secret override. Required gates
remain mandatory. Runtime identity initially rejected the prior deployed SHA
while Vercel built the candidate; at 11:37:19 UTC it confirmed the exact SHA,
repository owner/name, LHG application and Supabase identity.

Passed:

- Reproducible install; dependency audit: zero vulnerabilities.
- Launch repair regressions, static/import and service catalogue checks.
- Grace safety, adversarial, relevance, context and bilingual evaluations.
- Database schema: 20 tables and 6 RPC contracts; Recovery Passport contract.
- Live Client A/B isolation and identity/forgery/escalation boundaries.
- Staff assigned access and unrelated/inactive/ended/future/revoked denial.
- Public RPC boundaries and operational-health authority/reconciliation.
- Booking confirmation/idempotency/collision and parallel slot race.
- Recovery journey prerequisites, role authority, replay/concurrency/audit
  consistency and direct-write bypass denial.
- Synthetic end-to-end recovery journey.
- Live check-in parallel receipt, single persistence, retry conflict,
  family denial, cross-client isolation and forged-client rejection.
- Live Grace anxiety/grounding, Kiswahili, public facts, fees, encrypted
  context and emergency precedence fixtures.
- Production build: 86 generated pages.

These checks used synthetic fixtures and existing configured CI credentials.
No real notification delivery or production promotion was performed.

## Fresh browser exception

On this preview, requesting Read Aloud for Grace's public opening response
after checking the Azure processing consent displays:
"Grace’s female voice is not configured."

The backend requires `GRACE_TTS_ENABLED=true`,
`GRACE_TTS_PROCESSING_APPROVED=true`, `AZURE_SPEECH_KEY` and a valid
`AZURE_SPEECH_REGION`. Do not infer which individual setting is missing from
this message. Keys must remain server-side; processing approval cannot be
fabricated. English `en-KE-AsiliaNeural` and Kiswahili `sw-KE-ZuriNeural`
availability, playback controls and human listening acceptance remain blocked.
There is no male/default fallback.

## Remaining mandatory gates

- Operational module/action grants and implementation/certification for all
  13 enterprise modules. Existing broad staff enterprise-record creation is
  not acceptable evidence of module isolation.
- Complete mobile/tablet/desktop visual, keyboard, contrast and measured
  performance acceptance with representative screenshots.
- Enhanced-model live acceptance and configured female voice verification.
- Single intended scheduler deployment, approved pilot definitions and
  operator ownership; no additional worker activated here.
- Approved recipient provider tests, confirmed delivery evidence and safe
  reconciliation for ambiguous/provider-accepted messages.
- Named clinical, privacy, fluent Kiswahili and operational acceptance.
- Monitoring/operator alert receipt, isolated backup/rollback rehearsal.
- Production project/domain identity and explicit promotion approval.

The decision sheet `LAUNCH_AUTHORITY_AND_ACCEPTANCE_DECISIONS.md` records
missing operational decisions without inventing grants or approvals.

## Rollback boundary

Do not promote this preview or change production aliases/DNS. For a staging
rollback, select a previously certified deployment in the same canonical
project, verify its SHA/database identity and rerun the staging gate. A
rollback rehearsal still requires the specified isolated destination and
approval. Preserve current migration/data evidence; do not reset clinical data.
