-- Client Welfare Graph foundation: additive, server-authoritative and relationship-aware.
create table if not exists public.client_welfare_profiles(
 client_id uuid primary key references public.clients(id) on delete cascade,
 recovery jsonb not null default '{}'::jsonb, physical_wellbeing jsonb not null default '{}'::jsonb,
 psychosocial_wellbeing jsonb not null default '{}'::jsonb, safety jsonb not null default '{}'::jsonb,
 family_relationships jsonb not null default '{}'::jsonb, housing_stability jsonb not null default '{}'::jsonb,
 economic_wellbeing jsonb not null default '{}'::jsonb, education_skills jsonb not null default '{}'::jsonb,
 community_reintegration jsonb not null default '{}'::jsonb, aftercare jsonb not null default '{}'::jsonb,
 long_term_stability jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.client_welfare_relationships(
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 relationship_type text not null check(relationship_type in ('GOAL','NEED','SERVICE','PROGRAMME','APPOINTMENT','DOCUMENT','MILESTONE','CONSENT','AUTHORIZED_RELATIONSHIP','SUPPORT_PERSON','CASE_WORKER','COUNSELLOR','REFERRAL','SKILL','REINTEGRATION_PLAN','AFTERCARE_PLAN','WELFARE_OUTCOME')),
 target_type text not null,target_id uuid, status text not null default 'ACTIVE', valid_from timestamptz not null default now(),valid_until timestamptz,
 provenance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.client_welfare_profiles enable row level security;alter table public.client_welfare_relationships enable row level security;
create policy "client own welfare profile" on public.client_welfare_profiles for select to authenticated using(client_id=public.current_client_id());
create policy "client own approved welfare relationships" on public.client_welfare_relationships for select to authenticated using(client_id=public.current_client_id() and status='ACTIVE' and (valid_until is null or valid_until>now()));
revoke insert,update,delete on public.client_welfare_profiles from anon,authenticated;
revoke insert,update,delete on public.client_welfare_relationships from anon,authenticated;
