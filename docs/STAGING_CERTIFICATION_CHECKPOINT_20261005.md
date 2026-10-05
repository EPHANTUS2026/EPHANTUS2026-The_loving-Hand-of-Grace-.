# LHG isolated staging checkpoint — 5 October 2026

Verdict: **NO-GO**. Deployment succeeded; full staging certification did not.

## Verified identity and deployment

- Repository: EPHANTUS2026/EPHANTUS2026-The_loving-Hand-of-Grace-.
- Branch: repair/lhg-launch-completion-20261005.
- Local implementation SHA: 0253f2646560e4238d71b766e3fe1efce351b175.
- Published GitHub SHA: c636d689b8cf099b4631becde68a88c4165619e0.
- Identical source tree: 78583431e024b2c96ba270607f3dab43bc3e8f08.
- Canonical project: loving-hand-of-grace-staging.
- Project ID: prj_fabxbaSexQuS7In3lDTb2tGFxUHZ.
- Deployment: dpl_2TYgWj3dVdWBke33bANRq6y6usKG.
- Target: preview (null production target); status READY.
- Preview: https://loving-hand-of-grace-staging-psmndr1ih-zedcollectionskenya.vercel.app/
- Vercel Authentication remains enabled for the canonical project.

The command-line Git push lacked credentials. The existing connected GitHub
integration created the source tree and commit and published the new repair
branch. Tree-hash equality proves source equivalence despite different commit
metadata. Main and production aliases were not changed.

## Browser and certification evidence

The browser opened the preview homepage, displaying the correct Loving Hand of
Grace title, navigation, recovery content, contact CTAs and Grace control.
This is homepage-render evidence only, not comprehensive visual acceptance.

The runtime deployment-identity fetch through the Vercel connector was rejected
by auto-review because that tool creates/reuses a temporary authentication link.
No temporary link was created or used. The permitted alternative of opening the
identity endpoint in the existing browser session returned ERR_BLOCKED_BY_CLIENT.
No protection change, credential extraction or indirect bypass was attempted.

Update at 13:52 Africa/Nairobi: the owner supplied a screenshot of the live
deployment-identity endpoint. It reports environment preview, Git SHA
c636d689b8cf099b4631becde68a88c4165619e0, the intended repository/owner,
supabaseRef and expectedSupabaseRef rpszhpjmchirzzndasrb, and identityValid true.
This is owner-browser runtime evidence, not automated browser certification.
After explicit temporary-link approval, the connector still returned 403 at
read_protection_bypass. Ordinary project, deployment and alias reads succeeded
without an explicit team parameter; team-scoped lookups returned 404. The
verification browser still returned ERR_BLOCKED_BY_CLIENT at the identity URL.
No mobile/tablet visual acceptance, portal authority certification, live
scheduler cycle, provider delivery, voice listening acceptance or performance
measurement is claimed. No representative screenshot set has been certified.

## Status by phase

| Phase | Status | Next gate |
| --- | --- | --- |
| Isolated deployment | Passed | Deployment metadata verifies canonical project and published SHA |
| Runtime identity | Passed through owner screenshot | Exact candidate SHA and expected Supabase reference match |
| Browser acceptance | Blocked | Working authenticated automation path; then desktop/tablet/mobile and portal checks |
| Enterprise authority | Outstanding | Approved module/action and assignment matrix; implementation and direct API/RLS bypass tests |
| Scheduler and notifications | Outstanding | Single approved worker owner, reconciled worker states, live concurrency and receipt evidence |
| Human acceptance | Blocked | Named clinical/privacy/Kiswahili/operations reviewers and genuine recorded decisions |
| Exact-commit release certification | Outstanding | All mandatory gates on the frozen published SHA |
| Production | Not approved / unchanged | Explicit promotion approval only after certification |

## Required decision

The owner authorised a read-only temporary verification link, but creation
remains blocked by connector access errors. Establish another approved
authenticated automation path or repair the connector. A temporary
link can grant access to its holder during its lifetime, so it must not be shared
publicly or treated as approval to weaken project-wide protection. Retain
application Client/Family/Staff/Admin authentication throughout.

No database mutations, real notifications, scheduled worker activations,
DNS changes, project disconnections or production promotions were performed.
Existing failed scheduler runs and clinical data were untouched.

For rollback, keep this preview unpromoted. Production still uses its existing
deployment. No rollback drill was performed; any live alias change requires
separate approval and database compatibility checks.

## Subsequent local notification repair

