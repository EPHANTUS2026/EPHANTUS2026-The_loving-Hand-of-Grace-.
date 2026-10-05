# LHG readiness audit — 5 October 2026, Africa/Nairobi

Verdict: NO-GO for unrestricted production launch.
Target: 7 November 2026; security and acceptance gates take precedence.

This audit rechecked connected Vercel deployment metadata and GitHub job
results, local candidate source and current undecrypted environment inventory.
It did not rerun all suites, apply migrations or obtain human approvals.
Live test evidence is from successful Production Assurance run 37316067145.
Browser acceptance on the latest candidate remains blocked by Vercel sign-in.

## Candidate and evidence

- SHA: `a6dad3de360f2e559e98cb036e3aecd97af39ae8`.
- Deployment: `dpl_DPUnJ6T4NQhq2eQ4W8kZN5xtWDX8`, READY, preview target.
- Project: `loving-hand-of-grace-staging`, `prj_fabxbaSexQuS7In3lDTb2tGFxUHZ`.
- Supabase runtime identity verified by CI: `rpszhpjmchirzzndasrb`.
- Job: `111783002536`, all steps completed successfully.
- Migration inventory last recorded: `20261005010009`; not freshly requeried here.

## Area checklist

| Area | Status | Evidence or remaining requirement |
| --- | --- | --- |
| Staging identity | Passed | READY deployment and CI exact runtime SHA/database verification |
| Installation, dependency audit and build | Passed | Successful reproducible CI install, security gate and production build |
| Client/family protection and staff relationships | Passed for tested boundaries | Live synthetic isolation, forgery, family denial and assignment suite; does not certify enterprise permissions |
| Bookings, recovery journeys and check-ins | Passed for tested journeys | Transactions, concurrency, direct-write denial, E2E and durable receipt suite |
| Grace rules/context/safety | Passed for tested fixtures | Live anxiety/Kiswahili/context/crisis and automated adversarial evaluations |
| Public categories, services and meditations | Outstanding final browser acceptance | Catalogue/content tests pass; earlier desktop checks are not full acceptance of this candidate |
| Responsive UI, accessibility and performance | Blocked | Browser sign-in; mobile/tablet, measured contrast/performance and screenshots missing |
| Enterprise module/action authority | Blocked | Owner/Director matrix undecided; broad staff record creation still present |
| Enhanced Grace and Read Aloud | Blocked | Enhanced live acceptance missing; all four Azure settings absent |
| Scheduler | Outstanding | Sole deployment/operator/pilot selection and actual run certification missing |
| Notifications | Outstanding | Worker regression tests pass; approved delivery, ambiguous-send recovery and receipt evidence missing |
| Human clinical/privacy/language/operations reviews | Outstanding | Named reviewers assigned, no acceptance receipts recorded |
| Monitoring, restore and rollback | Outstanding | Runbook prepared; alert receipt and isolated rehearsals not performed |
| Production release | Blocked | Production identity/approval and enforced mandatory promotion checks not certified |

## Critical source finding

`app/api/graceflow/records/route.js` still accepts a broad active staff-role
list without checking module/action grants, and writes with privileged database
access. Its source also performs record/workflow/event/task/audit writes
sequentially and exposes the caught error message. The authority gap is a
verified source finding. Partial-write/error exposure behaviour was not newly
reproduced against live staging in this audit. These issues need repair and
negative tests; existing care-relationship tests do not certify this endpoint.

## Azure inventory finding

Current canonical-project environment inventory has no `AZURE_SPEECH_KEY`,
`AZURE_SPEECH_REGION`, `GRACE_TTS_ENABLED` or
`GRACE_TTS_PROCESSING_APPROVED`. No secrets were decrypted. Account/resource
provisioning and real voice availability are not established.

## Required completion order

1. Restore authorised browser access and complete responsive/accessibility and
   public/protected navigation acceptance with actual screenshots.
2. Owner and Director decide enterprise module/action scope. Enforce it across
   pages, APIs, RLS, workflow/approval/reporting paths and test bypasses.
3. Complete enhanced Grace, Azure provisioning, both actual voice/control tests
   and assigned human reviews. Do not fabricate processing approval.
4. Confirm one scheduler and pilot/operator; obtain approved synthetic recipient
   delivery and safe recovery evidence without real clinical notifications.
5. Verify operator monitoring; approve and perform isolated restore/rollback.
6. Freeze final SHA, rerun mandatory certification and obtain production approval.

No defensible overall completion percentage is assigned: engineering passes
cannot substitute for blocked mandatory release gates. Production is unchanged.
