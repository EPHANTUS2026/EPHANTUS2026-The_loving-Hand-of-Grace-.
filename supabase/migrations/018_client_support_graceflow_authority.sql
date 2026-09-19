-- GraceFlow authority hardening aligned to canonical LHG staging schema.
-- Existing client_support_requests is authoritative. Browser mutations are denied; guarded RPCs own state changes.

alter table public.client_support_requests add column if not exists acknowledged_at timestamptz;
alter table public.client_support_requests drop constraint if exists client_support_requests_status_check;
alter table public.client_support_requests add constraint client_support_requests_status_check check(status in ('RECEIVED','TRIAGED','ACKNOWLEDGED','IN_PROGRESS','WAITING','RESOLVED','CLOSED'));

create table if not exists public.client_support_request_events(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.client_support_requests(id) on delete cascade,event_type text not null,actor_profile_id uuid references public.profiles(id) on delete set null,actor_role text not null,from_status text,to_status text,note text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index if not exists client_support_request_events_idx on public.client_support_request_events(request_id,created_at);
alter table public.client_support_request_events enable row level security;

drop policy if exists "support events client self read" on public.client_support_request_events;
create policy "support events client self read" on public.client_support_request_events for select to authenticated using(exists(select 1 from public.client_support_requests r where r.id=request_id and r.client_id=public.current_client_id()));
drop policy if exists "support events staff relationship read" on public.client_support_request_events;
create policy "support events staff relationship read" on public.client_support_request_events for select to authenticated using(exists(select 1 from public.client_support_requests r where r.id=request_id and (public.current_role()::text in ('administrator','manager','super_admin','director','clinical_director','case_manager') or exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=(public.current_profile()).staff_id and a.active=true and (a.ended_at is null or a.ended_at>now())))));

revoke insert,update,delete on public.client_support_requests from anon,authenticated;
revoke insert,update,delete on public.client_support_request_events from anon,authenticated;
grant select on public.client_support_requests,public.client_support_request_events to authenticated;

drop function if exists public.create_client_support_request(text,text,text);

create or replace function public.create_client_support_request(p_request_type text,p_subject text,p_details text default null,p_priority text default 'NORMAL') returns uuid language plpgsql security definer set search_path='' as $$
declare c uuid;p public.profiles;rid uuid;wid uuid;
begin
 if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
 select * into p from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;c:=p.client_id;
 if p.role::text<>'client' or c is null then raise exception 'CLIENT_AUTHORITY_REQUIRED';end if;
 if p_request_type not in ('COUNSELLOR','WELFARE','FAMILY_COMMUNICATION','FAMILY_MEETING','APPOINTMENT','DOCUMENT','SKILLS_TRAINING','REINTEGRATION','SPIRITUAL_SUPPORT','MEDICAL_ATTENTION','HOUSING_REINTEGRATION','AFTERCARE','FEEDBACK','COMPLAINT','GENERAL_SUPPORT') then raise exception 'INVALID_REQUEST_TYPE';end if;
 if p_priority not in ('NORMAL','HIGH','URGENT') then raise exception 'INVALID_PRIORITY';end if;
 if char_length(trim(coalesce(p_subject,'')))<3 or char_length(p_subject)>160 then raise exception 'INVALID_SUBJECT';end if;
 if char_length(coalesce(p_details,''))>4000 then raise exception 'DETAILS_TOO_LONG';end if;
 insert into public.workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata) values('client_support_request','client_support_request',c,'RECEIVED','active',jsonb_build_object('authority','GRACEFLOW')) returning id into wid;
 insert into public.client_support_requests(client_id,request_type,subject,details,status,client_visible_status,priority,workflow_instance_id,response_due_at) values(c,p_request_type,trim(p_subject),nullif(trim(coalesce(p_details,'')),''),'RECEIVED','RECEIVED',p_priority,wid,now()+case when p_priority='URGENT' then interval '1 hour' when p_priority='HIGH' then interval '4 hours' else interval '24 hours' end) returning id into rid;
 update public.workflow_instances set entity_id=rid where id=wid;
 insert into public.client_support_request_events(request_id,event_type,actor_profile_id,actor_role,to_status) values(rid,'REQUEST_SUBMITTED',p.id,'client','RECEIVED');
 insert into public.audit_events(event_type,actor_id,actor_role,entity_type,entity_id,action,metadata) values('CLIENT_SUPPORT_REQUEST',p.id,'client','client_support_request',rid::text,'create',jsonb_build_object('request_type',p_request_type,'priority',p_priority));
 return rid;
end $$;