Both notification entry points now use lib/notifications/outbox-worker.js.
The scheduler's numeric limit interface is preserved. The shared worker uses
the existing queued/sending/delivered/dead_letter outbox states and the existing
provider adapters, recipient allowlist and approved template checks. An atomic
status/attempt claim prevents concurrent dispatch. Disabled mode does not claim
work. Provider acceptance remains sending with an accepted receipt; it never
becomes delivered without a delivery result. Timeouts, malformed responses and
provider 5xx outcomes are held for reconciliation, not blindly resent. Retry
exhaustion produces dead letters; persisted errors contain bounded codes only.

Accepted/ambiguous sending rows still require an operator/provider receipt
reconciliation workflow. This repair does not implement verified delivery
webhooks, activate workers, repair historical rows, or claim delivery evidence.
No schema migration or live database mutation was performed.

Fresh npm ci --ignore-scripts and npm audit --audit-level=high passed with zero
vulnerabilities. verify:static, test:launch-repairs, verify:grace, the expanded
notification concurrency/failure suite and production build (86 pages) passed.
These are local results; enhanced-model, real audio and live browser acceptance
are not inferred from them. The deployed c636 candidate does not yet contain
this subsequent repair. Full launch remains NO-GO.

## Notification repair publication checkpoint

The repair was published as a fast-forward on the existing repair branch via
the authorised GitHub connection. Published SHA:
e972bd3d6b8072ed227c7c994f25959835408ccf. Source tree:
d40c7c7b7a0b8e4765b06ecd5a89bb38f9aacc1a, exactly matching local tested
commit 1e7d3e252248e4e0acc66d3e4dedd03d792cda16.

Vercel created preview deployment dpl_H5Q9PQqitgZ4YnTRWuTYG8DJGPB1 in
prj_fabxbaSexQuS7In3lDTb2tGFxUHZ, target null, correct repository and branch.
URL: https://loving-hand-of-grace-staging-c1mjutdgu-zedcollectionskenya.vercel.app/
The deployment progressed QUEUED -> BUILDING -> READY. Build-event read returned
404 while queued; deployment metadata subsequently confirmed READY with no
alias error. Runtime identity for this new SHA has not yet been certified.

The verification browser opened the new homepage, followed Knowledge navigation
and then Daily Recovery. Accessibility observations and viewport screenshots
confirm the Knowledge image banner renders with text over its light overlay,
and the Daily Recovery landing page shows all five ordered meditation links
with Beginning Again featured. This is a limited desktop render/navigation
smoke check, not full responsive, contrast or portal acceptance. Individual
meditation playback, reflection and direct-refresh checks remain outstanding.

Production Assurance triggers on main pushes/PRs or manual dispatch; no
workflow run exists for this repair-branch push. Exact-commit CI certification
remains outstanding. Its current staging URL comes from an existing secret
(or an older branch-specific override), so it must target the new candidate
before a meaningful live gate run. No production promotion, schema mutation,
provider send or scheduled worker invocation was performed.

## Additional live browser checks — 5 October, after 14:11 Nairobi

On deployment dpl_H5Q9PQqitgZ4YnTRWuTYG8DJGPB1:

- All five meditation detail URLs load directly with the supplied quotation,
  supporting text where present and reflection question. Beginning Again
  reloads successfully; its optional scripture disclosure expands to the
  supplied Lamentations excerpt and resets closed on refresh. No optional
  scripture disclosure appears on the other four entries. The cravings entry
  has the separate optional-breathing and urgent-support safety note.
- All six service detail URLs load directly with their matching headings,
  confidential support CTA, assessment CTA and accordion controls. The Aftercare
  process disclosure expands with Enter and survives page refresh.
- Recovery Journey, Life at Grace and Contact render in browser. My Space and
  Families redirect this application-signed-out session to login; no protected
  client/family care records were displayed. This is not an API/RLS bypass test.
- Grace rules-based live synthetic conversation: "I am anxious" produces
  relevant validation, optional grounding and a choice of grounding/talking.
  Selecting "I want to talk about it" produces "You can take your time. What
  has been making you feel anxious today?" Context was retained.
  "Nina wasiwasi" produces a Kiswahili validation, optional grounding exercise
  and choice to talk. This proves language/relevance for this fixture, not
  fluent-speaker acceptance of the complete assistant.
- The new candidate's runtime identity endpoint remains blocked by
  ERR_BLOCKED_BY_CLIENT in the verification browser. Prior owner-screenshot
  certification of c636 does not certify runtime e972. Deployment metadata
  confirms e972, but these are different kinds of evidence.

No new authenticated account, protected-record mutation, real notification,
audio send, enhanced-model consent or clinical/human approval was created.
These limited desktop checks do not establish measured contrast, full keyboard
coverage, mobile/tablet layouts, playback quality or full launch readiness.
