# Proposed LHG enterprise permissions — decision draft

Prepared 5 October 2026. NOT approved, enforced or an access grant.
Decision owners: Ephantus Githinji and Bishop Beatrice Wambui Njuguna.
Existing care-record and family-consent boundaries remain separate and intact.

## Recommended module policy

Role labels below must map to active, trusted server records. Named department
assignees are preferable where Centre staffing does not match a role label.
"Supervisor" means a specifically authorised supervisor for that module,
not every manager or clinical staff member. No blanket cross-module staff access.

| Module | Read / create / edit proposal | Approve proposal | Execute / export proposal |
| --- | --- | --- | --- |
| Purchase | Procurement: assigned department records | Independent procurement supervisor; spending thresholds to be decided | Assigned procurement operator after approval; export separately authorised |
| Inventory | Inventory staff: assigned stock locations | Independent inventory supervisor for adjustments | Assigned stock operator only after a certified stock-movement adapter; export separately authorised |
| HR | HR: authorised personnel records; staff: their own permitted requests | Independent HR supervisor | HR operator for approved changes; personnel exports require explicit restricted grant |
| Helpdesk | Staff: own tickets; helpdesk: assigned tickets | Assigned helpdesk supervisor for restricted actions | Assigned helpdesk operator; export limited to authorised non-clinical ticket data |
| Timesheets | Staff: own timesheets; supervisor: assigned team | Assigned supervisor, no self-approval | Approved payroll/accounting handoff only through certified integration; export separately authorised |
| Projects | Project staff: assigned projects | Assigned project supervisor | Assigned project operator; assigned-project exports only when granted |
| CRM | Admissions/CRM staff: assigned enquiries and approved contact data | Assigned CRM supervisor for restricted changes | Assigned operator; contact export requires explicit purpose/scope grant |
| Sign | Assigned document participants; edit only before signature request | Independent authorised document approver | Only named signatory through verified signature flow; export limited to permitted documents |
| Accounting | Accounting/finance staff: assigned ledger scope | Independent accounting approver with thresholds | Assigned accounting operator through certified posting/reconciliation; export separately authorised |
| Discuss | Active members: their authorised channels/messages | Channel moderator for restricted moderation | Authorised messaging only; bulk export denied unless specifically granted |
| Documents | Explicit document/folder assignees, read/edit grants separately | Assigned document approver | Authorised publishing/sharing only; export requires document permission |
| Field Service | Field staff: assigned jobs; supervisor: assigned team | Assigned field-service supervisor | Assigned job operator; export limited to approved job data |
| Email Marketing | Marketing: approved campaign/audience scope | Independent marketing approver | Authorised sender after campaign/consent/provider checks; recipient export separately granted |

## Decisions needed before implementation

For each module, confirm who holds the proposed role, authorised record scope,
whether create and edit are both allowed, approval thresholds and export scope.
If a function is not needed for launch, mark it disabled instead of granting it.
The owner/Director may oversee policy decisions without automatically receiving
clinical, personnel or financial data access.

Recommended common controls:

- No access when the user is inactive, assignment ended/revoked, or scope absent.
- Approve requires an independent actor for finance, purchasing, inventory
  adjustments, HR-sensitive actions, signatures and campaign sending.
- Execute requires a current approval and a certified actual integration.
  A generic enterprise record cannot stand in for stock movement, ledger posting,
  legal signature, payroll processing or campaign delivery.
- Export is a distinct grant; ordinary read access does not imply bulk export.
- Resolve roles, assignments and approval authority on the server and enforce
  the same policy in APIs, RLS, privileged functions and UI.
- Preserve immutable audit provenance and use transactional record/workflow
  creation. Return bounded public errors rather than raw database exceptions.

## Owner/Director decision receipt

- Module/action matrix version:
- Changes to this proposal:
- Named role holders/assignees and scopes:
- Approval thresholds / independent approvers:
- Disabled launch functions:
- Approved pilot modules:
- Decision owner(s), date and explicit acceptance:

No receipt is filled in automatically. Accepting reviewer assignments does not
approve this permission matrix. Engineering enforcement follows the actual
recorded policy; this draft changes no production or staging permissions.
