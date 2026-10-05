# LHG release operator runbook

Status: prepared, not rehearsed. Use synthetic fixtures. No production promotion,
provider sends, database restoration or permission changes authorised here.

## Evidence and release check

Run Production Assurance against the exact candidate and retain its run ID,
deployed identity, database reference and complete applied migration inventory.
Complete each gate required by `lib/release-certification.mjs` with status,
candidateSha, reviewer, reviewedAt (timestamp with timezone) and evidence reference.
Use `docs/release-evidence.json` as a schema template; its empty fields are
intentional. They do not replace the already recorded dd071 staging evidence.

Release Certification is a separate, manually dispatched workflow. Supply the
exact deployed candidate SHA and non-sensitive evidence JSON after reviewers
confirm their receipts. Evidence is supplied independently of the candidate's
source commit to avoid a self-referential SHA in a committed manifest. Never put
credentials, client details or sensitive review payloads into workflow inputs.

The validator fails missing, blocked, failed, stale-SHA or unattributed gates.
It validates completeness, not receipt authenticity; operators must inspect
referenced records. Configure the authorised release process to require this
check before promotion. Branch protection/deployment enforcement has NOT been
changed or verified here; a file alone does not prevent direct deployment.

## Monitoring and incident checks

1. Director names the incident lead, backup contact and actual coverage hours.
2. Record monitoring for availability, login, authoritative check-in receipts,
   booking errors, Grace/provider failure, scheduler lease/run age, queued and
   dead-letter messages and ambiguous sends. Use existing authorised operational
   health surfaces. Public availability must not expose protected health data.
3. Agree thresholds from actual operating expectations. No arbitrary thresholds
   are certified by this document.
4. In approved isolated staging, simulate a bounded failure without altering
   real care records. Confirm detection and alert receipt by the named operator.
   Record timestamps, response action and restoration. Do not send an alert to
   someone or activate external notifications without explicit authorisation.
5. During a real incident, capture deployment/run IDs and redacted error codes.
   Avoid storing request text, secrets, client records or provider payloads.
6. Use approved controls to pause the affected subsystem. Preserve failed-run
   evidence; do not conceal failures or mark unresolved work successful.

## Scheduler and communications

Confirm one intended worker deployment and approved pilot definitions before
any worker smoke test. The existing scheduler smoke command executes work;
it is not a read-only health check. Inspect task status, lease and run evidence
without executing additional cycles until the operator approves the pilot.

Provider acceptance is not delivery. Inspect accepted, ambiguous, failed and
dead-letter states separately. Never retry an ambiguous send automatically.
Approve test recipients first and retain attributable delivery receipts. No
provider delivery or ambiguous-message recovery rehearsal is certified yet.

## Isolated backup restoration

Obtain approval naming the source backup and isolated destination project.
Never use ZED infrastructure or overwrite production. Restore using the approved
provider workflow, then check migration/schema inventory, record integrity,
client isolation, family consent/revocation and staff authority using synthetic
accounts. Ensure restored automation and real recipient sends remain disabled.
Record actual recovery duration, backup timestamp/data-loss window, operator,
results and cleanup decision. No restoration was performed here.

## Staging rollback

Approve the staging rehearsal destination and select a previously certified
deployment in the canonical LHG project. Check migration compatibility before
switching the staging alias; do not attempt destructive database downgrades.
Verify exact SHA/database identity and rerun public/protected synthetic tests.
Restore the intended candidate and recertify its identity and relevant gates.
Record deployment IDs, timings, operator and results. No alias was changed here.

## Production decision

Confirm intended production project/domain. Inspect all named receipts and
engineering evidence for the final frozen candidate. Request explicit promotion
approval only once mandatory gates pass. After approved promotion, verify the
signed-out public domain, protected-authority smoke tests and operator monitoring.
If any required gate is missing or fails, retain NO-GO regardless of launch date.
