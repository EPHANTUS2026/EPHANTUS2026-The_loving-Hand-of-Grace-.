-- GraceFlow runtime integrity hardening.
-- Align terminal workflow engine state and make scheduler lease acquisition atomic.

create or replace function public.acquire_graceflow_engine_lease(p_holder text,p_ttl_seconds integer default 240)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_now timestamptz:=clock_timestamp(); v_rows integer;
begin
 if nullif(btrim(coalesce(p_holder,'')),'') is null then raise exception 'LEASE_HOLDER_REQUIRED'; end if;
 if p_ttl_seconds < 30 or p_ttl_seconds > 900 then raise exception 'INVALID_LEASE_TTL'; end if;
 insert into public.graceflow_engine_leases(lease_key,holder,acquired_at,expires_at)
 values('main',p_holder,v_now,v_now+make_interval(secs=>p_ttl_seconds))
 on conflict (lease_key) do update set holder=excluded.holder,acquired_at=excluded.acquired_at,expires_at=excluded.expires_at
 where public.graceflow_engine_leases.expires_at<=v_now;
 get diagnostics v_rows=row_count;
 return v_rows=1;
end $$;
revoke all on function public.acquire_graceflow_engine_lease(text,integer) from public,anon,authenticated;

update public.workflow_instances
set engine_status='completed',engine_cursor=null,next_wake_at=null,updated_at=now()
where status='completed' and engine_status is distinct from 'completed';

create or replace function public.enforce_graceflow_terminal_engine_state()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='completed' then new.engine_status:='completed'; new.engine_cursor:=null; new.next_wake_at:=null; end if;
 return new;
end $$;
drop trigger if exists workflow_terminal_engine_state on public.workflow_instances;
create trigger workflow_terminal_engine_state before insert or update of status,engine_status,engine_cursor,next_wake_at on public.workflow_instances
for each row execute function public.enforce_graceflow_terminal_engine_state();
revoke all on function public.enforce_graceflow_terminal_engine_state() from public,anon,authenticated;
