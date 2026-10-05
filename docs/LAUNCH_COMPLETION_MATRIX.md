# LHG launch completion matrix

Updated 2026-09-26. Completion means evidence for every launch-critical gate; an estimated percentage cannot override a blocked gate.

| Area | Current evidence / gap | Required exit evidence |
| --- | --- | --- |
| Repository and deployment | Local repair branch; Git HTTPS lacks credentials; connected Vercel team exposes only ZED Homes | Push candidate, deploy canonical LHG staging, match full commit SHA, repository and Supabase identity |
| Build and dependency reproducibility | Previous production build passed; CI now uses lockfile via npm ci | Production Assurance passes on final candidate |
| Grace safety and grounding | Prior local evaluation suite passed | Final candidate evaluations plus deployed authorized knowledge retrieval |
| Client and Family privacy | Isolation suites exist | Live client A/B, family consent/revocation and unauthenticated denials |
| Staff authority | Relationship matrix added | Assigned allow; unrelated, forged, revoked, ended and future assignment deny on deployed candidate |
| Recovery and bookings | Authoritative projection repair and transactional tests exist | Live full recovery closure, audit provenance, duplicate/racing booking tests |
| Operations | Health projection regressions passed | Deployed source reconciliation and role-denial tests |
| Notifications | Scheduler claim/retry regressions added | Reconcile both worker implementations and DB statuses; approved templates and recipient restrictions; verified provider acceptance versus delivery receipts; ambiguous send recovery; retry/dead-letter proof |
| Browser and accessibility | Not certified | Desktop/mobile journeys, keyboard/focus/labels, error states, no browser exceptions |
| Monitoring | Health and scheduler signals exist | Demonstrated failure detection, alert receipt by designated operator, incident response evidence |
| Backup and recovery | Not certified | Restore into isolated database, integrity and access-policy checks, measured recovery time and data-loss window |
| Rollback | Not certified | Revert staging to known good deployment, validate schema compatibility and identity, then restore candidate |
| Governance and operations | Sign-off outstanding | Named service owner, incident owner, reviewed care content, consent/privacy and retention procedures |

## Current blockers and execution order

1. Restore authenticated GitHub push and access to the canonical LHG Vercel project. Do not deploy into the unrelated ZED Homes project.
2. Reconcile notification schema and workers before certifying communications. The legacy scheduler and internal worker currently differ; migrations list queued/sending/delivered/failed/dead_letter while the internal worker also writes retry/sent. Confirm actual staging constraints before migrating.
3. Deploy the final candidate and run identity verification before any live synthetic mutations, then Production Assurance and the authority matrix.
4. Complete browser, provider, monitoring, isolated restore and staging rollback exercises. Do not treat synthetic capture-provider acceptance as proof of real delivery.
5. Attach evidence to each row and make the final launch decision. Any missing or failed gate remains blocked.

No real recipient messaging is authorized by this checklist. Use approved synthetic destinations and explicit authorization before external sends.
