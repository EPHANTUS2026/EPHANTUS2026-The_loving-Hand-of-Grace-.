-- GraceFlow Enterprise Engine
-- Adds the staff-only enterprise workflow layer and shared workflow event spine.

-- Extend staff roles for departmental ownership while keeping client/family roles separate.
alter type public.user_role add value if not exists 'hr';
alter type public.user_role add value if not exists 'procurement';
alter type public.user_role add value if not exists 'inventory';
alter type public.user_role add value if not exists 'project_manager';
alter type public.user_role add value if not exists 'helpdesk';
alter type public.user_role add value if not exists 'marketing';
alter type public.user_role add value if not exists 'accountant';
alter type public.user_role add value if not exists 'field_service';

create table if not exists public.workflow_definitions (
 id uuid primary key default gen_random_uuid(),
 workflow_key text not null unique,
 module text not null,
 name text not null,
 description text,
 version integer not null default 1,
 status text not null default 'active' check (status in ('draft','active','retired')),
 start_state text not null default 'created',
 state_machine jsonb not null default '{}'::jsonb,
 approval_rules jsonb not null default '{}'::jsonb,
 sla_rules jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.workflow_events (
 id uuid primary key default gen_random_uuid(),
 workflow_instance_id uuid references public.workflow_instances(id) on delete cascade,
 event_type text not null,
 source_channel text not null default 'staff_portal',
 actor_type text not null default 'system',
 actor_id uuid,
 summary text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_approvals (
 id uuid primary key default gen_random_uuid(),
 workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
 approval_type text not null,
 requested_by uuid references public.staff(id),
 assigned_staff_id uuid references public.staff(id),
 assigned_role public.user_role,
 status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
 decision_note text,
 requested_at timestamptz not null default now(),
 resolved_at timestamptz
);

create table if not exists public.enterprise_records (
 id uuid primary key default gen_random_uuid(),
 module text not null check (module in ('purchase','inventory','hr','helpdesk','timesheets','project','crm','sign','accounting','discuss','documents','field-service','email-marketing')),
 record_type text not null,
 reference text not null unique,
 title text not null,
 status text not null default 'new',
 priority text not null default 'routine' check (priority in ('routine','high','urgent')),
 owner_staff_id uuid references public.staff(id),
 requester_staff_id uuid references public.staff(id),
 amount numeric(14,2),
 currency text not null default 'KES',
 due_at timestamptz,
 data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.enterprise_comments (
 id uuid primary key default gen_random_uuid(),
 record_id uuid not null references public.enterprise_records(id) on delete cascade,
 author_staff_id uuid references public.staff(id),
 body text not null,
 visibility text not null default 'staff',
 created_at timestamptz not null default now()
);

create index if not exists workflow_events_instance_idx on public.workflow_events(workflow_instance_id,created_at desc);
create index if not exists workflow_events_source_idx on public.workflow_events(source_channel,created_at desc);
create index if not exists workflow_approvals_status_idx on public.workflow_approvals(status,requested_at desc);
create index if not exists enterprise_records_module_idx on public.enterprise_records(module,status,updated_at desc);
create index if not exists enterprise_records_owner_idx on public.enterprise_records(owner_staff_id,status);

alter table public.workflow_definitions enable row level security;
alter table public.workflow_events enable row level security;
alter table public.workflow_approvals enable row level security;
alter table public.enterprise_records enable row level security;
alter table public.enterprise_comments enable row level security;

-- Staff-only helper. Client and family identities are deliberately excluded.
create or replace function public.is_staff_user()
returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((public.current_role()::text in (
  'counsellor','clinician','admissions','finance','administrator','manager','super_admin',
  'hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service'
 )),false);
$$;

create policy "workflow definitions staff read" on public.workflow_definitions for select using (public.is_staff_user());
create policy "workflow definitions admin write" on public.workflow_definitions for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));

create policy "workflow events staff read" on public.workflow_events for select using (public.is_staff_user());
create policy "workflow events staff insert" on public.workflow_events for insert with check (public.is_staff_user());

create policy "workflow approvals staff read" on public.workflow_approvals for select using (public.is_staff_user());
create policy "workflow approvals authorised write" on public.workflow_approvals for all using (public.is_staff_user()) with check (public.is_staff_user());

create policy "enterprise records staff read" on public.enterprise_records for select using (public.is_staff_user());
create policy "enterprise records staff insert" on public.enterprise_records for insert with check (public.is_staff_user());
create policy "enterprise records staff update" on public.enterprise_records for update using (public.is_staff_user()) with check (public.is_staff_user());
create policy "enterprise comments staff" on public.enterprise_comments for all using (public.is_staff_user()) with check (public.is_staff_user());

-- Existing workflow spine must also allow the new staff roles.
drop policy if exists "workflow staff" on public.workflow_instances;
create policy "workflow staff" on public.workflow_instances for select using (public.is_staff_user());
drop policy if exists "tasks staff" on public.workflow_tasks;
create policy "tasks staff" on public.workflow_tasks for select using (public.is_staff_user());

-- Seed definitions only. These are configuration, not synthetic operational records.
insert into public.workflow_definitions(workflow_key,module,name,description,state_machine,approval_rules,sla_rules)
values
('purchase_request','purchase','Purchase Request','Request, review, approval, ordering and receipt workflow','{"states":["created","review","approval","ordered","received","closed"]}','{"approval_required":true}','{"review_hours":24}'),
('inventory_movement','inventory','Inventory Movement','Receipt, issue, transfer and stock adjustment control','{"states":["created","validation","posted","closed"]}','{"high_value_approval":true}','{"validation_hours":8}'),
('hr_people_operation','hr','HR People Operation','Leave, recruitment, onboarding and people-service workflow','{"states":["created","review","approval","execution","closed"]}','{"sensitive":true}','{"review_hours":24}'),
('helpdesk_ticket','helpdesk','Helpdesk Ticket','Triage, assignment, SLA, resolution and closure','{"states":["new","triage","assigned","in_progress","resolved","closed"]}','{}','{"first_response_hours":4}'),
('timesheet_approval','timesheets','Timesheet Approval','Submission, manager review and approval','{"states":["draft","submitted","review","approved","posted"]}','{"approval_required":true}','{"review_hours":48}'),
('project_delivery','project','Project Delivery','Project, milestone, task and dependency orchestration','{"states":["planned","active","blocked","review","completed","closed"]}','{}','{}'),
('crm_pipeline','crm','CRM Pipeline','Lead capture, qualification, opportunity, follow-up and close','{"states":["new","qualified","engaged","proposal","won","lost"]}','{}','{"follow_up_hours":24}'),
('signature_request','sign','Signature Request','Prepare, approve, send, sign and archive','{"states":["draft","review","sent","signed","archived"]}','{"approval_before_send":true}','{}'),
('accounting_operation','accounting','Accounting Operation','Bill, expense, journal and payment-control workflow','{"states":["created","verification","approval","posted","reconciled"]}','{"segregation_of_duties":true}','{}'),
('discussion_thread','discuss','Operational Discussion','Workflow-linked collaboration and decision capture','{"states":["open","active","decision_recorded","closed"]}','{}','{}'),
('document_control','documents','Document Control','Draft, review, approval, publish, supersede and archive','{"states":["draft","review","approved","published","superseded","archived"]}','{"approval_required":true}','{"review_due_days":365}'),
('field_service_work_order','field-service','Field Service Work Order','Dispatch, visit, work completion, verification and close','{"states":["new","scheduled","dispatched","on_site","completed","verified","closed"]}','{}','{"dispatch_hours":8}'),
('email_campaign','email-marketing','Email Campaign','Draft, audience, approval, schedule, send and report','{"states":["draft","review","approved","scheduled","sent","reported"]}','{"approval_before_send":true}','{}')
on conflict (workflow_key) do nothing;
