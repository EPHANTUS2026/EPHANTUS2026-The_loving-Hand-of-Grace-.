-- Production hardening for Recovery OS + GraceFlow Studio 2.0
-- Apply after 006_recovery_os_and_graceflow_studio2.sql

create extension if not exists pgcrypto;

create table if not exists public.integration_health_checks (
  id uuid primary key default gen_random_uuid(),
  connector_key text not null,
  status text not null check (status in ('healthy','degraded','unconfigured','failed')),
  latency_ms integer,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);
create index if not exists integration_health_checks_key_time_idx on public.integration_health_checks(connector_key, checked_at desc);

create table if not exists public.graceflow_scheduler_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','completed','failed','skipped')),
  trigger_source text not null default 'scheduler',
  result jsonb not null default '{}'::jsonb,
  error text,
  request_id text
);
create index if not exists graceflow_scheduler_runs_time_idx on public.graceflow_scheduler_runs(started_at desc);

create table if not exists public.graceflow_engine_leases (
  lease_key text primary key,
  holder text not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.knowledge_publish_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles(id) on delete cascade,
  action text not null check (action in ('SUBMITTED','APPROVED','REJECTED','PUBLISHED','EXPIRED','ARCHIVED','RESTORED')),
  actor_id uuid,
  note text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists knowledge_publish_events_article_idx on public.knowledge_publish_events(article_id, created_at desc);

alter table public.knowledge_articles add column if not exists approved_by uuid;
alter table public.knowledge_articles add column if not exists approved_at timestamptz;
alter table public.knowledge_articles add column if not exists published_at timestamptz;
alter table public.knowledge_articles add column if not exists review_owner_id uuid;
alter table public.knowledge_articles add column if not exists grace_visibility text not null default 'blocked';
alter table public.knowledge_articles add column if not exists clinical_sensitivity text not null default 'general';

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.workflow_notifications(id) on delete set null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  recipient text not null,
  template_key text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','sending','delivered','failed','dead_letter')),
  attempt integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notification_outbox_due_idx on public.notification_outbox(status,next_attempt_at);

alter table public.integration_health_checks enable row level security;
alter table public.graceflow_scheduler_runs enable row level security;
alter table public.graceflow_engine_leases enable row level security;
alter table public.knowledge_publish_events enable row level security;
alter table public.notification_outbox enable row level security;

create policy "integration health managers" on public.integration_health_checks for select using (public.current_role()::text in ('administrator','manager','super_admin','director'));
create policy "scheduler runs managers" on public.graceflow_scheduler_runs for select using (public.current_role()::text in ('administrator','manager','super_admin','director'));
create policy "knowledge publish staff read" on public.knowledge_publish_events for select using (public.is_staff_user());
create policy "knowledge publish managers write" on public.knowledge_publish_events for all using (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director')) with check (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director'));
create policy "notification outbox managers" on public.notification_outbox for select using (public.current_role()::text in ('administrator','manager','super_admin','director'));

-- Grace may only use approved, visible and in-review-date articles.
create or replace view public.grace_approved_knowledge as
select a.*
from public.knowledge_articles a
where a.approval_status='APPROVED'
  and a.archived=false
  and a.grace_visibility='approved'
  and (a.next_review_at is null or a.next_review_at > now());
