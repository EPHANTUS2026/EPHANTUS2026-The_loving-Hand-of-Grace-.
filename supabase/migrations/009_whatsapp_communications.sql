-- WhatsApp communications layer. Apply after 008_production_connector_integrations.sql.
create extension if not exists pgcrypto;

create table if not exists public.communication_consents (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid references public.profiles(id) on delete set null,
 booking_id uuid references public.appointments(id) on delete set null,
 phone_number text not null,
 channel text not null check(channel in ('whatsapp','sms','email','phone')),
 purpose text not null,
 consent_status text not null default 'granted' check(consent_status in ('granted','revoked')),
 consent_version text not null default '1',
 consented_at timestamptz not null default now(),
 revoked_at timestamptz,
 source text not null default 'website',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid references public.profiles(id) on delete set null,
 phone_number text not null,
 booking_id uuid references public.appointments(id) on delete set null,
 admission_id uuid references public.admissions(id) on delete set null,
 state text not null default 'AI_ACTIVE' check(state in ('AI_ACTIVE','HANDOFF_REQUESTED','HUMAN_ACTIVE','CLOSED')),
 assigned_team text,
 assigned_staff_id uuid references public.staff(id) on delete set null,
 started_at timestamptz not null default now(),
 last_message_at timestamptz,
 closed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
 provider_message_id text unique,
 phone_number text,
 direction text not null check(direction in ('inbound','outbound')),
 message_type text not null default 'template',
 template_name text,
 status text not null default 'queued',
 sent_at timestamptz,
 delivered_at timestamptz,
 read_at timestamptz,
 received_at timestamptz,
 failed_at timestamptz,
 failure_code text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.communication_events (
 id uuid primary key default gen_random_uuid(),
 channel text not null,
 purpose text not null,
 recipient_reference text,
 provider text,
 provider_message_id text,
 booking_id uuid references public.appointments(id) on delete set null,
 workflow_id uuid references public.workflow_instances(id) on delete set null,
 status text not null default 'QUEUED',
 error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_provider_idx on public.whatsapp_messages(provider_message_id);
create index if not exists whatsapp_conversations_phone_idx on public.whatsapp_conversations(phone_number,last_message_at desc);
create index if not exists communication_events_status_idx on public.communication_events(channel,status,created_at desc);

alter table public.communication_consents enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.communication_events enable row level security;

create policy "communications staff consent" on public.communication_consents for select using (public.current_role() in ('admissions','administrator','manager','super_admin'));
create policy "communications staff conversations" on public.whatsapp_conversations for select using (public.current_role() in ('admissions','counsellor','administrator','manager','super_admin'));
create policy "communications staff messages" on public.whatsapp_messages for select using (public.current_role() in ('admissions','counsellor','administrator','manager','super_admin'));
create policy "communications admin events" on public.communication_events for select using (public.current_role() in ('administrator','manager','super_admin'));
