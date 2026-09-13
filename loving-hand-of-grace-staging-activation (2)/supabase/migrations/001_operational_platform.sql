-- The Loving Hand of Grace operational care platform
-- Run in a dedicated Supabase/Postgres project. Review retention, consent, clinical governance,
-- Kenya Data Protection Act obligations and healthcare-record requirements with qualified advisers before production.

create extension if not exists pgcrypto;

create type public.user_role as enum ('client','family','counsellor','clinician','admissions','finance','administrator','manager','super_admin');
create type public.admission_stage as enum ('enquiry','screening','assessment','admission_ready','admitted','treatment','discharge','aftercare','closed');
create type public.task_status as enum ('queued','active','blocked','completed','cancelled');
create type public.invoice_status as enum ('draft','issued','part_paid','paid','void','overdue');

create table public.clients (
 id uuid primary key default gen_random_uuid(),
 client_code text not null unique,
 legal_name text not null,
 preferred_name text,
 date_of_birth date,
 phone text,
 email text,
 admission_stage public.admission_stage not null default 'enquiry',
 assigned_staff_id uuid,
 status text not null default 'active',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.staff (
 id uuid primary key default gen_random_uuid(),
 staff_code text not null unique,
 full_name text not null,
 job_title text,
 department text,
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create table public.family_members (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 full_name text not null,
 relationship text,
 phone text,
 email text,
 consent_active boolean not null default false,
 consent_scope jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table public.profiles (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid not null unique references auth.users(id) on delete cascade,
 full_name text not null,
 role public.user_role not null,
 is_active boolean not null default true,
 client_id uuid references public.clients(id),
 family_member_id uuid references public.family_members(id),
 staff_id uuid references public.staff(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (
   (role='client' and client_id is not null) or
   (role='family' and family_member_id is not null) or
   (role not in ('client','family'))
 )
);

alter table public.clients add constraint clients_assigned_staff_fkey foreign key (assigned_staff_id) references public.staff(id);

create table public.admissions (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique,
 client_id uuid references public.clients(id),
 enquiry_name text,
 enquiry_phone text,
 enquiry_email text,
 source text,
 stage public.admission_stage not null default 'enquiry',
 priority text not null default 'routine',
 screening_summary text,
 assessment_summary text,
 assigned_staff_id uuid references public.staff(id),
 next_action text,
 next_action_due timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.care_plans (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 title text not null,
 status text not null default 'active',
 summary_for_client text,
 confidential_clinical_context text,
 start_date date,
 target_review_date date,
 created_by uuid references public.staff(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.care_goals (
 id uuid primary key default gen_random_uuid(),
 care_plan_id uuid not null references public.care_plans(id) on delete cascade,
 title text not null,
 description text,
 status text not null default 'not_started',
 progress smallint not null default 0 check (progress between 0 and 100),
 visible_to_client boolean not null default true,
 due_date date,
 updated_at timestamptz not null default now()
);

create table public.case_notes (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 author_staff_id uuid not null references public.staff(id),
 note_type text not null default 'progress',
 content text not null,
 sensitivity text not null default 'clinical',
 created_at timestamptz not null default now(),
 amended_at timestamptz,
 amendment_reason text
);

create table public.risk_flags (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 severity text not null,
 category text not null,
 summary text not null,
 status text not null default 'open',
 raised_by uuid references public.staff(id),
 reviewed_by uuid references public.staff(id),
 raised_at timestamptz not null default now(),
 reviewed_at timestamptz
);

create table public.appointments (
 id uuid primary key default gen_random_uuid(),
 client_id uuid references public.clients(id) on delete cascade,
 family_member_id uuid references public.family_members(id) on delete set null,
 appointment_type text not null,
 title text not null,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 location text,
 assigned_staff_id uuid references public.staff(id),
 status text not null default 'scheduled',
 visible_to_client boolean not null default true,
 visible_to_family boolean not null default false,
 created_at timestamptz not null default now(),
 check (ends_at > starts_at)
);

create table public.documents (
 id uuid primary key default gen_random_uuid(),
 client_id uuid references public.clients(id) on delete cascade,
 document_type text not null,
 title text not null,
 storage_path text not null,
 version integer not null default 1,
 status text not null default 'draft',
 visible_to_client boolean not null default false,
 visible_to_family boolean not null default false,
 uploaded_by uuid references public.staff(id),
 created_at timestamptz not null default now()
);

create table public.consents (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 family_member_id uuid references public.family_members(id) on delete cascade,
 consent_type text not null,
 scope jsonb not null default '{}'::jsonb,
 status text not null default 'pending',
 signed_at timestamptz,
 expires_at timestamptz,
 revoked_at timestamptz,
 document_id uuid references public.documents(id),
 created_at timestamptz not null default now()
);

create table public.family_updates (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 family_member_id uuid references public.family_members(id) on delete cascade,
 summary text not null,
 approved_by uuid not null references public.staff(id),
 approved_at timestamptz not null default now(),
 expires_at timestamptz,
 created_at timestamptz not null default now()
);

create table public.invoices (
 id uuid primary key default gen_random_uuid(),
 invoice_number text not null unique,
 client_id uuid references public.clients(id) on delete set null,
 account_name text not null,
 currency text not null default 'KES',
 subtotal numeric(12,2) not null default 0,
 total numeric(12,2) not null default 0,
 balance numeric(12,2) not null default 0,
 status public.invoice_status not null default 'draft',
 due_date date,
 issued_at timestamptz,
 created_by uuid references public.staff(id),
 created_at timestamptz not null default now()
);

create table public.payments (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid references public.invoices(id) on delete restrict,
 provider text not null,
 provider_reference text unique,
 checkout_request_id text unique,
 amount numeric(12,2) not null check (amount >= 0),
 currency text not null default 'KES',
 status text not null default 'pending',
 phone_masked text,
 raw_callback jsonb,
 received_at timestamptz,
 created_at timestamptz not null default now()
);

create table public.workflow_instances (
 id uuid primary key default gen_random_uuid(),
 workflow_key text not null,
 entity_type text not null,
 entity_id uuid not null,
 current_state text not null,
 status text not null default 'active',
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.workflow_tasks (
 id uuid primary key default gen_random_uuid(),
 workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
 task_type text not null,
 title text not null,
 assigned_role public.user_role,
 assigned_staff_id uuid references public.staff(id),
 status public.task_status not null default 'queued',
 due_at timestamptz,
 payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);

create table public.audit_log (
 id bigint generated always as identity primary key,
 actor_auth_user_id uuid,
 actor_profile_id uuid,
 action text not null,
 entity_type text not null,
 entity_id text,
 before_state jsonb,
 after_state jsonb,
 reason text,
 ip_hash text,
 created_at timestamptz not null default now()
);

create index on public.admissions(stage, updated_at desc);
create index on public.appointments(starts_at);
create index on public.case_notes(client_id, created_at desc);
create index on public.workflow_tasks(status, due_at);
create index on public.audit_log(entity_type, entity_id, created_at desc);

create or replace function public.current_profile()
returns public.profiles language sql stable security definer set search_path=public as $$
 select * from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
$$;

create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path=public as $$
 select role from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
$$;

alter table public.clients enable row level security;
alter table public.staff enable row level security;
alter table public.family_members enable row level security;
alter table public.profiles enable row level security;
alter table public.admissions enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_goals enable row level security;
alter table public.case_notes enable row level security;
alter table public.risk_flags enable row level security;
alter table public.appointments enable row level security;
alter table public.documents enable row level security;
alter table public.consents enable row level security;
alter table public.family_updates enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.workflow_instances enable row level security;
alter table public.workflow_tasks enable row level security;
alter table public.audit_log enable row level security;

create policy "own profile" on public.profiles for select using (auth_user_id=auth.uid());
create policy "staff profiles admin" on public.profiles for all using (public.current_role() in ('administrator','super_admin')) with check (public.current_role() in ('administrator','super_admin'));

create policy "client self" on public.clients for select using (id=(public.current_profile()).client_id);
create policy "family client basic" on public.clients for select using (id=(select client_id from public.family_members where id=(public.current_profile()).family_member_id and consent_active=true));
create policy "care staff clients" on public.clients for select using (public.current_role() in ('counsellor','clinician','admissions','administrator','manager','super_admin'));

create policy "staff directory authorised" on public.staff for select using (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "family own" on public.family_members for select using (id=(public.current_profile()).family_member_id);
create policy "family staff manage" on public.family_members for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "admissions authorised" on public.admissions for all using (public.current_role() in ('admissions','clinician','counsellor','administrator','manager','super_admin')) with check (public.current_role() in ('admissions','clinician','counsellor','administrator','manager','super_admin'));

create policy "care plans client approved" on public.care_plans for select using (client_id=(public.current_profile()).client_id);
create policy "care plans staff" on public.care_plans for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));
create policy "care goals client visible" on public.care_goals for select using (visible_to_client=true and care_plan_id in (select id from public.care_plans where client_id=(public.current_profile()).client_id));
create policy "care goals staff" on public.care_goals for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "clinical notes only" on public.case_notes for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));
create policy "risk flags only" on public.risk_flags for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "client appointments" on public.appointments for select using (visible_to_client=true and client_id=(public.current_profile()).client_id);
create policy "family appointments" on public.appointments for select using (visible_to_family=true and family_member_id=(public.current_profile()).family_member_id);
create policy "staff appointments" on public.appointments for all using (public.current_role() in ('counsellor','clinician','admissions','administrator','manager','super_admin')) with check (public.current_role() in ('counsellor','clinician','admissions','administrator','manager','super_admin'));

create policy "client documents" on public.documents for select using (visible_to_client=true and client_id=(public.current_profile()).client_id);
create policy "family documents" on public.documents for select using (visible_to_family=true and client_id=(select client_id from public.family_members where id=(public.current_profile()).family_member_id and consent_active=true));
create policy "records staff" on public.documents for all using (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));

create policy "client consents" on public.consents for select using (client_id=(public.current_profile()).client_id);
create policy "consent staff" on public.consents for all using (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));
create policy "family approved updates" on public.family_updates for select using (family_member_id=(public.current_profile()).family_member_id and (expires_at is null or expires_at>now()));
create policy "family update staff" on public.family_updates for all using (public.current_role() in ('counsellor','clinician','administrator','super_admin')) with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "client invoices" on public.invoices for select using (client_id=(public.current_profile()).client_id);
create policy "finance invoices" on public.invoices for all using (public.current_role() in ('finance','administrator','manager','super_admin')) with check (public.current_role() in ('finance','administrator','manager','super_admin'));
create policy "client payments" on public.payments for select using (invoice_id in (select id from public.invoices where client_id=(public.current_profile()).client_id));
create policy "finance payments" on public.payments for all using (public.current_role() in ('finance','administrator','manager','super_admin')) with check (public.current_role() in ('finance','administrator','manager','super_admin'));

create policy "workflow staff" on public.workflow_instances for select using (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "workflow admin write" on public.workflow_instances for all using (public.current_role() in ('administrator','super_admin')) with check (public.current_role() in ('administrator','super_admin'));
create policy "tasks staff" on public.workflow_tasks for select using (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "tasks admin write" on public.workflow_tasks for all using (public.current_role() in ('administrator','super_admin')) with check (public.current_role() in ('administrator','super_admin'));
create policy "audit managers read" on public.audit_log for select using (public.current_role() in ('administrator','manager','super_admin'));

-- Never grant direct client insert/update rights to audit_log. Server-side APIs write audit events using the service role.
