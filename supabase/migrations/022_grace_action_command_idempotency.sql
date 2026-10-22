-- GRACE-5 hardening: database-enforced idempotency for GraceFlow commands.
create table if not exists public.grace_action_commands (
 id uuid primary key default gen_random_uuid(),
 idempotency_key text not null unique,
 command_id uuid not null unique,
 actor_profile_id uuid references public.profiles(id) on delete set null,
 actor_mode text not null,
 action text not null,
 status text not null default 'reserved' check (status in ('reserved','confirmed','failed')),
 workflow_instance_id uuid references public.workflow_instances(id) on delete set null,
 created_at timestamptz not null default now(),
 confirmed_at timestamptz
);
alter table public.grace_action_commands enable row level security;
revoke all on public.grace_action_commands from public,anon,authenticated;

create or replace function public.reserve_grace_action_command(
 p_idempotency_key text,p_command_id uuid,p_actor_profile_id uuid,p_actor_mode text,p_action text
) returns table(command_id uuid,status text,workflow_instance_id uuid,replayed boolean)
language plpgsql security definer set search_path=public as $$
declare v public.grace_action_commands%rowtype;
begin
 if length(trim(coalesce(p_idempotency_key,''))) < 8 then raise exception 'invalid idempotency key'; end if;
 insert into public.grace_action_commands(idempotency_key,command_id,actor_profile_id,actor_mode,action)
 values(trim(p_idempotency_key),p_command_id,p_actor_profile_id,p_actor_mode,p_action)
 on conflict(idempotency_key) do nothing;
 select * into v from public.grace_action_commands where idempotency_key=trim(p_idempotency_key);
 return query select v.command_id,v.status,v.workflow_instance_id,(v.command_id<>p_command_id);
end $$;
revoke all on function public.reserve_grace_action_command(text,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_grace_action_command(text,uuid,uuid,text,text) to service_role;
