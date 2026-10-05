# LHG launch completion — 5 October 2026

Verdict: **NO-GO**. This is an implementation checkpoint, not release certification.

## Latest checkpoint: Tailwind 4 migration

The owner approved the migration. Tailwind and its PostCSS adapter are pinned
to 4.3.3. Autoprefixer was removed; theme configuration now lives in CSS.
The official upgrade tool converted utility names in active page/components.
Its incidental archive changes were restored; the archived copy is unchanged.
Active source scanning is explicitly limited to app and components.
Original colour values (including Slate and status colours), pixel breakpoints,
brand shadow, banner aspect ratio and white overlay rules are preserved in source.
Sucrase 3.35.1 is now an explicit test dependency rather than an accidental
Tailwind transitive dependency.

`npm audit --audit-level=high` reports **zero vulnerabilities across all
dependencies**. Static tests, Grace regressions, launch repairs and the new
Tailwind migration contracts passed. The migrated production build passed.
These results supersede the earlier build-tool audit failure recorded below.
Visual acceptance is still pending: the cloud browser could not access the local
server in the earlier check. Do not treat source contracts as screenshots or
desktop/mobile acceptance. No production deployment was changed.

Next: deploy an isolated canonical staging preview of the exact repair SHA;
verify desktop, tablet and mobile, then complete the remaining authority,
scheduler, provider and human approval gates before production promotion.

Branch: `repair/lhg-launch-completion-20261005`.
Base: `e1650c33ed35979c625f8decc4c10a3a112bcfaf`.
No production promotion, database mutation, DNS change, project disconnection,
external message or security-protection change was performed.
Existing dirty worktrees were preserved using a separate worktree.

## Implemented and locally tested

- Both public intake URLs now use `lib/public-enquiry-handler.js` and the
  existing `submit_public_enquiry` transaction. Consent, validation, body limits,
  origin checks, honeypot, durable duplicate protection and quotas are shared.
  The legacy endpoint no longer performs sequential partial writes or exposes
  submission details. Its old unconsented payload is deliberately rejected;
  the synthetic E2E client now supplies the governed payload and reads back
  its uniquely named synthetic admission server-side.
- Scheduler outcomes include non-sensitive deployment provenance. Failures in
  one subsystem do not suppress later independent subsystems. Exception text
  and returned care records are not stored in these outcomes.
- Manual engine ticks now acquire the same database lease as the scheduler.
  Both endpoints have a 180-second execution limit against a 240-second lease.
  The lease remains until expiry; no unsafe early release was introduced.
- Provider reporting uses existing adapters rather than obsolete webhook
  environment names. Configuration is not health. Authentication verification
  is not delivery. Exact states are recorded in health metadata while retaining
  the existing database status constraint. Persistence failures are no longer
  swallowed by the health collector.
- SMS credentials alone no longer enable an unverified send. SMS authentication
  verification still needs implementation and attributable provider evidence.
- Next.js pinned to 15.5.27; React and React DOM pinned to 19.3.0. Official
  asynchronous-request codemod applied and reviewed. PostCSS pinned to 8.5.29,
  including Next's nested dependency via an explicit override. Lockfile
  regenerated and validated by `npm ci` and `npm ls`.
- CI now runs dependency scanning and new launch-repair regression tests.
- Request IDs accepted from callers must be UUIDs, preventing arbitrary
  user-supplied text entering this operational identifier.

## Evidence

