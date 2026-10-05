# Handover implementation progress - 5 October 2026

## Completed engineering work

- Exported the exact source tree of deployed e3577fadf1c0d85070244455af1566b3e769e1c3 (3529739e59336b4b0bb29f4f42db380a038e1f40) to a fresh directory. Curated export excludes 163 tracked legacy activation/copy/archive entries; 366 files remain. Every exported byte has a Git blob ID and SHA-256 record. This is not a full Git-history archive.
- Clean Node 24.19.0/npm 11.9.0 `npm ci --offline --no-audit --no-fund` succeeded, using the dependency cache without copying node_modules. Static verification, Grace evaluations and production build succeeded. Fresh npm audit reported zero vulnerabilities. No private environment file or clinical database export was used for this clean build. Remote-backed functions still require authorised environment configuration.
- Heuristic private-key/GitHub-token/provider-token/JWT scan found no matches in included source. This is not a guarantee of absence of every secret or a complete licence audit.

## Newly verified security finding and repair

The public security-definer transition_recovery_journey RPC checked trusted active identity and role, but did not check relationship authority for a linked client. Its definer owner bypassed the direct-write guard. A rollback-only synthetic live test reproduced an unrelated clinician's successful enquiry-to-screening transition while grace_staff_authority returned false. No proof admissions remained afterward.

Forward migration source: 20261005181430_recovery_transition_relationship_guard.sql.
Applied canonical LHG remote migration: **20261005181658**, recovery_transition_relationship_guard.

The repair preserves the existing function body and inserts a linked-client journey/care relationship check before stale-state disclosure or mutation. It uses the existing trusted active/time/scope/revocation helper. Role requirements and clinical prerequisites remain. Unlinked intake behaviour is unchanged. No real staff grants, clinical records or messages were changed. The existing approved case assignment mechanism must be used before a clinical transition; administrator role alone is not a relationship grant.

Local real PostgreSQL tests reproduce the old gap then verify assigned allow and unrelated/unassigned administrator, revoked, expired, future, wrong-scope, wrong-purpose, inactive, forged claims, client and anonymous denials, atomic audit behaviour, lifecycle preservation and rerun safety. CI now includes this test. Staging journey fixtures explicitly bind their synthetic staff to fresh synthetic linked clients; they do not create real operational grants.

Live canonical database rollback-only verification after application: unassigned denied, assigned succeeded, revoked denied; zero retained guard clients. The full next-candidate CI still needs to pass; this is not a production release certificate.

## Remaining security review

Public schema CREATE is denied to anon and authenticated. Trusted current-profile/client/staff/role helpers bind auth.uid and active profile. Existing family and Grace staff helpers contain consent/relationship checks. Enterprise creation checks explicit assignments. Public booking/knowledge capabilities remain intentional, subject to their input/token and approved-view boundaries. A completed review of one RPC does not certify every privileged function or every clinical API/RLS path.

Breached-password protection is still disabled. Current Supabase documentation states this feature requires Pro or above. The connected database tools do not expose Auth configuration update or project billing/plan controls; a service-role database key is not a Management API token. No paid upgrade or guessed settings write was attempted. Account owner must verify plan/configuration and enable the supported setting, then recheck advisors.

## Completion order / actual blockers

| Step | Engineering delivered | Remaining prerequisite |
| --- | --- | --- |
| Source / clean build | Curated byte-verified export; clean install/static/Grace/build/audit pass | Receiving operator's independent installation and ownership/licence receipt |
| Database recovery | Migration history and isolated recovery runbook | Named backup source, approved isolated destination, backup access and actual restore evidence; never overwrite staging/production or use ZED infrastructure |
| Management access | Access/credential register and scope procedures | Verified individual management identities, approved scopes and secure credential custodian; no shared/placeholder accounts |
| Security / user journeys | Confirmed linked-transition bypass repaired and live rollback-tested | Next-candidate CI, remaining privileged-path review, Auth breached-password setting, mobile/tablet/full accessibility/performance and signed-in acceptance |
| Staff / inventory | SOP, fixtures and owner approver authority | Edwin's verified controlled address/account, precise item scope and two-user training acceptance |
| Operations / reviews | Runbooks and named review worksheets | Sole worker/pilot, recipient allowlist, monitoring/incident owner, provider tests and human receipts; Azure resource still missing |

No backup restoration, new operational account, credential export, real send, worker activation, DNS change or production promotion occurred. The previous eight PDFs are historical 5 October handover documentation; this addendum takes precedence for the newly discovered RPC finding and the additional migration. Do not rely on their 70-migration count for the latest database, now at least 71 applied entries.
