-- Client Welfare: GraceFlow Ask for Support / My Requests
-- Server-authoritative lifecycle with relationship-scoped staff access and immutable audit evidence.

create table if not exists public.client_support_requests (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.clients(id) on delete cascade,
 category text not null check (category in ('recovery_support','practical_support','family','appointment','aftercare','other')),
 subject text not null check (char_length(subject) between 3 and 160),
 detail text not null check (char_length(detail) between 3 and 4000),
 priority text not null default 'routine' check (priority in ('routine','high')),
 status text not null default 'submitted' check (status in ('submitted','assigned','acknowledged','in_progress','resolved','closed')),
 assigned_staff_id uuid references public.staff(id) on delete set null,
 workflow_instance_id uuid references public.workflow_instances(id) on delete set null,
 acknowledged_at timestamptz,
 resolved_at timestamptz,
 resolution_summary text,
 sla_due_at timestamptz not null default (now()+interval '24 hours'),
 escalated_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.client_support_request_events (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.client_support_requests(id) on delete cascade,
 event_type text not null,
 actor_profile_id uuid references public.profiles(id) on delete set null,
 actor_role text not null,
 from_status text,
 to_status text,
 note text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists client_support_requests_client_idx on public.client_support_requests(client_id,created_at desc);
create index if not exists client_support_requests_staff_idx on public.client_support_requests(assigned_staff_id,status,updated_at desc);
create index if not exists client_support_requests_sla_idx on public.client_support_requests(status,sla_due_at);
create index if not exists client_support_events_request_idx on public.client_support_request_events(request_id,created_at);

alter table public.client_support_requests enable row level security;
alter table public.client_support_request_events enable row level security;

create or replace function public.my_profile_id() returns uuid language sql stable security definer set search_path=public as $$
 select id from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1
$$;
create or replace function public.my_client_id() returns uuid language sql stable security definer set search_path=public as $$
 select client_id from public.profiles where auth_user_id=auth.uid() and is_active=true and role::text='client' limit 1
$$;
create or replace function public.my_staff_id() returns uuid language sql stable security definer set search_path=public as $$
 select staff_id from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1
$$;

create policy "support client self read" on public.client_support_requests for select
 using (client_id=public.my_client_id());
create policy "support assigned staff read" on public.client_support_requests for select
 using (
   public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director','case_manager')
   or exists(select 1 from public.client_team_assignments a where a.client_id=client_support_requests.client_id and a.staff_id=public.my_staff_id() and a.active=true and a.ended_at is null)
 );
create policy "support events client self read" on public.client_support_request_events for select
 using (exists(select 1 from public.client_support_requests r where r.id=request_id and r.client_id=public.my_client_id()));
create policy "support events staff read" on public.client_support_request_events for select
 using (exists(select 1 from public.client_support_requests r where r.id=request_id and (
   public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director','case_manager')
   or exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=public.my_staff_id() and a.active=true and a.ended_at is null)
 )));

-- No direct INSERT/UPDATE/DELETE policies: all mutations must use these GraceFlow RPCs.
create or replace function public.create_client_support_request(p_category text,p_subject text,p_detail text,p_priority text default 'routine')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_client uuid; v_profile uuid; v_id uuid; v_wf uuid;
begin
 v_client:=public.my_client_id(); v_profile:=public.my_profile_id();
 if v_client is null then raise exception 'CLIENT_AUTHORITY_REQUIRED'; end if;
 if p_category not in ('recovery_support','practical_support','family','appointment','aftercare','other') then raise exception 'INVALID_CATEGORY'; end if;
 if p_priority not in ('routine','high') then raise exception 'INVALID_PRIORITY'; end if;
 insert into public.workflow_instances(workflow_key,status,current_state,entity_type,entity_id)
 values('client_support_request','active','submitted','client_support_request',v_client) returning id into v_wf;
 insert into public.client_support_requests(client_id,category,subject,detail,priority,workflow_instance_id,sla_due_at)
 values(v_client,p_category,left(trim(p_subject),160),left(trim(p_detail),4000),p_priority,v_wf,now()+case when p_priority='high' then interval '4 hours' else interval '24 hours' end)
 returning id into v_id;
 update public.workflow_instances set entity_id=v_id,updated_at=now() where id=v_wf;
 insert into public.client_support_request_events(request_id,event_type,actor_profile_id,actor_role,to_status)
 values(v_id,'REQUEST_SUBMITTED',v_profile,'client','submitted');
 insert into public.audit_events(event_type,actor_id,actor_role,entity_type,entity_id,action,metadata)
 values('CLIENT_SUPPORT_REQUEST',v_profile,'client','client_support_request',v_id::text,'create',jsonb_build_object('category',p_category,'priority',p_priority));
 return v_id;
end $$;

create or replace function public.transition_client_support_request(p_request_id uuid,p_action text,p_note text default null,p_assign_staff_id uuid default null)
returns text language plpgsql security definer set search_path=public as $$
declare r public.client_support_requests%rowtype; v_profile uuid; v_staff uuid; v_role text; v_next text;
begin
 select * into r from public.client_support_requests where id=p_request_id for update;
 if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
 select id,staff_id,role::text into v_profile,v_staff,v_role from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
 if v_profile is null or not public.is_staff_user() then raise exception 'STAFF_AUTHORITY_REQUIRED'; end if;
 if v_role not in ('administrator','manager','super_admin','director','clinical_director','case_manager')
   and not exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=v_staff and a.active=true and a.ended_at is null)
 then raise exception 'CLIENT_RELATIONSHIP_REQUIRED'; end if;
 if p_action='assign' then
   if v_role not in ('administrator','manager','super_admin','director','clinical_director','case_manager') then raise exception 'ASSIGNMENT_AUTHORITY_REQUIRED'; end if;
   if p_assign_staff_id is null or not exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=p_assign_staff_id and a.active=true and a.ended_at is null) then raise exception 'INVALID_ASSIGNEE'; end if;
   v_next:='assigned';
 elsif p_action='acknowledge' and r.status in ('submitted','assigned') then v_next:='acknowledged';
 elsif p_action='start' and r.status in ('assigned','acknowledged') then v_next:='in_progress';
 elsif p_action='resolve' and r.status in ('acknowledged','in_progress') then
   if nullif(trim(p_note),'') is null then raise exception 'RESOLUTION_SUMMARY_REQUIRED'; end if; v_next:='resolved';
 elsif p_action='close' and r.status='resolved' then v_next:='closed';
 else raise exception 'INVALID_TRANSITION'; end if;
 update public.client_support_requests set status=v_next,
   assigned_staff_id=case when p_action='assign' then p_assign_staff_id else assigned_staff_id end,
   acknowledged_at=case when p_action='acknowledge' then now() else acknowledged_at end,
   resolved_at=case when p_action='resolve' then now() else resolved_at end,
   resolution_summary=case when p_action='resolve' then left(trim(p_note),2000) else resolution_summary end,
   updated_at=now() where id=p_request_id;
 update public.workflow_instances set current_state=v_next,status=case when v_next='closed' then 'completed' else status end,updated_at=now() where id=r.workflow_instance_id;
 insert into public.client_support_request_events(request_id,event_type,actor_profile_id,actor_role,from_status,to_status,note,metadata)
 values(p_request_id,upper(p_action),v_profile,v_role,r.status,v_next,left(p_note,2000),jsonb_build_object('assigned_staff_id',p_assign_staff_id));
 insert into public.audit_events(event_type,actor_id,actor_role,entity_type,entity_id,action,metadata)
 values('CLIENT_SUPPORT_REQUEST',v_profile,v_role,'client_support_request',p_request_id::text,p_action,jsonb_build_object('from',r.status,'to',v_next));
 return v_next;