create or replace function public.transition_client_support_request(p_request_id uuid,p_action text,p_note text default null,p_assign_staff_id uuid default null) returns text language plpgsql security definer set search_path='' as $$
declare r public.client_support_requests%rowtype;p public.profiles;nxt text;
begin
 if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED';end if;
 select * into p from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
 if p.id is null or not public.is_staff_user() then raise exception 'STAFF_AUTHORITY_REQUIRED';end if;
 select * into r from public.client_support_requests where id=p_request_id for update;if not found then raise exception 'REQUEST_NOT_FOUND';end if;
 if p.role::text not in ('administrator','manager','super_admin','director','clinical_director','case_manager') and not exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=p.staff_id and a.active=true and (a.ended_at is null or a.ended_at>now())) then raise exception 'CLIENT_RELATIONSHIP_REQUIRED';end if;
 if p_action='assign' then
  if p.role::text not in ('administrator','manager','super_admin','director','clinical_director','case_manager') then raise exception 'ASSIGNMENT_AUTHORITY_REQUIRED';end if;
  if p_assign_staff_id is null or not exists(select 1 from public.client_team_assignments a where a.client_id=r.client_id and a.staff_id=p_assign_staff_id and a.active=true and (a.ended_at is null or a.ended_at>now())) then raise exception 'INVALID_ASSIGNEE';end if;nxt:='TRIAGED';
 elsif p_action='acknowledge' and r.status in ('RECEIVED','TRIAGED') then nxt:='ACKNOWLEDGED';
 elsif p_action='start' and r.status in ('TRIAGED','ACKNOWLEDGED','WAITING') then nxt:='IN_PROGRESS';
 elsif p_action='wait' and r.status in ('ACKNOWLEDGED','IN_PROGRESS') then nxt:='WAITING';
 elsif p_action='resolve' and r.status in ('ACKNOWLEDGED','IN_PROGRESS','WAITING') then if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'RESOLUTION_SUMMARY_REQUIRED';end if;nxt:='RESOLVED';
 elsif p_action='close' and r.status='RESOLVED' then nxt:='CLOSED';
 else raise exception 'INVALID_TRANSITION';end if;
 update public.client_support_requests set status=nxt,client_visible_status=nxt,assigned_staff_id=case when p_action='assign' then p_assign_staff_id else assigned_staff_id end,acknowledged_at=case when p_action='acknowledge' then now() else acknowledged_at end,first_responded_at=case when p_action='acknowledge' then coalesce(first_responded_at,now()) else first_responded_at end,resolution_summary=case when p_action='resolve' then left(trim(p_note),2000) else resolution_summary end,updated_at=now() where id=p_request_id;
 update public.workflow_instances set current_state=nxt,status=case when nxt='CLOSED' then 'completed' else status end,updated_at=now() where id=r.workflow_instance_id;
 insert into public.client_support_request_events(request_id,event_type,actor_profile_id,actor_role,from_status,to_status,note,metadata) values(p_request_id,upper(p_action),p.id,p.role::text,r.status,nxt,left(p_note,2000),jsonb_build_object('assigned_staff_id',p_assign_staff_id));
 insert into public.audit_events(event_type,actor_id,actor_role,entity_type,entity_id,action,metadata) values('CLIENT_SUPPORT_REQUEST',p.id,p.role::text,'client_support_request',p_request_id::text,p_action,jsonb_build_object('from',r.status,'to',nxt));return nxt;
end $$;

create or replace function public.escalate_overdue_client_support_requests() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;begin with changed as(update public.client_support_requests set escalated_at=now(),escalation_reason='SLA_RESPONSE_OVERDUE',priority=case when priority='NORMAL' then 'HIGH' else priority end,updated_at=now() where status not in ('RESOLVED','CLOSED') and response_due_at<now() and escalated_at is null returning id),ev as(insert into public.client_support_request_events(request_id,event_type,actor_role,note) select id,'SLA_ESCALATED','system','GraceFlow SLA response escalation' from changed returning 1) select count(*) into n from ev;return n;end $$;

revoke all on function public.create_client_support_request(text,text,text,text) from public,anon;
revoke all on function public.transition_client_support_request(uuid,text,text,uuid) from public,anon;
revoke all on function public.escalate_overdue_client_support_requests() from public,anon,authenticated;
grant execute on function public.create_client_support_request(text,text,text,text) to authenticated;
grant execute on function public.transition_client_support_request(uuid,text,text,uuid) to authenticated;

insert into public.workflow_definitions(workflow_key,module,name,description,state_machine,sla_rules) values('client_support_request','care','Client Support Request','Client welfare request governed by GraceFlow','{"states":["RECEIVED","TRIAGED","ACKNOWLEDGED","IN_PROGRESS","WAITING","RESOLVED","CLOSED"],"server_authoritative":true}','{"normal_response_hours":24,"high_response_hours":4,"urgent_response_hours":1,"escalate_overdue":true}') on conflict(workflow_key) do update set state_machine=excluded.state_machine,sla_rules=excluded.sla_rules,updated_at=now();
