-- Auth is deliberately not exposed to service_role SQL. Narrow internal predicates,
-- not a broad grant on auth.users, support the service-only invitation transaction.
create schema if not exists lhg_account_private;
revoke all on schema lhg_account_private from public,anon,authenticated;
grant usage on schema lhg_account_private to service_role;
create function lhg_account_private.auth_matches(p_user uuid,p_email text,p_state text) returns boolean
language sql stable security definer set search_path=pg_catalog,pg_temp as $$
 select exists(select 1 from auth.users where lower(email)=lower(trim(p_email))
 and (p_user is null or id=p_user)
 and case p_state when 'exists' then true when 'invited' then invited_at is not null
 when 'verified' then email_confirmed_at is not null and length(encrypted_password)>0 else false end);
$$;
revoke all on function lhg_account_private.auth_matches(uuid,text,text) from public,anon,authenticated;
grant execute on function lhg_account_private.auth_matches(uuid,text,text) to service_role;
do $$
declare v text;
begin
 v:=pg_get_functiondef('public.staff_account_reserve(uuid,text,text,text,text)'::regprocedure);
 v:=replace(v,'exists(select 1 from auth.users where lower(email)=lower(trim(p_email)))', 'lhg_account_private.auth_matches(null,p_email,''exists'')');execute v;
 v:=pg_get_functiondef('public.staff_account_finish(uuid,uuid,uuid)'::regprocedure);
 v:=replace(v,'exists(select 1 from auth.users where id=p_user and lower(email)=v_inv.email and invited_at is not null)', 'lhg_account_private.auth_matches(p_user,v_inv.email,''invited'')');execute v;
 v:=pg_get_functiondef('public.staff_account_activate(uuid)'::regprocedure);
 v:=replace(v,'exists(select 1 from auth.users where id=p_user and lower(email)=v_inv.email and email_confirmed_at is not null and length(encrypted_password)>0)', 'lhg_account_private.auth_matches(p_user,v_inv.email,''verified'')');execute v;
end $$;
