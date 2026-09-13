# GraceFlow Workflow Designer & Automation Engine

GraceFlow is the staff-only workflow and automation layer for The Loving Hand of Grace. It coordinates clinical-adjacent operations and enterprise functions without replacing authorised human judgement.

## Permanent operating model

**Capture → Trigger → Route → Approve → Execute → Measure → Escalate → Audit**

All work, including website and portal-originated work, should enter GraceFlow as events, workflow instances, tasks, approvals, notifications, and auditable engine executions.

## Frontend surfaces

- `/staff/graceflow` — unified workflow command centre
- `/staff/graceflow/designer` — workflow library and versioned visual designer
- `/staff/graceflow/designer/[id]` — node canvas and workflow inspector
- `/staff/graceflow/automation` — triggers, schedules, approval matrices, SLA and escalation policies
- `/staff/notifications` — staff notification centre
- `/staff/graceflow/analytics` — executive process analytics

Workflow Designer and automation policy configuration are restricted to `administrator`, `manager`, and `super_admin`. Operational staff may use GraceFlow and receive work/notifications according to role.

## Executable node types

- **Start** — entry anchor
- **Task** — creates a persisted staff task and pauses execution
- **Condition** — deterministic conditional routing using input fields
- **Approval** — creates approval records; approval matrices may override role/count
- **Notification** — writes a role/staff notification
- **Delay / Timer** — pauses until `next_wake_at`; engine tick resumes the workflow
- **Create module record** — creates a persisted record in another GraceFlow enterprise module
- **Route marker** — records deterministic routing context
- **End** — completes the engine run and workflow instance

The runtime intentionally uses deterministic services for actions. The LLM is not the executor.

## Versioning & publication

Workflow definitions are stable identities. Every designer save creates a new `workflow_definition_versions` row. Draft versions do not affect live automation. Publishing retires the previous published version and activates the selected version.

Running workflow instances retain their `definition_version_id`, so historical work remains tied to the exact automation graph that initiated it.

## Automation triggers

Supported trigger model:

- event
- record created
- record updated
- manual
- schedule

`POST /api/graceflow/events` evaluates enabled event triggers and starts matching published workflows.

## Scheduling

Schedules are stored in `workflow_schedules` using `Africa/Nairobi` as the default timezone. A production scheduler should call:

`POST /api/graceflow/engine/tick`

with header:

`x-graceflow-secret: <GRACEFLOW_ENGINE_SECRET>`

Recommended cadence: once per minute for precise SLA/timer behaviour, or every five minutes for lower-cost deployments.

The tick service:

1. starts due scheduled workflows;
2. resumes timer-paused workflows;
3. checks overdue tasks;
4. writes escalation notifications.

## Approval matrices

`workflow_approval_matrix_rules` allows approval logic to vary by:

- workflow
- action key
- module
- amount range
- conditions
- approver role or named staff member
- minimum number of approvals

This supports examples such as:

- Purchase under KES 25,000 → department manager
- Purchase KES 25,000–100,000 → procurement + finance
- High-value purchase → manager + finance + administrator
- Clinical discharge → authorised clinical/administrative role only

Consequential clinical, safeguarding, HR and finance decisions remain human-controlled.

## SLA and escalation

`workflow_sla_policies` sets target minutes for workflow tasks. Task creation can inherit the active workflow SLA. `workflow_escalation_rules` determines escalation actions when warning/breach thresholds are reached.

The first implemented production action is persistent GraceFlow notification. The schema supports extension to reassigning work, creating escalation tasks, raising priority, email/SMS, or other approved connectors.

## Cross-module workflow

The `create_record` node can create operational records across:

Purchase, Inventory, HR, Helpdesk, Timesheets, Projects, CRM, Sign, Accounting, Discuss, Documents, Field Service, and Email Marketing.

Example:

**Website supplier enquiry → CRM lead → qualification task → procurement vendor review → approval → vendor record → Discuss notification**

Another example:

**Helpdesk incident → triage → condition: facility issue? → Field Service work order → completion evidence → Accounting expense request → manager approval → close**

## Notification centre

`workflow_notifications` supports:

- staff-targeted notifications
- role-targeted notifications
- workflow-linked context
- module labels
- info / success / warning / critical severity
- actionable navigation URL
- read state

RLS restricts notifications to the addressed staff/role and management roles.

## Executive process analytics

`workflow_process_analytics` aggregates process-level KPIs:

- total instances
- active instances
- completed instances
- average cycle hours
- blocked tasks
- overdue tasks

The executive screen also presents automation-run count, completion ratio, and failed engine runs. This is operational process intelligence, not clinical-outcome scoring.

## Resume contract

Blocking actions pause an instance with `engine_status = waiting`. The engine resumes timers automatically. Human-completed tasks and approvals can resume the workflow through:

`POST /api/graceflow/engine/resume`

with `{ "instanceId": "...", "payload": {...} }`.

Future operational screens should call this endpoint after the required persisted task/approval has genuinely been completed. Do not resume workflows based solely on a frontend button without first writing the authoritative completion record.

## Database migration

Apply migrations in order:

1. `001_operational_platform.sql`
2. `002_grace_intelligence_platform.sql`
3. `003_live_care_operations.sql`
4. `004_graceflow_enterprise_engine.sql`
5. `005_graceflow_automation_engine.sql`

## Production hardening still recommended

Before high-volume production use:

- connect task/approval completion screens directly to engine resume;
- add idempotency keys to external event ingestion;
- add dead-letter/retry policy for failed actions;
- define business calendars/holidays for business-hours SLAs;
- add connector allowlists for email/SMS/third-party webhooks;
- run scheduler with a managed cron/queue service;
- add test/publish promotion environments;
- implement workflow simulation/dry-run before publication;
- require change approval for high-risk clinical or finance workflow definitions;
- monitor engine errors and repeated escalation loops.

## Safety rule

GraceFlow may **coordinate, route, notify, schedule, validate prerequisites and request approval**. It must not silently make consequential clinical, safeguarding, HR disciplinary or material financial decisions. Those remain with authorised people.
