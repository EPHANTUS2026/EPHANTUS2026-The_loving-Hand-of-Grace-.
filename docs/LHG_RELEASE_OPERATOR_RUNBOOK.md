# LHG release operator runbook

Status: prepared, not rehearsed. Use synthetic fixtures. No production promotion,
provider sends, database restoration or permission changes authorised here.

## Evidence and release check

Run Production Assurance against the exact candidate and retain its run ID,
deployed identity, database reference and complete applied migration inventory.
Complete each gate required by `lib/release-certification.mjs` with status,
candidateSha, reviewer, reviewedAt (timestamp with timezone) and evidence reference.
Use `docs/release-evidence.json` as a schema template; its empty fields are
intentional. They do not replace exact-candidate CI and deployed identity evidence.

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

## Monitoring handover worksheet

Populate the operator, approved threshold, coverage and evidence fields before launch. The table is a proposed observation plan, not configured alerting or a claimed alert receipt.

| Signal | Evidence surface | Trigger decision needed | Immediate response |
| --- | --- | --- | --- |
| Public availability / direct route | External availability check and deployed identity | Frequency and allowed error duration | Verify current deployment and affected route; retain redacted status. |
| Login / authority failures | Protected operational health and test-user journey | Expected denial vs regression threshold | Check trusted active profile/assignment; never broaden access to silence a failure. |
| Check-in / booking save | Durable receipt, transaction state and existing operational tests | Missing receipt/failure threshold | Reconcile original idempotency key before retrying. |
| Grace / model failure | Approved health surface and synthetic relevance test | Acceptable fallback/latency policy | Preserve truthful fallback and human contact route. |
| Scheduler lease/run age | Recorded worker runs, lease and task state | Sole worker, coverage and stale-run threshold | Preserve failure evidence; avoid starting a second worker. |
| Notifications / dead letters | Attempts, dead-letter and ambiguous-send states | Retry limits and allowlisted recipients | Reconcile ambiguous sends; do not equate acceptance with delivery. |
| Inventory posting | Pending/posting receipts, signed voucher references and count variance | Approved exception handling and item scope | Verify independent approver; do not edit ledger quantity directly. |

Incident lead: pending. Backup contact: pending. Coverage hours: pending. Alert channel/recipient approval: pending. Provider sends and alert receipt test: not performed.

## Incident sequence for the authorised operator

1. Record environment, candidate SHA, deployment ID, discovery time and redacted symptom. Separate public outage, denied access, sensitive exposure and uncertain write.
2. Check impact through approved health surfaces and synthetic journeys. Never copy clinical payloads or credentials into incident notes.
3. Escalate through the approved human contact list and follow clinical/safeguarding policy for urgent danger. Named lead/coverage must be agreed before launch.
4. Contain only the affected subsystem through approved controls. Preserve unrelated services, failed-run evidence and uncertain-write references.
5. Reconcile durable receipts and provider states before replay. Use existing idempotency; ambiguous sends need a human decision.
6. Restore through an approved compatible deployment or isolated recovery rehearsal. Production promotion, DNS and restoration are separate approval actions.
7. Verify exact identity, public paths, protected denial/allow cases and monitoring. Record recovery time and outstanding data reconciliation.
8. Retain an attributable incident receipt and root-cause follow-up; no alert or recovery exercise is certified until actually performed.
