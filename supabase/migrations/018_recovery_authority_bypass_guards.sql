-- Make recovery lifecycle state and audit evidence server-authoritative.
-- Generic GraceFlow automation remains writable by its server engine; recovery_journey rows are protected.

create or replace function public.guard_recovery_authority_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres','service_role') then return new; end if;
  if tg_table_name='admissions' and new.stage is distinct from old.stage then
    raise exception 'recovery_stage_requires_journey_authority' using errcode='42501';
  elsif tg_table_name='clients' and (
    new.admission_stage is distinct from old.admission_stage or
    new.admission_date is distinct from old.admission_date or
    new.discharge_date is distinct from old.discharge_date
  ) then
    raise exception 'client_lifecycle_requires_journey_authority' using errcode='42501';
  elsif tg_table_name='workflow_instances' and old.workflow_key='recovery_journey' and (
    new.current_state is distinct from old.current_state or new.status is distinct from old.status
  ) then
    raise exception 'recovery_workflow_state_requires_journey_authority' using errcode='42501';
  end if;
  return new;
end $$;

drop trigger if exists admissions_recovery_authority_guard on public.admissions;
create trigger admissions_recovery_authority_guard before update on public.admissions
for each row execute function public.guard_recovery_authority_columns();

drop trigger if exists clients_recovery_authority_guard on public.clients;
create trigger clients_recovery_authority_guard before update on public.clients
for each row execute function public.guard_recovery_authority_columns();

drop trigger if exists workflow_instances_recovery_authority_guard on public.workflow_instances;
create trigger workflow_instances_recovery_authority_guard before update on public.workflow_instances
for each row execute function public.guard_recovery_authority_columns();

-- Recovery journey tasks may only be mutated by trusted server authority.
create or replace function public.guard_recovery_task_authority()
returns trigger language plpgsql set search_path=public as $$
declare v_key text;
begin
  if current_user in ('postgres','service_role') then return coalesce(new,old); end if;
  select workflow_key into v_key from workflow_instances where id=coalesce(new.workflow_instance_id,old.workflow_instance_id);
  if v_key='recovery_journey' then raise exception 'recovery_task_requires_server_authority' using errcode='42501'; end if;
  return coalesce(new,old);
end $$;
drop trigger if exists workflow_tasks_recovery_authority_guard on public.workflow_tasks;
create trigger workflow_tasks_recovery_authority_guard before insert or update or delete on public.workflow_tasks
for each row execute function public.guard_recovery_task_authority();

-- Audit evidence is append-only for application identities.
create or replace function public.guard_audit_immutability()
returns trigger language plpgsql set search_path=public as $$
begin
  if current_user in ('postgres','service_role') then return coalesce(new,old); end if;
  raise exception 'audit_evidence_is_immutable' using errcode='42501';
end $$;
drop trigger if exists audit_log_immutable_guard on public.audit_log;
create trigger audit_log_immutable_guard before update or delete on public.audit_log
for each row execute function public.guard_audit_immutability();

revoke execute on function public.guard_recovery_authority_columns() from public, anon, authenticated;
revoke execute on function public.guard_recovery_task_authority() from public, anon, authenticated;
revoke execute on function public.guard_audit_immutability() from public, anon, authenticated;
