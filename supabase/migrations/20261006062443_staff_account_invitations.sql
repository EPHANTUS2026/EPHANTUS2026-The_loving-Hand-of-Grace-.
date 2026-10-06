-- Invitation ledger only: existing Auth, profiles and staff remain the source of identity.
create table public.staff_account_invitations (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check(email=lower(trim(email)) and length(email)<=254),
 full_name text not null check(length(trim(full_name)) between 1 and 120),
 job_title text not null check(length(trim(job_title)) between 1 and 120),
 department text not null default '' check(length(department)<=120),
 invited_by uuid not null references public.profiles(id),
 auth_user_id uuid unique references auth.users(id),
 staff_id uuid unique references public.staff(id),
 status text not null default 'sending' check(status in ('sending','pending','active','needs_review','cancelled')),
 created_at timestamptz not null default now(),
 accepted_at timestamptz
);
alter table public.staff_account_invitations enable row level security;
revoke all on public.staff_account_invitations from public,anon,authenticated;
grant select,insert,update on public.staff_account_invitations to service_role;
create index staff_account_invitation_actor_time on public.staff_account_invitations(invited_by,created_at);

create function public.staff_account_reserve(p_actor uuid,p_email text,p_name text,p_job text,p_department text) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_actor public.profiles;v_id uuid;
begin
 select * into v_actor from public.profiles where auth_user_id=p_actor and is_active and role in ('super_admin','administrator') for update;
 if v_actor.id is null then raise exception 'staff_account_forbidden' using errcode='42501';end if;
 if p_email is null or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_invitation';end if;
 if exists(select 1 from auth.users where lower(email)=lower(trim(p_email))) then raise exception 'existing_auth_account';end if;
 if (select count(*) from public.staff_account_invitations where invited_by=v_actor.id and created_at>now()-interval '1 hour')>=10 then raise exception 'invitation_rate_limit';end if;
 insert into public.staff_account_invitations(email,full_name,job_title,department,invited_by) values(lower(trim(p_email)),trim(p_name),trim(p_job),coalesce(trim(p_department),''),v_actor.id) returning id into v_id;
 insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_state,reason) values(p_actor,v_actor.id,'staff_invitation_reserved','staff_account_invitation',v_id::text,'{"role":"staff","status":"sending"}','Authorised staff invitation');
 return v_id;
end $$;

create function public.staff_account_finish(p_actor uuid,p_invitation uuid,p_user uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_actor public.profiles;v_inv public.staff_account_invitations;v_staff uuid;
begin
 select * into v_actor from public.profiles where auth_user_id=p_actor and is_active and role in ('super_admin','administrator') for update;
 if v_actor.id is null then raise exception 'staff_account_forbidden' using errcode='42501';end if;
 select * into v_inv from public.staff_account_invitations where id=p_invitation and invited_by=v_actor.id for update;
 if v_inv.id is null or v_inv.status<>'sending' then raise exception 'invalid_invitation_state';end if;
 if not exists(select 1 from auth.users where id=p_user and lower(email)=v_inv.email and invited_at is not null) or exists(select 1 from public.profiles where auth_user_id=p_user) then raise exception 'invitation_identity_mismatch';end if;
 insert into public.staff(staff_code,full_name,job_title,department,active) values('INV-'||v_inv.id::text,v_inv.full_name,v_inv.job_title,v_inv.department,false) returning id into v_staff;
 insert into public.profiles(auth_user_id,full_name,role,is_active,staff_id) values(p_user,v_inv.full_name,'staff',false,v_staff);
 update public.staff_account_invitations set auth_user_id=p_user,staff_id=v_staff,status='pending' where id=v_inv.id;
 insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_state,reason) values(p_actor,v_actor.id,'staff_invitation_pending','staff_account_invitation',v_inv.id::text,'{"role":"staff","status":"pending"}','Auth invitation accepted; delivery unconfirmed');
end $$;

create function public.staff_account_review(p_actor uuid,p_invitation uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_actor public.profiles;
begin
 select * into v_actor from public.profiles where auth_user_id=p_actor and is_active and role in ('super_admin','administrator');
 if v_actor.id is null then raise exception 'staff_account_forbidden' using errcode='42501';end if;
 update public.staff_account_invitations set status='needs_review' where id=p_invitation and invited_by=v_actor.id and status='sending';
end $$;

create function public.staff_account_activate(p_user uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_inv public.staff_account_invitations;v_profile public.profiles;
begin
 select * into v_inv from public.staff_account_invitations where auth_user_id=p_user for update;
 if v_inv.id is null or v_inv.status<>'pending' then raise exception 'invalid_invitation_state';end if;
 if not exists(select 1 from auth.users where id=p_user and lower(email)=v_inv.email and email_confirmed_at is not null and length(encrypted_password)>0) then raise exception 'invitation_not_verified';end if;
 select * into v_profile from public.profiles where auth_user_id=p_user and staff_id=v_inv.staff_id and role='staff' and not is_active for update;
 if v_profile.id is null then raise exception 'invitation_identity_mismatch';end if;
 update public.profiles set is_active=true,updated_at=now() where id=v_profile.id;
 update public.staff set active=true where id=v_inv.staff_id;
 update public.staff_account_invitations set status='active',accepted_at=now() where id=v_inv.id;
 insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_state,reason) values(p_user,v_profile.id,'staff_invitation_accepted','staff_account_invitation',v_inv.id::text,'{"role":"staff","status":"active"}','Email verified and personal password set');
end $$;
revoke all on function public.staff_account_reserve(uuid,text,text,text,text),public.staff_account_finish(uuid,uuid,uuid),public.staff_account_review(uuid,uuid),public.staff_account_activate(uuid) from public,anon,authenticated;
grant execute on function public.staff_account_reserve(uuid,text,text,text,text),public.staff_account_finish(uuid,uuid,uuid),public.staff_account_review(uuid,uuid),public.staff_account_activate(uuid) to service_role;
