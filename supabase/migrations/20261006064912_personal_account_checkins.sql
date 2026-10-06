create function lhg_account_private.public_identity_verified(p_user uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,pg_temp as $$
 select exists(select 1 from auth.users where id=p_user and coalesce(is_anonymous,false)=false
 and (banned_until is null or banned_until<=now())
 and (email_confirmed_at is not null or phone_confirmed_at is not null));
$$;
revoke all on function lhg_account_private.public_identity_verified(uuid) from public,anon,authenticated;
grant execute on function lhg_account_private.public_identity_verified(uuid) to service_role;
create function public.ensure_public_account(p_user uuid,p_name text default 'Member') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.profiles;
begin
 if not lhg_account_private.public_identity_verified(p_user) then raise exception 'verified_identity_required' using errcode='42501';end if;
 if length(coalesce(p_name,''))>120 then raise exception 'invalid_name';end if;
 insert into public.profiles(auth_user_id,full_name,role,is_active)
 values(p_user,coalesce(nullif(trim(p_name),''),'Member'),'member',true) on conflict(auth_user_id) do nothing;
 select * into p from public.profiles where auth_user_id=p_user;
 return jsonb_build_object('id',p.id,'role',p.role,'is_active',p.is_active);
end $$;
revoke all on function public.ensure_public_account(uuid,text) from public,anon,authenticated;
grant execute on function public.ensure_public_account(uuid,text) to service_role;

create table public.personal_checkins (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid not null references auth.users(id) on delete cascade,
 idempotency_key uuid not null,
 mood_score integer not null check(mood_score between 1 and 5),
 craving_level integer not null check(craving_level between 0 and 10),
 coping_tool text check(length(coping_tool)<=1000),
 note text check(length(note)<=2000),
 created_at timestamptz not null default now(),
 local_day date generated always as ((created_at at time zone 'Africa/Nairobi')::date) stored,
 unique(auth_user_id,idempotency_key)
);
create index personal_checkins_recent on public.personal_checkins(auth_user_id,created_at desc);
alter table public.personal_checkins enable row level security;
revoke all on public.personal_checkins from public,anon,authenticated;
grant select,insert on public.personal_checkins to authenticated;
grant all on public.personal_checkins to service_role;
create policy personal_checkins_own_read on public.personal_checkins for select to authenticated
 using(auth_user_id=auth.uid() and exists(select 1 from public.profiles where auth_user_id=auth.uid() and is_active and role='member'));
create policy personal_checkins_own_insert on public.personal_checkins for insert to authenticated
 with check(auth_user_id=auth.uid() and exists(select 1 from public.profiles where auth_user_id=auth.uid() and is_active and role='member'));
create function public.submit_personal_checkin(p_key uuid,p_mood integer,p_craving integer,p_coping text,p_note text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid();r public.personal_checkins;
begin
 if u is null or not exists(select 1 from public.profiles where auth_user_id=u and is_active and role='member') then raise exception 'personal_account_required' using errcode='42501';end if;
 if p_key is null or p_mood is null or p_mood not between 1 and 5 or p_craving is null or p_craving not between 0 and 10 or length(coalesce(p_coping,''))>1000 or length(coalesce(p_note,''))>2000 then raise exception 'invalid_checkin' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text||p_key::text,0));
 select * into r from public.personal_checkins where auth_user_id=u and idempotency_key=p_key;
 if found then
  if r.mood_score is distinct from p_mood or r.craving_level is distinct from p_craving or r.coping_tool is distinct from nullif(btrim(p_coping),'') or r.note is distinct from nullif(btrim(p_note),'') then raise exception 'checkin_retry_conflict' using errcode='PT409';end if;
 else insert into public.personal_checkins(auth_user_id,idempotency_key,mood_score,craving_level,coping_tool,note) values(u,p_key,p_mood,p_craving,nullif(btrim(p_coping),''),nullif(btrim(p_note),'')) returning * into r;end if;
 return jsonb_build_object('id',r.id,'created_at',r.created_at,'local_day',r.local_day,'status','saved');
end $$;
revoke all on function public.submit_personal_checkin(uuid,integer,integer,text,text) from public,anon;
grant execute on function public.submit_personal_checkin(uuid,integer,integer,text,text) to authenticated;

create table public.public_auth_quota(key_hash text primary key check(length(key_hash)=64),window_start timestamptz not null,attempts integer not null);
alter table public.public_auth_quota enable row level security;
revoke all on public.public_auth_quota from public,anon,authenticated;
grant select,insert,update,delete on public.public_auth_quota to service_role;
create function public.consume_public_auth_quota(p_hash text) returns boolean
language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 insert into public.public_auth_quota(key_hash,window_start,attempts) values(p_hash,now(),1)
 on conflict(key_hash) do update set attempts=case when public_auth_quota.window_start<now()-interval '15 minutes' then 1 else public_auth_quota.attempts+1 end,window_start=case when public_auth_quota.window_start<now()-interval '15 minutes' then now() else public_auth_quota.window_start end
 returning attempts into n;
 return n<=20;
end $$;
revoke all on function public.consume_public_auth_quota(text) from public,anon,authenticated;
grant execute on function public.consume_public_auth_quota(text) to service_role;
