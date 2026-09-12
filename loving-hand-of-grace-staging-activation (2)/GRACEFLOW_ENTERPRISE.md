# GraceFlow Enterprise Engine

GraceFlow is the staff-only workflow and enterprise operations layer of The Loving Hand of Grace. It is available from the **Staff portal → GraceFlow** navigation and is protected by server-side role checks.

## Permanent architecture

GraceFlow is the single workflow spine for work originating from:
- public website and admissions forms;
- Client Portal and Family Portal actions that create operational work;
- Grace handoffs and service requests;
- staff-created care workflows;
- enterprise/back-office modules;
- API/integration events.

Each flow is persisted through four primary objects:
1. **workflow_instances** — the case/process and current state;
2. **workflow_events** — immutable event/provenance stream including source channel;
3. **workflow_tasks** — human/system work queue;
4. **workflow_approvals** — consequential approval checkpoints.

Operational business records use **enterprise_records** and link to GraceFlow through `entity_type = enterprise_record`.

## Workflow pillars

1. **Intake & capture** — every actionable request gets an origin, entity and traceable event.
2. **Orchestration** — state machines coordinate the next valid step.
3. **Work management** — tasks, owners, due dates, priorities and queues.
4. **Approval & control** — human confirmation for consequential actions and segregation of duties.
5. **Collaboration** — discussions and comments stay linked to the work they concern.
6. **Documents & evidence** — records, signatures and controlled documents stay attached to workflow context.
7. **Automation & integration** — deterministic services execute approved actions; Grace/AI may recommend but does not silently execute consequential decisions.
8. **SLA & escalation** — due dates and future escalation rules make overdue work visible.
9. **Audit & provenance** — source channel, actor, state changes and decisions are retained.
10. **Analytics & continuous improvement** — dashboards can measure cycle time, backlog, bottlenecks and completion.

## Integrated modules

GraceFlow now exposes operational workspaces for:
- Purchase
- Inventory
- HR
- Helpdesk
- Timesheets
- Projects
- CRM
- Sign
- Accounting
- Discuss
- Documents
- Field Service
- Email Marketing

Care workflows (Admissions → Client Record → Care Plan → Sessions → Discharge → Aftercare) remain first-class GraceFlow workflows and are not collapsed into generic ERP records.

## Frontend persistence

Website admissions/contact submissions create an admission, GraceFlow instance, event and screening task. Client Grace check-ins append a portal-origin event to the active client workflow when one exists. The same pattern should be used for future appointment requests, family requests, complaints, document submissions and Grace human handoffs.

## Security boundary

Client and family identities cannot open the staff GraceFlow workspace. New departmental roles are staff-only. Row Level Security protects GraceFlow tables and the server routes perform a second role check. Clinical, safeguarding, HR and financial decisions remain human-authorised.

## Database migration

Apply migrations in order:
1. `001_operational_platform.sql`
2. `002_grace_intelligence_platform.sql`
3. `003_live_care_operations.sql`
4. `004_graceflow_enterprise_engine.sql`

Migration 004 adds workflow definitions, event history, approvals, enterprise records, departmental staff roles and module configuration.
