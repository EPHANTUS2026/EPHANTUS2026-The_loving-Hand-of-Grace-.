# LHG staff workflow guide

Prepared 5 October 2026. Audience: authorised system users. This guide describes existing screens and limits; it does not grant access or approve operational automation. Use synthetic training examples, never real client information in public Grace or shared training files.

## Start your shift

1. Use the Centre-provided sign-in account. Never share passwords or borrow another person's login.
2. Confirm the correct LHG environment and your destination: Staff portal or Management overview. A staging preview is not evidence of production release.
3. Open GraceFlow using the named link. “Protected workspace” is a security label, not a navigation button.
4. Open your assigned module. Missing navigation, denied records or an empty list may reflect authority scope. Request a specific assignment from the authorised operator; do not change a URL to bypass it.
5. Review outstanding tasks and recorded requests. Identify the responsible person, current state and next permitted action before acting.

## Authority and confidentiality

Clients access their own authorised records. Family members access only information covered by valid consent. Staff access assigned cases under the relationship authority rules. Enterprise records require explicit module/action and owned/assigned-record authority. Administrator status alone does not grant every enterprise action.

Keep read, create, edit, approve, execute and export distinct. Check the assignment is current; revoked or inactive accounts must not be used. If an action is denied, stop that action and request review. Never put client names, medical notes, passwords, access tokens, family messages or consent documents into a public chat, generic enterprise notes or training examples.

## Care workspace navigation

| Screen | Staff procedure | Evidence and boundary |
| --- | --- | --- |
| Staff portal | Review authorised work and use the navigation to the relevant area. | Counts are not proof of completed care. |
| Care Operations | Review system health and exceptions visible to your role. | Provider configuration or acceptance does not prove delivery. |
| Admissions | Review assigned admission work and verified request status. | An enquiry is not a confirmed booking or admission. |
| Case management | Open only assigned cases; verify client identity and authorised relationship before editing. | Never use another case ID to access an unrelated client. |
| Schedule | Review approved appointments and availability shown by the system. | Do not promise a slot until its authoritative confirmation exists. |
| Documents | Use the existing protected document workflow and record the correct case or operational context. | A filename or draft is not signed approval. |
| Billing | Review permitted financial information and escalate discrepancies. | A generic workflow record is not an executed payment or journal. |
| Notifications | Inspect state, attempts and available receipts. | Accepted, delivered, ambiguous and failed are different states. |
| Grace Staff | Use authorised staff capabilities within your assignment. | Grace does not replace clinical judgement or consent. |

Screen availability depends on your role and assignments. Follow the Centre’s approved clinical and safeguarding SOPs for actual care decisions; this software guide does not replace them.

## GraceFlow records, tasks and transitions

1. Open the assigned module from GraceFlow. If creation is enabled, choose a valid record type, concise title, priority and necessary operational context.
2. Submit once. Confirm the returned record/workflow receipt or refreshed persisted record. An unchanged spinner, optimistic text or browser message alone is not durable proof.
3. Review the current task/state. Do not mark an action complete merely because a record exists.
4. Perform only an explicitly permitted transition. Consequential clinical, safeguarding, HR and financial judgement remains with authorised humans.
5. Preserve the audit trail. Report errors with the environment, time, record reference and redacted error—not full client details or secrets.

The generic enterprise adapter tracks records and review work. Generic approval/execution remains blocked pending approved policies and certified adapters. Inventory has a separate stock-posting adapter; it does not enable unrelated enterprise execution.

| Module | Tracked record types / purpose | Completion boundary |
| --- | --- | --- |
| Purchase | Requests, orders and vendors | No completed procurement/payment is inferred from a record. |
| Inventory | Item register, pending IN/OUT, posted ledger and count reviews | Use the dedicated inventory procedure below. |
| HR | Employee, leave, recruitment and onboarding records | An HR record is not an approved employment decision. |
| Helpdesk | Tickets, service requests and incidents | Confirm the actual remedy before claiming resolution. |
| Timesheets | Timesheets and time entries | No payroll or approved hours inferred. |
| Projects | Projects, tasks and milestones | Evidence actual delivery separately. |
| CRM | Leads, opportunities, organisations and activities | No contact or outreach is implied by creation. |
| Sign | Signature requests and templates | A request is not a legally completed signature. |
| Accounting | Bills, expenses, journals and payment requests | No posted accounting transaction or payment is implied. |
| Discuss | Channels, threads and discussions | Keep communication inside approved access boundaries. |
| Documents | Documents, policies and procedures | Draft, approved and published states remain distinct. |
| Field Service | Work orders, visits and asset service | Record actual service evidence before claiming completion. |
| Email Marketing | Campaigns, audiences and assets | A campaign record does not send messages. |

