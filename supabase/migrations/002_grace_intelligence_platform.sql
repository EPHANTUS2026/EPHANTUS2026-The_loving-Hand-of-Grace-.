-- GRACE Intelligence Platform
-- The trusted digital intelligence, care-navigation and service-orchestration layer
-- powering The Loving Hand of Grace experience.
--
-- Permanent rule:
-- Grace may explain, guide, retrieve, coordinate and connect.
-- Clinical professionals assess, diagnose, prescribe and decide.

create type public.grace_knowledge_status as enum ('draft','review','approved','superseded','archived');
create type public.grace_answer_state as enum ('VERIFIED','GENERAL','INFERRED','UNKNOWN','RESTRICTED','EMERGENCY');
create type public.grace_handoff_type as enum ('Admissions','Clinical question','Counselling enquiry','Existing patient','Family support','Billing','Emergency','Complaint','Privacy concern','General enquiry');

create table public.grace_knowledge_documents (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 slug text not null unique,
 content text not null,
 source_type text not null default 'centre_document',
 owner text not null,
 status public.grace_knowledge_status not null default 'draft',
 version text not null default '1.0',
 approved_by uuid references public.staff(id),
 approved_at timestamptz,
 review_due date,
 jurisdiction text not null default 'Kenya',
 source_reference text,
 clinical_sensitivity text not null default 'general',
 grace_access_level text not null default 'public',
 grace_visibility text not null default 'blocked',
 published_at timestamptz,
 superseded_by uuid references public.grace_knowledge_documents(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((status='approved' and grace_visibility='approved') or grace_visibility<>'approved')
);

create index grace_knowledge_active_idx on public.grace_knowledge_documents(status, grace_visibility, review_due);

create table public.grace_conversations (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid references auth.users(id) on delete set null,
 profile_id uuid references public.profiles(id) on delete set null,
 client_id uuid references public.clients(id) on delete cascade,
 context_type text not null default 'anonymous',
 language text not null default 'en',
 status text not null default 'active',
 consent_to_handoff boolean not null default false,
 started_at timestamptz not null default now(),
 ended_at timestamptz
);

create table public.grace_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.grace_conversations(id) on delete cascade,
 role text not null check (role in ('user','grace','system')),
 content text not null,
 answer_state public.grace_answer_state,
 intent text,
 safety_class text,
 confidence_state text,
 requires_human boolean not null default false,
 created_at timestamptz not null default now()
);

create table public.grace_message_sources (
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null references public.grace_messages(id) on delete cascade,
 knowledge_document_id uuid not null references public.grace_knowledge_documents(id),
 source_section text,
 document_version text,
 retrieval_score numeric(6,5),
 authority_tier smallint not null default 1,
 created_at timestamptz not null default now()
);

create table public.grace_checkins (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 mood_score smallint not null check (mood_score between 1 and 5),
 craving_level smallint not null check (craving_level between 0 and 10),
 coping_tool text,
 note text,
 source text not null default 'client_portal',
 visibility text not null default 'client_and_assigned_care_team',
 created_at timestamptz not null default now()
);

create table public.grace_consents (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid references public.grace_conversations(id) on delete cascade,
 client_id uuid references public.clients(id) on delete cascade,
 purpose text not null,
 disclosure text not null,
 data_categories jsonb not null default '[]'::jsonb,
 action_type text,
 status text not null default 'pending' check (status in ('pending','granted','declined','revoked','expired')),
 granted_at timestamptz,
 revoked_at timestamptz,
 expires_at timestamptz,
 created_at timestamptz not null default now()
);

create table public.grace_handoffs (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid references public.grace_conversations(id) on delete set null,
 client_id uuid references public.clients(id) on delete set null,
 handoff_type public.grace_handoff_type not null,
 summary text not null,
 consent_id uuid references public.grace_consents(id),
 assigned_role public.user_role,
 assigned_staff_id uuid references public.staff(id),
 status text not null default 'queued' check (status in ('queued','accepted','completed','cancelled')),
 priority text not null default 'routine',
 created_at timestamptz not null default now(),
 accepted_at timestamptz,
 completed_at timestamptz
);

create table public.grace_action_confirmations (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid references public.grace_conversations(id) on delete cascade,
 action_type text not null,
 action_payload jsonb not null default '{}'::jsonb,
 summary_shown_to_user text not null,
 confirmed boolean,
 confirmed_at timestamptz,
 executed_at timestamptz,
 execution_reference text,
 created_at timestamptz not null default now()
);