end $$;

create or replace function public.escalate_overdue_client_support_requests()
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 with changed as (
   update public.client_support_requests set escalated_at=coalesce(escalated_at,now()),priority='high',updated_at=now()
   where status not in ('resolved','closed') and sla_due_at<now() and escalated_at is null returning id,workflow_instance_id
 )
 insert into public.client_support_request_events(request_id,event_type,actor_role,note)
 select id,'SLA_ESCALATED','system','GraceFlow SLA escalation' from changed;
 get diagnostics n=row_count;
 return n;
end $$;

revoke all on function public.create_client_support_request(text,text,text,text) from public;
revoke all on function public.transition_client_support_request(uuid,text,text,uuid) from public;
revoke all on function public.escalate_overdue_client_support_requests() from public;
grant execute on function public.create_client_support_request(text,text,text,text) to authenticated;
grant execute on function public.transition_client_support_request(uuid,text,text,uuid) to authenticated;

insert into public.workflow_definitions(workflow_key,module,name,description,state_machine,sla_rules)
values('client_support_request','care','Client Support Request','Client welfare request from submission through accountable resolution',
'{"states":["submitted","assigned","acknowledged","in_progress","resolved","closed"],"server_authoritative":true}',
'{"routine_first_response_hours":24,"high_first_response_hours":4,"escalate_overdue":true}')
on conflict(workflow_key) do update set state_machine=excluded.state_machine,sla_rules=excluded.sla_rules,updated_at=now();