## Inventory procedure

Edwin F. Ngala is the selected recorder; his verified account remains pending. Ephantus Githinji is the independently assigned approver. The approver has no recorder-create grant. Item review scope must be explicitly assigned; module access does not expose another staff member’s owned records automatically.

1. The assigned recorder creates the item ID, name, unit, KES unit cost and reorder level. Opening stock is an IN movement, not a quantity edit.
2. Log each movement with unique reference, date, item, IN/OUT, positive quantity, purpose, receiver and signed receipt/voucher reference. OUT also requires issued to; IN requires received from.
3. CSV upload uses the downloadable website template: 1–200 rows, maximum 128 KB. Export the relevant Google Sheet as CSV and map its headers to the template. Direct XLSX import is not currently supported. Review the preview before submitting.
4. Submission creates pending movements. Balances do not change until posting. Invalid batches roll back together.
5. The independent approver checks the actual retained signed voucher, records its approval reference and posts. Both approve and execute authority plus item read scope are required. Self-approval and insufficient-stock posting are blocked. A typed name is not an electronic signature.
6. Retain the returned receipt. If connectivity fails, retry original details with the same reference. Never create a new reference just to bypass an uncertain save.
7. Every Friday, count each assigned item and save its physical quantity and notes. Off-Friday counts need an explanation. Count snapshots preserve system quantity and variance; they never adjust stock.
8. Investigate differences and submit reviewed corrective IN/OUT movements. Never edit master quantity or old ledger entries directly.

| Calculation | Formula |
| --- | --- |
| Balance | Total posted IN − total posted OUT |
| Item value | Balance × configured unit cost |
| Total inventory value | Sum of values for authorised items |
| Low stock | Balance > 0 and balance ≤ reorder level |
| Out of stock | Balance = 0 |
| Count variance | Physical quantity − system balance captured at count save |

Values are operational estimates, not FIFO/accounting certification. Latest-five uses actual posting order. Movement/count screens display the latest 200/100 records.

## Grace, check-ins and human contact

Public Grace provides general support and information. Do not supply private care records there. Enhanced conversation and Azure speech require separate informed consent; unavailable providers must not be represented as working. Read Aloud must begin only after a click.

A private check-in requires an authorised client account and confirmed save receipt. Staff must not save a check-in while impersonating a client. A contact request receipt is not proof a counsellor connected, a callback deadline was met or a message was delivered. Use approved human coverage and escalation procedures. Urgent danger belongs with appropriate emergency support; this website is not emergency monitoring.

## Exceptions and end of shift

| Situation | Required action |
| --- | --- |
| Access denied | Verify account/environment and request the specific missing assignment; do not borrow credentials. |
| Save timeout / no receipt | Keep original reference/details, check the persisted record and safely retry where idempotency is supported. |
| Duplicate conflict | Compare the original record; investigate changed details instead of bypassing the reference. |
| Insufficient stock | Count/reconcile receipts; never force a negative balance or edit master quantity. |
| Notification ambiguous | Escalate to the operator for reconciliation; do not resend blindly. |
| Sensitive data appears publicly | Stop using the affected path and notify the approved incident lead through the authorised channel. Do not copy the data into a shared report. |
| Provider unavailable | Use the approved human contact path; do not claim automated delivery or voice success. |

At shift end, record unresolved references, responsible handoff and next action in the authorised workspace, verify durable receipts, close protected screens and sign out. Do not leave exported sensitive records on shared devices.

## Training acceptance

An operator should demonstrate sign-in/denial, one permitted task with receipt, denied unrelated-record access, inventory submission and independent posting, a failed upload, insufficient stock and a Friday count discrepancy using synthetic fixtures. Record tester, candidate SHA, device, date and result. This document is prepared guidance; named operational acceptance remains pending.
