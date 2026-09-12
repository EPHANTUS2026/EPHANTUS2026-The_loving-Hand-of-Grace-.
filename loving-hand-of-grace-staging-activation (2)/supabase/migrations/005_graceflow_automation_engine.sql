-- GraceFlow Automation Engine
-- Versioned workflow designer, executable rules, schedules, SLA/escalation, notifications and analytics.

alter table public.workflow_instances
  add column if not exists definition_version_id uuid,
  add column if not exists next_wake_at timestamptz,
  add column if not exists engine_status text not null default 'running',
  add column if not exists engine_cursor text;

create table if not exists public.workflow_definition_versions (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
 version integer not null,
 status text not null default 'draft' check (status in ('draft','published','retired')),
 graph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
 input_schema jsonb not null default '{}'::jsonb,
 change_note text,
 created_by uuid references public.staff(id),
 published_by uuid references public.staff(id),
 created_at timestamptz not null default now(),
 published_at timestamptz,
 unique(workflow_definition_id,version)
);

create table if not exists public.workflow_triggers (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
 trigger_type text not null check (trigger_type in ('event','record_created','record_updated','manual','schedule')),
 source_module text,
 event_name text,
 conditions jsonb not null default '[]'::jsonb,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_schedules (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
 name text not null,
 cadence text not null check (cadence in ('hourly','daily','weekly','monthly','once')),
 timezone text not null default 'Africa/Nairobi',
 hour_of_day integer check (hour_of_day between 0 and 23),
 minute_of_hour integer not null default 0 check (minute_of_hour between 0 and 59),
 day_of_week integer check (day_of_week between 0 and 6),
 day_of_month integer check (day_of_month between 1 and 31),
 run_once_at timestamptz,
 next_run_at timestamptz,
 last_run_at timestamptz,
 enabled boolean not null default true,
 payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_approval_matrix_rules (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid references public.workflow_definitions(id) on delete cascade,
 module text,
 action_key text not null,
 priority integer not null default 100,
 conditions jsonb not null default '[]'::jsonb,
 approver_role public.user_role,
 approver_staff_id uuid references public.staff(id),
 min_approvals integer not null default 1 check (min_approvals > 0),
 amount_min numeric(14,2),
 amount_max numeric(14,2),
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_sla_policies (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid references public.workflow_definitions(id) on delete cascade,
 module text,
 task_type text,
 name text not null,
 start_event text not null default 'task_created',
 target_minutes integer not null check (target_minutes > 0),
 warning_minutes integer check (warning_minutes >= 0),
 business_hours_only boolean not null default false,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_escalation_rules (
 id uuid primary key default gen_random_uuid(),
 workflow_definition_id uuid references public.workflow_definitions(id) on delete cascade,
 sla_policy_id uuid references public.workflow_sla_policies(id) on delete cascade,
 name text not null,
 threshold text not null check (threshold in ('warning','breach','overdue')),
 after_minutes integer not null default 0,
 action_type text not null check (action_type in ('notify_role','notify_staff','reassign_role','create_task','raise_priority')),
 target_role public.user_role,
 target_staff_id uuid references public.staff(id),
 payload jsonb not null default '{}'::jsonb,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_notifications (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid references public.profiles(id) on delete cascade,
 staff_id uuid references public.staff(id) on delete cascade,
 role public.user_role,
 workflow_instance_id uuid references public.workflow_instances(id) on delete cascade,
 module text,
 severity text not null default 'info' check (severity in ('info','success','warning','critical')),
 title text not null,
 body text,
 action_url text,
 read_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.workflow_engine_runs (
 id uuid primary key default gen_random_uuid(),
 workflow_instance_id uuid references public.workflow_instances(id) on delete cascade,
 definition_version_id uuid references public.workflow_definition_versions(id),
 trigger_type text,
 trigger_payload jsonb not null default '{}'::jsonb,
 status text not null default 'running' check (status in ('running','waiting','completed','failed','cancelled')),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 error text,
 metrics jsonb not null default '{}'::jsonb
);

create table if not exists public.workflow_node_executions (
 id uuid primary key default gen_random_uuid(),
 engine_run_id uuid not null references public.workflow_engine_runs(id) on delete cascade,
 workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
 node_id text not null,
 node_type text not null,
 status text not null check (status in ('started','completed','waiting','skipped','failed')),
 input jsonb not null default '{}'::jsonb,
 output jsonb not null default '{}'::jsonb,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 error text
);

create index if not exists workflow_versions_def_idx on public.workflow_definition_versions(workflow_definition_id,status,version desc);
create index if not exists workflow_triggers_event_idx on public.workflow_triggers(trigger_type,event_name,enabled);
create index if not exists workflow_schedules_due_idx on public.workflow_schedules(enabled,next_run_at);
create index if not exists workflow_notifications_staff_idx on public.workflow_notifications(staff_id,read_at,created_at desc);
create index if not exists workflow_notifications_role_idx on public.workflow_notifications(role,read_at,created_at desc);
create index if not exists workflow_engine_runs_instance_idx on public.workflow_engine_runs(workflow_instance_id,started_at desc);
create index if not exists workflow_node_exec_run_idx on public.workflow_node_executions(engine_run_id,started_at);
create index if not exists workflow_instances_wake_idx on public.workflow_instances(engine_status,next_wake_at) where next_wake_at is not null;

alter table public.workflow_definition_versions enable row level security;
alter table public.workflow_triggers enable row level security;
alter table public.workflow_schedules enable row level security;
alter table public.workflow_approval_matrix_rules enable row level security;
alter table public.workflow_sla_policies enable row level security;
alter table public.workflow_escalation_rules enable row level security;
alter table public.workflow_notifications enable row level security;
alter table public.workflow_engine_runs enable row level security;
alter table public.workflow_node_executions enable row level security;

create or replace function public.current_staff_id()
returns uuid language sql stable security definer set search_path=public as $$
 select staff_id from public.profiles where auth_user_id = auth.uid() and is_active = true limit 1;
$$;

create policy "workflow versions staff read" on public.workflow_definition_versions for select using (public.is_staff_user());
create policy "workflow versions admin write" on public.workflow_definition_versions for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow triggers staff read" on public.workflow_triggers for select using (public.is_staff_user());
create policy "workflow triggers admin write" on public.workflow_triggers for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow schedules staff read" on public.workflow_schedules for select using (public.is_staff_user());
create policy "workflow schedules admin write" on public.workflow_schedules for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow approval matrix staff read" on public.workflow_approval_matrix_rules for select using (public.is_staff_user());
create policy "workflow approval matrix admin write" on public.workflow_approval_matrix_rules for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow sla staff read" on public.workflow_sla_policies for select using (public.is_staff_user());
create policy "workflow sla admin write" on public.workflow_sla_policies for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow escalation staff read" on public.workflow_escalation_rules for select using (public.is_staff_user());
create policy "workflow escalation admin write" on public.workflow_escalation_rules for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "workflow notifications staff read" on public.workflow_notifications for select using (
 public.is_staff_user() and (
   staff_id = public.current_staff_id()
   or role = public.current_role()
   or public.current_role()::text in ('administrator','manager','super_admin')
 )
);
create policy "workflow notifications staff update" on public.workflow_notifications for update using (
 public.is_staff_user() and (staff_id = public.current_staff_id() or role = public.current_role() or public.current_role()::text in ('administrator','manager','super_admin'))
) with check (public.is_staff_user());
create policy "workflow engine runs staff read" on public.workflow_engine_runs for select using (public.is_staff_user());
create policy "workflow node executions staff read" on public.workflow_node_executions for select using (public.is_staff_user());

-- Basic process analytics view, safe for staff operational use.
create or replace view public.workflow_process_analytics as
with instance_base as (
 select wi.id,wi.workflow_key,coalesce(wd.module,'care') as module,wi.status,wi.created_at,wi.updated_at
 from public.workflow_instances wi
 left join public.workflow_definitions wd on wd.workflow_key=wi.workflow_key
), task_rollup as (
 select wi.workflow_key,coalesce(wd.module,'care') as module,
        count(*) filter (where wt.status='blocked') as blocked_tasks,
        count(*) filter (where wt.due_at is not null and wt.due_at < now() and wt.status not in ('completed','cancelled')) as overdue_tasks
 from public.workflow_instances wi
 left join public.workflow_definitions wd on wd.workflow_key=wi.workflow_key
 left join public.workflow_tasks wt on wt.workflow_instance_id=wi.id
 group by wi.workflow_key,coalesce(wd.module,'care')
)
select i.workflow_key,i.module,
 count(*) as total_instances,
 count(*) filter (where i.status='active') as active_instances,
 count(*) filter (where i.status='completed') as completed_instances,
 round(avg(extract(epoch from (coalesce(i.updated_at,now())-i.created_at))/3600.0)::numeric,2) as avg_cycle_hours,
 coalesce(max(t.blocked_tasks),0) as blocked_tasks,
 coalesce(max(t.overdue_tasks),0) as overdue_tasks
from instance_base i
left join task_rollup t on t.workflow_key=i.workflow_key and t.module=i.module
group by i.workflow_key,i.module;

-- Promote existing seeded definitions into first published visual versions if absent.
insert into public.workflow_definition_versions(workflow_definition_id,version,status,graph,change_note,published_at)
select d.id,1,'published',
 jsonb_build_object(
   'nodes', jsonb_build_array(
     jsonb_build_object('id','start','type','start','title','Start'),
     jsonb_build_object('id','work','type','task','title','Process work','config',jsonb_build_object('assignedRole','administrator')),
     jsonb_build_object('id','end','type','end','title','Complete')
   ),
   'edges', jsonb_build_array(
     jsonb_build_object('id','e1','from','start','to','work'),
     jsonb_build_object('id','e2','from','work','to','end')
   )
 ),'Initial published automation graph',now()
from public.workflow_definitions d
where not exists(select 1 from public.workflow_definition_versions v where v.workflow_definition_id=d.id);
