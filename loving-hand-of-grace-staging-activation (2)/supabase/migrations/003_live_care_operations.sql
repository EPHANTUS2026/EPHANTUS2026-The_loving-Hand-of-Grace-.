-- Live care operations: Admissions -> Client Record -> Care Plan -> Sessions -> Discharge -> Aftercare
-- Apply after 001_operational_platform.sql and 002_grace_intelligence_platform.sql.

create type public.session_status as enum ('scheduled','completed','cancelled','missed');
create type public.plan_status as enum ('draft','active','ready_for_review','approved','completed','cancelled');

alter table public.clients
  add column if not exists admission_date date,
  add column if not exists discharge_date date,
  add column if not exists primary_programme text,
  add column if not exists preferred_language text default 'English';

create table if not exists public.care_sessions (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 care_plan_id uuid references public.care_plans(id) on delete set null,
 session_type text not null,
 title text not null,
 scheduled_at timestamptz not null,
 duration_minutes integer not null default 50 check (duration_minutes between 5 and 480),
 assigned_staff_id uuid references public.staff(id),
 status public.session_status not null default 'scheduled',
 attendance_note text,
 clinical_note text,
 client_summary text,
 next_step text,
 created_by uuid references public.staff(id),
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.discharge_plans (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null unique references public.clients(id) on delete cascade,
 care_plan_id uuid references public.care_plans(id) on delete set null,
 status public.plan_status not null default 'draft',
 target_discharge_date date,
 readiness_summary text,
 medication_handoff_note text,
 housing_or_environment_plan text,
 recovery_support_plan text,
 warning_signs_plan text,
 emergency_support_plan text,
 follow_up_requirements text,
 client_acknowledged_at timestamptz,
 reviewed_by uuid references public.staff(id),
 approved_by uuid references public.staff(id),
 approved_at timestamptz,
 created_by uuid references public.staff(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.aftercare_plans (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null unique references public.clients(id) on delete cascade,
 discharge_plan_id uuid references public.discharge_plans(id) on delete set null,
 status public.plan_status not null default 'active',
 start_date date not null default current_date,
 target_end_date date,
 cadence text,
 assigned_staff_id uuid references public.staff(id),
 goals_summary text,
 relapse_prevention_summary text,
 community_support_summary text,
 family_support_summary text,
 next_review_at timestamptz,
 created_by uuid references public.staff(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.aftercare_reviews (
 id uuid primary key default gen_random_uuid(),
 aftercare_plan_id uuid not null references public.aftercare_plans(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade,
 reviewed_at timestamptz not null default now(),
 reviewed_by uuid references public.staff(id),
 contact_method text,
 wellbeing_summary text,
 recovery_progress text,
 concerns text,
 actions text,
 next_review_at timestamptz,
 created_at timestamptz not null default now()
);

create index if not exists care_sessions_client_date_idx on public.care_sessions(client_id, scheduled_at desc);
create index if not exists care_sessions_staff_date_idx on public.care_sessions(assigned_staff_id, scheduled_at);
create index if not exists aftercare_reviews_client_date_idx on public.aftercare_reviews(client_id, reviewed_at desc);
create index if not exists aftercare_plans_review_idx on public.aftercare_plans(next_review_at) where status in ('active','ready_for_review','approved');

alter table public.care_sessions enable row level security;
alter table public.discharge_plans enable row level security;
alter table public.aftercare_plans enable row level security;
alter table public.aftercare_reviews enable row level security;

create policy "care sessions staff" on public.care_sessions for all
 using (public.current_role() in ('counsellor','clinician','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "discharge care staff" on public.discharge_plans for all
 using (public.current_role() in ('counsellor','clinician','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "aftercare care staff" on public.aftercare_plans for all
 using (public.current_role() in ('counsellor','clinician','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

create policy "aftercare review care staff" on public.aftercare_reviews for all
 using (public.current_role() in ('counsellor','clinician','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','administrator','super_admin'));

-- Give care teams the ability to update client operational state while keeping broad writes restricted.
create policy "care staff insert clients" on public.clients for insert
 with check (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));
create policy "care staff update clients" on public.clients for update
 using (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));

-- GraceFlow workflows are written through authenticated server routes. Expand RLS for authorised operators.
create policy "workflow authorised insert" on public.workflow_instances for insert
 with check (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "workflow authorised update" on public.workflow_instances for update
 using (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "task authorised insert" on public.workflow_tasks for insert
 with check (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));
create policy "task authorised update" on public.workflow_tasks for update
 using (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','admissions','finance','administrator','manager','super_admin'));

-- Privacy hardening for direct client access.
-- RLS is row-level, not column-level: a client policy on care_plans would expose
-- confidential_clinical_context if the browser queried the table directly.
drop policy if exists "care plans client approved" on public.care_plans;
drop policy if exists grace_checkins_care_team_select on public.grace_checkins;
create policy grace_checkins_care_team_select on public.grace_checkins for select to authenticated
 using (public.current_profile_role() in ('counsellor','clinician','administrator','super_admin'));

-- Grace handoff visibility is scoped to the assigned staff member/role or governance roles.
create policy grace_handoffs_staff_select on public.grace_handoffs for select to authenticated
 using (
   public.current_profile_role() in ('administrator','manager','super_admin')
   or assigned_role=public.current_profile_role()
   or assigned_staff_id=(public.current_profile()).staff_id
 );


-- Management dashboards use bounded aggregate server queries; routine manager tokens do not receive client-level care data.
drop policy if exists "care staff clients" on public.clients;
create policy "care staff clients" on public.clients for select
 using (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));

drop policy if exists "admissions authorised" on public.admissions;
create policy "admissions authorised" on public.admissions for all
 using (public.current_role() in ('admissions','clinician','counsellor','administrator','super_admin'))
 with check (public.current_role() in ('admissions','clinician','counsellor','administrator','super_admin'));

drop policy if exists "staff appointments" on public.appointments;
create policy "staff appointments" on public.appointments for all
 using (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'))
 with check (public.current_role() in ('counsellor','clinician','admissions','administrator','super_admin'));

drop policy if exists grace_handoffs_staff_select on public.grace_handoffs;
create policy grace_handoffs_staff_select on public.grace_handoffs for select to authenticated
 using (
   public.current_profile_role() in ('administrator','super_admin')
   or assigned_role=public.current_profile_role()
   or assigned_staff_id=(public.current_profile()).staff_id
 );
