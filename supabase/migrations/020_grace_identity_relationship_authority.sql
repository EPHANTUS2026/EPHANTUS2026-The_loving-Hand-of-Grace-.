-- GRACE-2: server-authoritative family consent and staff relationship authority.
-- Additive only. No existing tables are recreated.
create table if not exists public.staff_client_assignments (
 id uuid primary key default gen_random_uuid(),
 staff_id uuid not null references public.staff(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade,
 scopes text[] not null default array['journey']::text[],
 purposes text[] not null default array['care']::text[],
 active boolean not null default true,
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 unique(staff_id,client_id)
);
create index if not exists staff_client_assignments_lookup on public.staff_client_assignments(staff_id,client_id,active);
alter table public.staff_client_assignments enable row level security;

create or replace function public.grace_family_authority(p_client_id uuid,p_category text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from profiles p
   join family_members f on f.id=p.family_member_id
   join consents c on c.family_member_id=f.id and c.client_id=f.client_id
   where p.auth_user_id=auth.uid() and p.is_active=true and p.role='family'
     and f.client_id=p_client_id and f.consent_active=true
     and c.status='active' and c.revoked_at is null
     and (c.expires_at is null or c.expires_at>now())
     and (
       coalesce(c.scope->>'all','false')='true'
       or c.scope ? p_category
       or coalesce((c.scope->p_category)::text,'false')='true'
     )
 );
$$;

create or replace function public.grace_staff_authority(p_client_id uuid,p_scope text,p_purpose text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from profiles p join staff_client_assignments a on a.staff_id=p.staff_id
   where p.auth_user_id=auth.uid() and p.is_active=true
     and p.role not in ('client','family')
     and a.client_id=p_client_id and a.active=true and a.revoked_at is null
     and (a.ends_at is null or a.ends_at>now())
     and (p_scope=any(a.scopes) or '*'=any(a.scopes))
     and (p_purpose=any(a.purposes) or '*'=any(a.purposes))
 );
$$;

revoke all on function public.grace_family_authority(uuid,text) from public,anon;
revoke all on function public.grace_staff_authority(uuid,text,text) from public,anon;
grant execute on function public.grace_family_authority(uuid,text) to authenticated;
grant execute on function public.grace_staff_authority(uuid,text,text) to authenticated;

create policy staff_assignment_self_read on public.staff_client_assignments for select to authenticated
 using(staff_id=(public.current_profile()).staff_id);
