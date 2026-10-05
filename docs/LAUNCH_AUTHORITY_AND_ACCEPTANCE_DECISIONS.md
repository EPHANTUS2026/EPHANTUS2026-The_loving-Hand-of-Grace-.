# LHG launch authority and acceptance decisions

Status: decisions outstanding. This document grants no access and records no
human approval. Target launch is 7 November 2026, Africa/Nairobi.

## Enterprise authority decision sheet

The existing enterprise-record API permits its broad staff role list to create
records across all modules, using a service-role database write. Module pages
use broad staff access and database policies have not yet been certified for
module/action isolation. These are release blockers, not approved grants.

For each module, the operational owner must identify trusted staff roles or
named assignees for each action. State whether read/edit/export is limited to
owned records, assigned records, department records or the whole module.
Specify approval thresholds, prohibited self-approval, revocation handling and
who may execute the approved action. A role name alone is not a final policy.

| Module | Read | Create | Edit | Approve | Execute | Export |
| --- | --- | --- | --- | --- | --- | --- |
| Purchase | Pending | Pending | Pending | Pending | Pending | Pending |
| Inventory | Pending | Pending | Pending | Pending | Pending | Pending |
| HR | Pending | Pending | Pending | Pending | Pending | Pending |
| Helpdesk | Pending | Pending | Pending | Pending | Pending | Pending |
| Timesheets | Pending | Pending | Pending | Pending | Pending | Pending |
| Projects | Pending | Pending | Pending | Pending | Pending | Pending |
| CRM | Pending | Pending | Pending | Pending | Pending | Pending |
| Sign | Pending | Pending | Pending | Pending | Pending | Pending |
| Accounting | Pending | Pending | Pending | Pending | Pending | Pending |
| Discuss | Pending | Pending | Pending | Pending | Pending | Pending |
| Documents | Pending | Pending | Pending | Pending | Pending | Pending |
| Field Service | Pending | Pending | Pending | Pending | Pending | Pending |
| Email Marketing | Pending | Pending | Pending | Pending | Pending | Pending |

Operational decision owners: Ephantus Githinji (owner) and Bishop Beatrice
Wambui Njuguna (Director), assigned by the owner on 5 October 2026.
Approved matrix version/date: none.
Launch-critical GraceFlow pilot definitions: undecided; none activated here.
External notification recipients/provider tests: not approved.

## Named human acceptance

| Review | Reviewer | Required evidence | Decision |
| --- | --- | --- | --- |
| Clinical | Paul Kimani, Counselling Psychologist; supported by Bridget Kinya, Psychiatric Nurse | Grace safety and boundaries, crisis response, service/team claims, meditations | Pending |
| Recovery and family experience | Edwin F. Ngala, Addiction Counsellor | Compassionate language, recovery relevance, family guidance and practical next steps | Pending |
| Privacy | Edwin F. Ngala, Addiction Counsellor | Public wording, consent, data minimisation, providers, retention and authority boundaries | Pending |
| Fluent Kiswahili | Edwin F. Ngala, Addiction Counsellor | Real bilingual conversations and listening to sw-KE-ZuriNeural | Pending |
| English voice | Edwin F. Ngala, Addiction Counsellor | Listening to en-KE-AsiliaNeural and playback controls | Pending |
| Operations | Bishop Beatrice Wambui Njuguna, Director | Enquiry expectations, staffed coverage, escalation ownership and handoff receipts | Pending |

Assignments were authorised by the owner on 5 October 2026. They do not
constitute acceptance, verified qualifications, new system permissions or
permission to disclose client records. Use synthetic cases for these reviews.
Review instructions and the receipt template are in `LHG_LAUNCH_REVIEW_PACK.md`.

Each reviewer must provide their name, relevant role, exact candidate SHA,
review date, evidence links, exceptions and an explicit accept/reject decision.
Source tests and model evaluations cannot fill these human decisions.

## Release operations decisions

- Confirm the sole intended scheduled-worker deployment and accountable operator.
- Approve synthetic notification recipients before provider send/delivery tests.
- Approve an isolated backup restoration and staging rollback rehearsal, with
  explicit destinations and no production overwrite.
- Identify production project and public domain; approve promotion only after
  mandatory engineering and human gates pass.

Existing approvals for staging engineering do not constitute production
promotion, clinical approval or permission to send real notifications.
