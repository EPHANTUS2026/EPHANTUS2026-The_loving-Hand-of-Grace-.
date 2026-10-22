create table public.grace_evaluation_reviews (
 id uuid primary key default gen_random_uuid(),
 scenario_id text not null check (scenario_id ~ '^grace-v2-[0-9]{3}$'),
 reviewer_profile_id uuid not null references public.profiles(id),
 candidate_commit text not null check (candidate_commit ~ '^[a-f0-9]{40}$'),
 evidence_id text not null check (evidence_id ~ '^[A-Za-z0-9_-]{1,100}$'),
 score integer not null check (score between 1 and 5),
 decision text not null check (decision in ('accepted','changes_required')),
 created_at timestamptz not null default now()
);
alter table public.grace_evaluation_reviews enable row level security;
revoke all on public.grace_evaluation_reviews from public,anon,authenticated;
grant select,insert on public.grace_evaluation_reviews to service_role;
-- No UPDATE/DELETE grants: corrections are new review records.
