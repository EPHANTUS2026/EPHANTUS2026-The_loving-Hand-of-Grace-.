-- Recovery OS + GraceFlow Studio 2.0
-- Apply after 005_graceflow_automation_engine.sql

create extension if not exists pgcrypto;

-- Recovery journey and person-centred continuity
create table if not exists public.recovery_stage_catalog (
  stage_key text primary key,
  sequence_no integer not null,
  label text not null,
  description text,
  active boolean not null default true,
  allowed_next text[] not null default '{}',
  required_permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

insert into public.recovery_stage_catalog(stage_key,sequence_no,label,description,allowed_next) values
('ENQUIRY',1,'Enquiry','Confidential first contact',array['SCREENING']),
('SCREENING',2,'Screening','Initial non-diagnostic screening',array['ASSESSMENT']),
('ASSESSMENT',3,'Assessment','Professional assessment and care planning inputs',array['ADMISSION']),
('ADMISSION',4,'Admission','Admission and onboarding',array['ORIENTATION']),
('ORIENTATION',5,'Orientation','Orientation to care, rights, routines and support',array['STABILISATION']),
('STABILISATION',6,'Stabilisation','Early stabilisation and structured support',array['ACTIVE_TREATMENT']),
('ACTIVE_TREATMENT',7,'Active Treatment','Therapeutic and recovery programme activity',array['SKILLS_DEVELOPMENT']),
('SKILLS_DEVELOPMENT',8,'Skills Development','Independence, vocational and life-skills development',array['FAMILY_SOCIAL_REINTEGRATION']),
('FAMILY_SOCIAL_REINTEGRATION',9,'Family / Social Reintegration','Family participation and reintegration preparation',array['DISCHARGE_PREPARATION']),
('DISCHARGE_PREPARATION',10,'Discharge Preparation','Readiness review and continuity planning',array['DISCHARGED']),
('DISCHARGED',11,'Discharged','Formal discharge complete',array['AFTERCARE']),
('AFTERCARE',12,'Aftercare','Structured follow-up and continuity support',array['LONG_TERM_RECOVERY_SUPPORT']),
('LONG_TERM_RECOVERY_SUPPORT',13,'Long-Term Recovery Support','Ongoing recovery continuity and alumni support',array[]::text[])
on conflict(stage_key) do update set sequence_no=excluded.sequence_no,label=excluded.label,description=excluded.description,allowed_next=excluded.allowed_next;

create table if not exists public.recovery_journeys (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 current_stage text not null references public.recovery_stage_catalog(stage_key),
 stage_started_at timestamptz not null default now(),
 assigned_team jsonb not null default '[]'::jsonb,
 progress_indicators jsonb not null default '{}'::jsonb,
 risks jsonb not null default '[]'::jsonb,
 next_actions jsonb not null default '[]'::jsonb,
 consent_state jsonb not null default '{}'::jsonb,
 aftercare_status text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(client_id)
);

create table if not exists public.recovery_journey_events (
 id uuid primary key default gen_random_uuid(),
 journey_id uuid not null references public.recovery_journeys(id) on delete cascade,
 from_stage text,
 to_stage text not null,
 actor_id uuid,
 reason text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.recovery_milestones (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 journey_id uuid references public.recovery_journeys(id) on delete cascade, milestone_key text not null, title text not null,
 category text not null default 'recovery', status text not null default 'planned', approved_for_client boolean not null default false,
 completed_at timestamptz, approved_by uuid, evidence_document_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

-- Skills & independence
create table if not exists public.skill_programs (
 id uuid primary key default gen_random_uuid(), code text unique not null, title text not null, category text not null,
 description text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.skill_modules (
 id uuid primary key default gen_random_uuid(), program_id uuid not null references public.skill_programs(id) on delete cascade,
 title text not null, sequence_no integer not null default 1, objectives jsonb not null default '[]'::jsonb, active boolean not null default true
);
create table if not exists public.client_skill_plans (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 program_id uuid not null references public.skill_programs(id), status text not null default 'planned', assigned_by uuid,
 goals jsonb not null default '[]'::jsonb, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.skill_sessions (
 id uuid primary key default gen_random_uuid(), client_skill_plan_id uuid not null references public.client_skill_plans(id) on delete cascade,
 module_id uuid references public.skill_modules(id), scheduled_at timestamptz, completed_at timestamptz, facilitator_id uuid,
 status text not null default 'scheduled', client_visible_summary text, created_at timestamptz not null default now()
);
create table if not exists public.skill_assessments (
 id uuid primary key default gen_random_uuid(), client_skill_plan_id uuid not null references public.client_skill_plans(id) on delete cascade,
 dimension text not null, level text, evidence text, assessed_by uuid, assessed_at timestamptz not null default now()
);

-- Reintegration
create table if not exists public.reintegration_plans (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 status text not null default 'draft', family_readiness jsonb not null default '{}'::jsonb, housing_readiness jsonb not null default '{}'::jsonb,
 employment_readiness jsonb not null default '{}'::jsonb, education_readiness jsonb not null default '{}'::jsonb,
 financial_readiness jsonb not null default '{}'::jsonb, community_support jsonb not null default '{}'::jsonb,
 risk_mitigation jsonb not null default '[]'::jsonb, external_referrals jsonb not null default '[]'::jsonb,
 followup_requirements jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reintegration_goals (
 id uuid primary key default gen_random_uuid(), reintegration_plan_id uuid not null references public.reintegration_plans(id) on delete cascade,
 domain text not null, title text not null, status text not null default 'planned', due_at timestamptz, owner_role text, notes text, created_at timestamptz not null default now()
);

-- Consent / family access governance
create table if not exists public.consent_types (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, description text, active boolean not null default true
);
create table if not exists public.consent_records (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 consent_type_id uuid not null references public.consent_types(id), purpose text not null, scope jsonb not null default '{}'::jsonb,
 recipient_type text, recipient_id uuid, status text not null default 'granted', granted_at timestamptz, effective_at timestamptz not null default now(),
 expires_at timestamptz, revoked_at timestamptz, granted_by uuid, recorded_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.consent_history (
 id uuid primary key default gen_random_uuid(), consent_record_id uuid not null references public.consent_records(id) on delete cascade,
 action text not null, actor_id uuid, snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.family_access_log (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 family_member_id uuid, actor_profile_id uuid, resource_type text not null, resource_id uuid, action text not null,
 consent_record_id uuid references public.consent_records(id), created_at timestamptz not null default now()
);

-- Governed knowledge centre
create table if not exists public.knowledge_categories (
 id uuid primary key default gen_random_uuid(), name text unique not null, description text, created_at timestamptz not null default now()
);
create table if not exists public.knowledge_articles (
 id uuid primary key default gen_random_uuid(), title text not null, summary text, body text not null,
 category_id uuid references public.knowledge_categories(id), audience text[] not null default '{}', author_id uuid,
 approval_status text not null default 'DRAFT', version integer not null default 1, last_reviewed_at timestamptz,
 next_review_at timestamptz, archived boolean not null default false, source_references jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.knowledge_revisions (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references public.knowledge_articles(id) on delete cascade,
 version integer not null, body text not null, changed_by uuid, change_note text, created_at timestamptz not null default now()
);
create table if not exists public.knowledge_approvals (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references public.knowledge_articles(id) on delete cascade,
 reviewer_id uuid, status text not null default 'PENDING', note text, decided_at timestamptz, created_at timestamptz not null default now()
);

-- Notification service
create table if not exists public.notification_preferences (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
 channel text not null, event_key text not null, enabled boolean not null default true, quiet_hours jsonb not null default '{}'::jsonb,
 unique(profile_id,channel,event_key)
);
create table if not exists public.notification_templates (
 id uuid primary key default gen_random_uuid(), template_key text unique not null, channel text not null, subject text, body text not null,
 contains_sensitive_content boolean not null default false, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.notification_deliveries (
 id uuid primary key default gen_random_uuid(), notification_id uuid references public.workflow_notifications(id) on delete cascade,
 channel text not null, recipient text, provider text, status text not null default 'queued', provider_message_id text,
 attempt_count integer not null default 0, last_error text, sent_at timestamptz, created_at timestamptz not null default now()
);

-- Studio 2.0: visual positions, dry-runs, replay, subflows, forms, business calendars, retries/DLQ, connectors
alter table public.workflow_definition_versions add column if not exists canvas jsonb not null default '{"zoom":1,"pan":{"x":0,"y":0}}'::jsonb;

create table if not exists public.workflow_simulations (
 id uuid primary key default gen_random_uuid(), workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
 definition_version_id uuid references public.workflow_definition_versions(id), test_payload jsonb not null default '{}'::jsonb,
 status text not null default 'queued', trace jsonb not null default '[]'::jsonb, output jsonb not null default '{}'::jsonb,
 started_by uuid, started_at timestamptz, finished_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.workflow_replays (
 id uuid primary key default gen_random_uuid(), source_engine_run_id uuid references public.workflow_engine_runs(id),
 workflow_instance_id uuid references public.workflow_instances(id) on delete cascade, mode text not null default 'dry_run',
 payload_override jsonb not null default '{}'::jsonb, status text not null default 'queued', trace jsonb not null default '[]'::jsonb,
 created_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.workflow_subflows (
 id uuid primary key default gen_random_uuid(), parent_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
 child_definition_id uuid not null references public.workflow_definitions(id) on delete restrict, alias text not null,
 input_mapping jsonb not null default '{}'::jsonb, output_mapping jsonb not null default '{}'::jsonb, enabled boolean not null default true,
 unique(parent_definition_id,alias)
);
create table if not exists public.workflow_forms (
 id uuid primary key default gen_random_uuid(), workflow_definition_id uuid references public.workflow_definitions(id) on delete cascade,
 form_key text unique not null, name text not null, description text, schema jsonb not null default '{"fields":[]}'::jsonb,
 audience text[] not null default '{}', status text not null default 'draft', version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workflow_form_submissions (
 id uuid primary key default gen_random_uuid(), workflow_form_id uuid not null references public.workflow_forms(id) on delete cascade,
 workflow_instance_id uuid references public.workflow_instances(id) on delete set null, submitted_by uuid, data jsonb not null default '{}'::jsonb,
 status text not null default 'submitted', created_at timestamptz not null default now()
);
create table if not exists public.business_calendars (
 id uuid primary key default gen_random_uuid(), name text unique not null, timezone text not null default 'Africa/Nairobi',
 working_days integer[] not null default array[1,2,3,4,5], work_start time not null default '08:00', work_end time not null default '17:00',
 holidays jsonb not null default '[]'::jsonb, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.workflow_retry_jobs (
 id uuid primary key default gen_random_uuid(), workflow_instance_id uuid references public.workflow_instances(id) on delete cascade,
 node_id text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'queued', attempt integer not null default 0,
 max_attempts integer not null default 5, next_attempt_at timestamptz not null default now(), last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workflow_dead_letters (
 id uuid primary key default gen_random_uuid(), workflow_instance_id uuid references public.workflow_instances(id) on delete set null,
 node_id text, source_type text not null, source_id uuid, payload jsonb not null default '{}'::jsonb, error text not null,
 resolved boolean not null default false, resolved_by uuid, resolved_at timestamptz, resolution_note text, created_at timestamptz not null default now()
);
create table if not exists public.integration_connectors (
 id uuid primary key default gen_random_uuid(), connector_key text unique not null, provider_type text not null,
 display_name text not null, enabled boolean not null default false, config jsonb not null default '{}'::jsonb,
 secret_reference text, last_health_status text, last_health_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.connector_actions (
 id uuid primary key default gen_random_uuid(), connector_id uuid not null references public.integration_connectors(id) on delete cascade,
 action_key text not null, display_name text not null, input_schema jsonb not null default '{}'::jsonb, sensitive_fields text[] not null default '{}',
 enabled boolean not null default true, unique(connector_id,action_key)
);
create table if not exists public.connector_executions (
 id uuid primary key default gen_random_uuid(), connector_action_id uuid references public.connector_actions(id),
 workflow_instance_id uuid references public.workflow_instances(id) on delete set null, request_payload_redacted jsonb not null default '{}'::jsonb,
 status text not null default 'queued', provider_reference text, attempt integer not null default 0, error text, created_at timestamptz not null default now(), completed_at timestamptz
);

insert into public.business_calendars(name) values ('Loving Hand of Grace Standard') on conflict(name) do nothing;
insert into public.integration_connectors(connector_key,provider_type,display_name,enabled) values
('email','email','Email',false),('sms','sms','SMS',false),('whatsapp','whatsapp','WhatsApp',false)
on conflict(connector_key) do nothing;

-- Studio node analytics view for live process map
create or replace view public.graceflow_live_process_map as
select wi.id as workflow_instance_id, wi.workflow_key, wi.status, wi.current_state, wi.engine_cursor,
       wi.engine_status, wi.next_wake_at, wi.entity_type, wi.entity_id, wi.created_at, wi.updated_at,
       wd.name as workflow_name, wd.module,
       (select count(*) from public.workflow_tasks wt where wt.workflow_instance_id=wi.id and wt.status in ('queued','in_progress','blocked')) as open_tasks,
       (select min(wt.due_at) from public.workflow_tasks wt where wt.workflow_instance_id=wi.id and wt.status in ('queued','in_progress','blocked')) as next_due_at
from public.workflow_instances wi
left join public.workflow_definitions wd on wd.workflow_key=wi.workflow_key
where wi.status not in ('completed','cancelled');

-- RLS
alter table public.recovery_stage_catalog enable row level security;
alter table public.recovery_journeys enable row level security;
alter table public.recovery_journey_events enable row level security;
alter table public.recovery_milestones enable row level security;
alter table public.skill_programs enable row level security;
alter table public.skill_modules enable row level security;
alter table public.client_skill_plans enable row level security;
alter table public.skill_sessions enable row level security;
alter table public.skill_assessments enable row level security;
alter table public.reintegration_plans enable row level security;
alter table public.reintegration_goals enable row level security;
alter table public.consent_types enable row level security;
alter table public.consent_records enable row level security;
alter table public.consent_history enable row level security;
alter table public.family_access_log enable row level security;
alter table public.knowledge_categories enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.knowledge_revisions enable row level security;
alter table public.knowledge_approvals enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.workflow_simulations enable row level security;
alter table public.workflow_replays enable row level security;
alter table public.workflow_subflows enable row level security;
alter table public.workflow_forms enable row level security;
alter table public.workflow_form_submissions enable row level security;
alter table public.business_calendars enable row level security;
alter table public.workflow_retry_jobs enable row level security;
alter table public.workflow_dead_letters enable row level security;
alter table public.integration_connectors enable row level security;
alter table public.connector_actions enable row level security;
alter table public.connector_executions enable row level security;

-- Staff policies use helper created in migration 004
create policy "recovery stages read" on public.recovery_stage_catalog for select using (true);
create policy "recovery journeys staff" on public.recovery_journeys for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "recovery events staff" on public.recovery_journey_events for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "recovery milestones staff" on public.recovery_milestones for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "skills catalogue read" on public.skill_programs for select using (public.is_staff_user() or public.current_role()::text='client');
create policy "skill modules read" on public.skill_modules for select using (public.is_staff_user() or public.current_role()::text='client');
create policy "client skill plans staff" on public.client_skill_plans for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "skill sessions staff" on public.skill_sessions for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "skill assessments staff" on public.skill_assessments for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "reintegration staff" on public.reintegration_plans for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "reintegration goals staff" on public.reintegration_goals for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "consents staff" on public.consent_records for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "consent types staff" on public.consent_types for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "consent history staff" on public.consent_history for select using (public.is_staff_user());
create policy "family access audit staff" on public.family_access_log for select using (public.is_staff_user());
create policy "knowledge categories read" on public.knowledge_categories for select using (true);
create policy "knowledge approved public" on public.knowledge_articles for select using (approval_status='APPROVED' and archived=false and (next_review_at is null or next_review_at>now()));
create policy "knowledge staff write" on public.knowledge_articles for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "knowledge revisions staff" on public.knowledge_revisions for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "knowledge approvals staff" on public.knowledge_approvals for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "notifications pref owner" on public.notification_preferences for all using (profile_id=(select id from public.profiles where auth_user_id=auth.uid())) with check (profile_id=(select id from public.profiles where auth_user_id=auth.uid()));
create policy "notification templates staff" on public.notification_templates for select using (public.is_staff_user());
create policy "notification deliveries staff" on public.notification_deliveries for select using (public.is_staff_user());
create policy "studio simulations staff" on public.workflow_simulations for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "studio replays staff" on public.workflow_replays for all using (public.is_staff_user()) with check (public.is_staff_user());
create policy "studio subflows admin" on public.workflow_subflows for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "studio forms staff read" on public.workflow_forms for select using (public.is_staff_user());
create policy "studio forms admin write" on public.workflow_forms for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "form submissions staff" on public.workflow_form_submissions for select using (public.is_staff_user());
create policy "business calendars staff" on public.business_calendars for select using (public.is_staff_user());
create policy "business calendars admin" on public.business_calendars for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "retry jobs staff" on public.workflow_retry_jobs for select using (public.is_staff_user());
create policy "dead letters staff" on public.workflow_dead_letters for select using (public.is_staff_user());
create policy "connectors staff" on public.integration_connectors for select using (public.is_staff_user());
create policy "connectors admin" on public.integration_connectors for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "connector actions staff" on public.connector_actions for select using (public.is_staff_user());
create policy "connector executions staff" on public.connector_executions for select using (public.is_staff_user());

-- Expanded care / organisation roles (text comparisons are used below so newly-added enum values are not consumed in this migration transaction)
alter type public.user_role add value if not exists 'director';
alter type public.user_role add value if not exists 'clinical_director';
alter type public.user_role add value if not exists 'doctor';
alter type public.user_role add value if not exists 'nurse';
alter type public.user_role add value if not exists 'psychologist';
alter type public.user_role add value if not exists 'social_worker';
alter type public.user_role add value if not exists 'case_manager';
alter type public.user_role add value if not exists 'aftercare_coordinator';
alter type public.user_role add value if not exists 'family_liaison';
alter type public.user_role add value if not exists 'staff';

create or replace function public.is_staff_user()
returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((public.current_role()::text in (
  'counsellor','clinician','admissions','finance','administrator','manager','super_admin',
  'hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service',
  'director','clinical_director','doctor','nurse','psychologist','social_worker','case_manager',
  'aftercare_coordinator','family_liaison','staff'
 )),false);
$$;

-- RBAC + ABAC policy data. Application services must evaluate role + attributes, never trust client-provided role claims.
create table if not exists public.permissions (
 id uuid primary key default gen_random_uuid(), permission_key text unique not null, resource_class text not null,
 action text not null, description text, created_at timestamptz not null default now()
);
create table if not exists public.role_permissions (
 role_name text not null, permission_id uuid not null references public.permissions(id) on delete cascade,
 effect text not null default 'allow' check(effect in ('allow','deny')), conditions jsonb not null default '{}'::jsonb,
 primary key(role_name,permission_id)
);
create table if not exists public.access_policy_rules (
 id uuid primary key default gen_random_uuid(), name text not null, resource_class text not null, action text not null,
 priority integer not null default 100, effect text not null check(effect in ('allow','deny')),
 required_attributes jsonb not null default '{}'::jsonb, enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.client_team_assignments (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 staff_id uuid not null references public.staff(id) on delete cascade, team_role text not null, active boolean not null default true,
 assigned_at timestamptz not null default now(), ended_at timestamptz, unique(client_id,staff_id,team_role)
);

-- Immutable operational / AI audit metadata (never hidden model reasoning)
create table if not exists public.audit_events (
 id uuid primary key default gen_random_uuid(), event_type text not null, actor_id uuid, actor_role text,
 entity_type text not null, entity_id text, action text not null, request_id text, session_id text,
 metadata jsonb not null default '{}'::jsonb, before_hash text, after_hash text, created_at timestamptz not null default now()
);
create table if not exists public.grace_ai_audit (
 id uuid primary key default gen_random_uuid(), conversation_id uuid, profile_id uuid, intent text,
 safety_classification text, retrieved_sources jsonb not null default '[]'::jsonb, tools_requested jsonb not null default '[]'::jsonb,
 tools_executed jsonb not null default '[]'::jsonb, workflow_instance_id uuid references public.workflow_instances(id) on delete set null,
 outcome text, confidence_state text, handoff_type text, request_id text, created_at timestamptz not null default now()
);

-- Document lifecycle additions
create table if not exists public.document_versions (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 version integer not null, storage_path text not null, checksum text, created_by uuid references public.staff(id),
 created_at timestamptz not null default now(), unique(document_id,version)
);
create table if not exists public.document_categories (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, sensitivity text not null default 'internal'
);
create table if not exists public.document_permissions (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 grantee_type text not null, grantee_id text not null, permission text not null, expires_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.document_signatures (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
 signer_profile_id uuid references public.profiles(id), status text not null default 'requested', signed_at timestamptz,
 provider_reference text, created_at timestamptz not null default now()
);

-- Feature flags and privacy-safe observability
create table if not exists public.feature_flags (
 id uuid primary key default gen_random_uuid(), flag_key text unique not null, description text, enabled boolean not null default false,
 rollout_percent integer not null default 0 check(rollout_percent between 0 and 100), audience jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
create table if not exists public.system_events (
 id uuid primary key default gen_random_uuid(), level text not null default 'info', event_type text not null,
 service text not null, request_id text, duration_ms integer, status text, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.access_policy_rules enable row level security;
alter table public.client_team_assignments enable row level security;
alter table public.audit_events enable row level security;
alter table public.grace_ai_audit enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_categories enable row level security;
alter table public.document_permissions enable row level security;
alter table public.document_signatures enable row level security;
alter table public.feature_flags enable row level security;
alter table public.system_events enable row level security;

create policy "permissions staff read" on public.permissions for select using (public.is_staff_user());
create policy "role permissions management" on public.role_permissions for all using (public.current_role()::text in ('administrator','manager','super_admin','director')) with check (public.current_role()::text in ('administrator','manager','super_admin','director'));
create policy "access policy management" on public.access_policy_rules for all using (public.current_role()::text in ('administrator','manager','super_admin','director')) with check (public.current_role()::text in ('administrator','manager','super_admin','director'));
create policy "team assignments staff" on public.client_team_assignments for select using (public.is_staff_user());
create policy "team assignments management" on public.client_team_assignments for all using (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director','case_manager')) with check (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director','case_manager'));
create policy "audit managers read" on public.audit_events for select using (public.current_role()::text in ('administrator','manager','super_admin','director'));
create policy "ai audit managers read" on public.grace_ai_audit for select using (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director'));
create policy "doc versions staff" on public.document_versions for select using (public.is_staff_user());
create policy "doc categories staff" on public.document_categories for select using (public.is_staff_user());
create policy "doc permissions staff" on public.document_permissions for select using (public.is_staff_user());
create policy "doc signatures staff" on public.document_signatures for select using (public.is_staff_user());
create policy "feature flags staff" on public.feature_flags for select using (public.is_staff_user());
create policy "feature flags admin" on public.feature_flags for all using (public.current_role()::text in ('administrator','manager','super_admin')) with check (public.current_role()::text in ('administrator','manager','super_admin'));
create policy "system events managers" on public.system_events for select using (public.current_role()::text in ('administrator','manager','super_admin','director'));

-- Seed broad sensitivity classes used by the authorization layer.
insert into public.permissions(permission_key,resource_class,action,description) values
('client.basic.read','CLIENT_BASIC','read','Read basic client identity and operational fields'),
('client.clinical.read','CLIENT_CLINICAL','read','Read permitted clinical record fields'),
('client.therapy_notes.read','CLIENT_THERAPY_NOTES','read','Read restricted therapy notes'),
('client.medication.read','CLIENT_MEDICATION','read','Read medication-related records where authorised'),
('client.family.read','CLIENT_FAMILY','read','Read consent-governed family records'),
('client.financial.read','CLIENT_FINANCIAL','read','Read client financial records'),
('client.safety.read','CLIENT_SAFETY','read','Read safety/risk information'),
('staff.hr.read','STAFF_HR','read','Read authorised HR records'),
('finance.read','FINANCE','read','Read finance records')
on conflict(permission_key) do nothing;

-- Align enterprise record module constraint with GraceFlow's care orchestration target.
alter table public.enterprise_records drop constraint if exists enterprise_records_module_check;
alter table public.enterprise_records add constraint enterprise_records_module_check check (module in (
 'care','purchase','inventory','hr','helpdesk','timesheets','project','crm','sign','accounting','discuss','documents','field-service','email-marketing'
));
