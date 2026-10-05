# Enterprise authority first enforcement layer

Status: implemented, locally tested and applied to canonical LHG staging after explicit owner approval. Matching application deployment and full staging recertification pending.

## Exact staging change requiring approval

Migration: `supabase/migrations/20261005140223_enterprise_module_authority.sql`.
Target: LHG Supabase `rpszhpjmchirzzndasrb` only.

It adds a private, server-controlled assignment table for all 13 modules and
six distinct actions. There are no operational-user grant inserts. Assignment
absence denies access, including for management roles; named assignees and
scopes still need configuring. A module-level assignment is limited to owned
records; a record-specific assignment permits only that record. Department or
whole-module access is not implicitly granted.

Restrictive RLS guards supplement existing policies on enterprise records,
comments and linked workflows/tasks/events/approvals. Direct enterprise-record
writes are denied. Privileged generic execution is blocked through triggers.
Approval and execution remain unavailable pending thresholds and certified
integrations. Export is separately modelled, with no new export endpoint.
Record edit endpoints and complete department-scope administration are not
implemented by this first layer. This is not full enterprise certification.

The authenticated creation RPC checks current trusted profiles and assignments,
binds owner/requester to the current staff identity and writes the record,
workflow, event, task and audit in one database transaction. The API uses the
user token rather than a service-role write, rejects forged fields and returns
bounded errors. Module listings and create forms follow database authority.

## Impact and deployment order

Existing broad enterprise access will be removed. Operational users without
explicit assignments cannot open modules or create records. Generic engines
cannot complete enterprise records as real signatures, accounting, stock
movements or campaigns. Existing non-enterprise care workflow policies are
retained, but their live regression suite must pass after application.

Owner approved the exact migration with “please proceed”; it was applied on 5 October 2026. Configure specifically approved
assignees; then deploy matching application changes to canonical staging and
rerun exact-SHA identity, care/family/staff authority and enterprise live tests.
Do not deploy the application changes while its required RPCs are absent.
Do not remove guards merely to restore broad access. Use a reviewed forward
repair if problems arise, preserving data and clinical authority boundaries.

## Local verification

- 13-module API allowed/denied fixtures, forged input, origin/size/validation,
  inactive/client denial, user-token calls, error redaction and UI permission
  states passed with mocked external database boundaries.
- Isolated PGlite PostgreSQL: migration execution, owned/assigned reads,
  unrelated/client/anonymous/inactive/revoked/expired/future denial, direct-write
  and grant-forgery denial, generic execution guard and late-failure atomic
  rollback passed. This uses a synthetic schema, not the live Supabase schema.
- Existing static regression checks and production build passed (86 pages).
- New tests are included in `verify:static`; PGlite 0.5.8 is a pinned development
  dependency. No new runtime provider or production infrastructure was added.

## Live staging verification — 5 October 2026

Remote migration version: `20261005141947`, name `enterprise_module_authority`.
The local CLI-generated filename remains `20261005140223_enterprise_module_authority.sql`; remote application assigned a different timestamp.

A rollback-only transaction against the actual Supabase schema passed:
- Unassigned synthetic procurement denied.
- Temporary synthetic owned read/create grant produced an actual record/workflow receipt.
- Unrelated module and unconfigured approval/execution denied.
- Direct record insert denied; unrelated finance record/workflow reads denied.
- Privileged workflow completion denied; revocation effective.
- Transaction rolled back; no operational grants or synthetic records retained.

Security advisors flag intentional deny-all private assignments (RLS without policies) and the intentionally authenticated creation RPC. Existing public booking/knowledge RPC warnings require boundary review; leaked-password protection remains disabled and outstanding. Do not describe the advisor result as clean.

## Approval history

Automatic review initially rejected the migration because exact blast-radius approval was missing. The owner then explicitly approved the exact migration and its denied-by-default impact. The same migration was applied successfully; no bypass was used.