create table public.grace_eval_runs (
 id uuid primary key default gen_random_uuid(),
 release_version text not null,
 suite_name text not null,
 status text not null check (status in ('pass','fail','running')),
 score numeric(5,2),
 total_cases integer not null default 0,
 passed_cases integer not null default 0,
 failed_cases integer not null default 0,
 executed_by uuid references public.staff(id),
 executed_at timestamptz not null default now(),
 report jsonb not null default '{}'::jsonb
);

create table public.grace_emergency_config (
 id uuid primary key default gen_random_uuid(),
 jurisdiction text not null,
 config_key text not null,
 config_value jsonb not null,
 active boolean not null default true,
 reviewed_by uuid references public.staff(id),
 reviewed_at timestamptz,
 review_due date,
 unique(jurisdiction,config_key)
);

-- Sensitive tables are RLS protected. Service-role orchestration remains server-side.
alter table public.grace_knowledge_documents enable row level security;
alter table public.grace_conversations enable row level security;
alter table public.grace_messages enable row level security;
alter table public.grace_message_sources enable row level security;
alter table public.grace_checkins enable row level security;
alter table public.grace_consents enable row level security;
alter table public.grace_handoffs enable row level security;
alter table public.grace_action_confirmations enable row level security;
alter table public.grace_eval_runs enable row level security;
alter table public.grace_emergency_config enable row level security;

-- Helpers use the existing profiles table.
create or replace function public.current_profile_role()
returns public.user_role language sql stable security definer set search_path=public as $$
 select role from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1
$$;

create or replace function public.current_client_id()
returns uuid language sql stable security definer set search_path=public as $$
 select client_id from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1
$$;

-- Clients can create and read only their own check-ins.
create policy grace_checkins_client_select on public.grace_checkins for select to authenticated
 using (client_id=public.current_client_id());
create policy grace_checkins_client_insert on public.grace_checkins for insert to authenticated
 with check (client_id=public.current_client_id());

-- Assigned clinical/counselling/admin staff may read check-ins; finance and family do not gain access.
create policy grace_checkins_care_team_select on public.grace_checkins for select to authenticated
 using (public.current_profile_role() in ('counsellor','clinician','administrator','manager','super_admin'));

-- Users may access only conversations tied to their auth identity.
create policy grace_conversations_owner_select on public.grace_conversations for select to authenticated
 using (auth_user_id=auth.uid());
create policy grace_conversations_owner_insert on public.grace_conversations for insert to authenticated
 with check (auth_user_id=auth.uid());
create policy grace_messages_owner_select on public.grace_messages for select to authenticated
 using (exists(select 1 from public.grace_conversations c where c.id=conversation_id and c.auth_user_id=auth.uid()));

-- Knowledge governance is management-only. Public Grace should retrieve approved knowledge through a server endpoint,
-- not direct table access from a browser.
create policy grace_knowledge_admin_all on public.grace_knowledge_documents for all to authenticated
 using (public.current_profile_role() in ('administrator','manager','super_admin'))
 with check (public.current_profile_role() in ('administrator','manager','super_admin'));

create policy grace_eval_admin_select on public.grace_eval_runs for select to authenticated
 using (public.current_profile_role() in ('administrator','manager','super_admin'));
create policy grace_eval_admin_write on public.grace_eval_runs for all to authenticated
 using (public.current_profile_role() in ('administrator','manager','super_admin'))
 with check (public.current_profile_role() in ('administrator','manager','super_admin'));

create policy grace_emergency_admin_all on public.grace_emergency_config for all to authenticated
 using (public.current_profile_role() in ('administrator','manager','super_admin'))
 with check (public.current_profile_role() in ('administrator','manager','super_admin'));

-- Audit Grace handoffs and knowledge changes via existing audit_log from server actions.
comment on table public.grace_knowledge_documents is 'Approved, versioned knowledge retrievable by Grace. Only active approved content may support institutional claims.';
comment on table public.grace_checkins is 'Client self-check-ins. These are support signals, not autonomous diagnoses or clinical decisions.';
comment on table public.grace_handoffs is 'Consent-aware human escalation queue. Grace coordinates; authorised humans decide.';
