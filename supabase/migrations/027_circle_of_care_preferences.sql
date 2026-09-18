-- Client-visible consent controls for Circle of Care without exposing operational internals.
create table if not exists public.circle_of_care_preferences(
 client_id uuid primary key references public.clients(id) on delete cascade,
 show_assigned_team boolean not null default true,
 allow_family_support_visibility boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.circle_of_care_preferences enable row level security;
create policy "client own circle preferences read" on public.circle_of_care_preferences for select to authenticated using(client_id=public.current_client_id());
revoke insert,update,delete on public.circle_of_care_preferences from anon,authenticated;
create or replace function public.set_circle_of_care_preferences(p_show_assigned_team boolean,p_allow_family_support_visibility boolean)
returns public.circle_of_care_preferences language plpgsql security definer set search_path=public,pg_temp as $$
declare cid uuid;row public.circle_of_care_preferences;pid uuid;
begin cid:=public.current_client_id();if cid is null then raise exception 'Client identity required';end if;
select id into pid from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
insert into public.circle_of_care_preferences(client_id,show_assigned_team,allow_family_support_visibility,updated_at) values(cid,p_show_assigned_team,p_allow_family_support_visibility,now())
on conflict(client_id) do update set show_assigned_team=excluded.show_assigned_team,allow_family_support_visibility=excluded.allow_family_support_visibility,updated_at=now() returning * into row;
insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_state,reason) values(auth.uid(),pid,'CIRCLE_OF_CARE_PREFERENCES_CHANGED','client',cid::text,jsonb_build_object('show_assigned_team',p_show_assigned_team,'allow_family_support_visibility',p_allow_family_support_visibility),'Client changed Circle of Care visibility preferences');
return row;end$$;
revoke execute on function public.set_circle_of_care_preferences(boolean,boolean) from public,anon;
grant execute on function public.set_circle_of_care_preferences(boolean,boolean) to authenticated;