| Check | Result | Scope |
| --- | --- | --- |
| `npm ci --no-fund --no-audit` | Passed | Reproducible local installation |
| `npm audit --omit=dev --audit-level=high` | Passed; zero vulnerabilities | Production dependency graph |
| `npm audit --audit-level=high` | Failed; five high findings | Braces and its build-tool dependency chain |
| `npm run verify:static` | Passed | Existing services, enquiries, operational health, notifications, identity, check-in, speech and meditations |
| `npm run verify:grace` | Passed | Existing rules, safety, authority, relevance, bilingual and adversarial regressions; not human clinical acceptance |
| `npm run test:launch-repairs` | Passed | Actual scheduler route with injected failures and concurrent lease attempts; provider states; shared intake handler |
| `npm run build` | Passed | Next 15.5.27 production build, including patched PostCSS |
| `git diff --check` | Passed | Whitespace integrity |
| Local production server | Passed | Explicit loopback binding; wildcard binding hit environment network-interface error |
| Browser visual acceptance | Blocked | Cloud browser refused local loopback URL with `ERR_BLOCKED_BY_CLIENT` |
| Live scheduler cycles | Not run | Must reconcile worker ownership and ensure no real sends |
| Updated deployed commit certification | Not performed | No claim that live site serves these changes |

## Scheduler reconciliation

The canonical staging production alias served deployment
`dpl_3KAVbemA75aBbQ9DMFVvk21NVMDv`, commit
`856bddb617f974155bde970200edc040f9d78354`, branch `main`.
Its source explicitly queries `status=in.(queued,in_progress,blocked)`.
The certified preview deployment `dpl_FcafiYWFUM1M7seaa29U5DUk4r3u`
serves `e1650c33ed35979c625f8decc4c10a3a112bcfaf`, whose query uses
`active`, matching the database enum.

The database run at 03:00 UTC on 5 October failed with the enum mismatch.
Historical run records contain no deployment provenance, so the older alias is
a strongly supported source candidate, not request-level proof of origin.
Failed-run history was preserved. Promoting an alias and changing deployment
ownership require the explicit approvals in the command.

## Outstanding / blocked release gates

| Area | Status | Required next evidence or decision |
| --- | --- | --- |
| Build-tool dependency security | Blocked | Braces <=3.0.3 has no upstream patched release. Evaluate Tailwind 4 migration versus an explicitly approved, time-limited exception. No exception is accepted here. Tailwind 4 raises browser minimums and changes CSS defaults, requiring compatibility and visual acceptance. |
| Single scheduler owner | Blocked | Confirm intended deployment; reconcile linked projects without disconnecting or promoting without approval. Prove actual scheduled execution and duplicate-worker safety live. |
| Enterprise authority | Outstanding | Module/action matrix, assignment and segregation of duties enforced through pages, APIs, RLS, transitions and reports; current general-staff policies are not certified. |
| Notifications | Outstanding | Reconcile legacy and newer workers, incompatible outbox states, real adapters, ambiguous-send recovery and acceptance-versus-delivery records. No live delivery is certified. |
| Provider acceptance | Blocked | Current provider authentication evidence and explicit approval for synthetic destination sends. |
| GraceFlow pilot | Blocked | Agreed launch workflow set, approvals, SLAs, escalation and named operators. Do not activate arbitrary definitions. |
| Grace clinical/privacy/Kiswahili | Blocked | Genuine named human reviews of both rules and enhanced-model paths. |
| Female Read Aloud | Outstanding | Azure voice availability and human listening acceptance, desktop/mobile controls, no sensitive caching. Existing tests use mocked audio. |
| Public privacy/team/service claims | Blocked | Approved operational wording, coverage, credentials and publication review decisions. |
| Browser/accessibility/performance | Outstanding | Desktop/tablet/mobile live acceptance, keyboard, screen reader, contrast and measured slow-network behaviour. |
| Monitoring | Outstanding | Operator receipt, triage, redaction, backlog/dead-letter alerts and kill-switch verification. |
| Backup/rollback | Blocked | Explicit isolated-drill approval and measured restore evidence. |
| Exact-commit release | Outstanding | Full staging database, authority, transaction and browser gates on the new SHA; no skip-based certification. |
| Public production | Blocked | Intended project/domain and explicit promotion approval after mandatory gates pass. |

## Rollback and incident boundary

These source changes are isolated from the existing worktrees and live site.
No schema was changed. Do not roll back or promote a live deployment without
approval. Before any eventual release, preserve the previous deployment ID,
confirm migration compatibility, define the named incident operator, and
re-certify identity following any rollback. This is not a completed recovery
drill or incident-response acceptance.
