create table public.grace_model_quota (
 bucket text primary key,
 window_start timestamptz not null,
 used integer not null check (used >= 0)
);
alter table public.grace_model_quota enable row level security;
revoke all on public.grace_model_quota from public,anon,authenticated;
grant select,insert,update,delete on public.grace_model_quota to service_role;

create function public.consume_grace_model_quota(p_key text) returns boolean
language plpgsql security invoker set search_path=public as $$
declare total integer; personal integer;
begin
 if p_key is null or p_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid quota key'; end if;
 perform pg_advisory_xact_lock(762910528);
 delete from public.grace_model_quota where window_start < now()-interval '2 hours';
 insert into public.grace_model_quota(bucket,window_start,used)
 values('global',date_trunc('hour',now()),0),(p_key,date_trunc('hour',now()),0)
 on conflict(bucket) do update set
 used=case when grace_model_quota.window_start < date_trunc('hour',now()) then 0 else grace_model_quota.used end,
 window_start=date_trunc('hour',now());
 select used into total from public.grace_model_quota where bucket='global';
 select used into personal from public.grace_model_quota where bucket=p_key;
 if total >= 500 or personal >= 30 then return false; end if;
 update public.grace_model_quota set used=used+1 where bucket in ('global',p_key);
 return true;
end $$;
revoke all on function public.consume_grace_model_quota(text) from public,anon,authenticated;
grant execute on function public.consume_grace_model_quota(text) to service_role;

alter table public.grace_action_commands add column request_fingerprint text;
alter table public.grace_action_commands add column result_receipt jsonb;
grant select,insert,update on public.grace_action_commands to service_role;
create function public.create_grace_request_atomic(
 p_key text,p_fingerprint text,p_actor uuid,p_mode text,p_action text,
 p_contact jsonb,p_note text
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare existing public.grace_action_commands%rowtype;
 request_id uuid:=gen_random_uuid(); flow_id uuid; task_id uuid; receipt jsonb;
begin
 if p_key is null or p_key !~ '^[a-f0-9]{64}$'
 or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$'
 or p_mode is null or p_mode not in ('PUBLIC','CLIENT','FAMILY','STAFF','AFTERCARE')
 or p_action is null or p_action not in ('request_callback','admissions_contact','family_support_contact','appointment_request','aftercare_contact')
 or p_contact is null or jsonb_typeof(p_contact)<>'object'
 or coalesce(length(p_contact->>'name'),0)>120
 or coalesce(length(p_contact->>'phone'),0)>40
 or coalesce(length(p_contact->>'email'),0)>160
 or (coalesce(p_contact->>'phone','')='' and coalesce(p_contact->>'email','')='')
 or coalesce(length(p_note),0)>500
 then raise exception 'invalid request'; end if;
 perform pg_advisory_xact_lock(762910529);
 select * into existing from public.grace_action_commands where idempotency_key=p_key;
 if found then
   if existing.request_fingerprint is distinct from p_fingerprint or existing.actor_profile_id is distinct from p_actor
   then raise exception 'conflicting retry'; end if;
   if existing.result_receipt is null then raise exception 'request unavailable'; end if;
   return existing.result_receipt;
 end if;
 if (select count(*) from public.grace_action_commands where created_at>now()-interval '1 hour')>=100
 then raise exception 'request quota reached'; end if;
 insert into public.workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata)
 values(case p_action when 'request_callback' then 'grace_callback' when 'admissions_contact' then 'grace_admissions_contact'
 when 'family_support_contact' then 'grace_family_support' when 'appointment_request' then 'grace_appointment_request'
 else 'grace_aftercare_contact' end,'grace_request',request_id,'requested','active',
 jsonb_build_object('source','grace','action',p_action,'consent',true,'contact',p_contact,'actor_profile_id',p_actor))
 returning id into flow_id;
 insert into public.workflow_tasks(workflow_instance_id,task_type,title,assigned_role,status,payload)
 values(flow_id,p_action,'Review confidential Grace support request','admissions','queued',
 jsonb_build_object('request_id',request_id,'contact',p_contact,'note',p_note,'consent',true))
 returning id into task_id;
 insert into public.workflow_events(workflow_instance_id,event_type,source_channel,actor_type,summary,metadata)
 values(flow_id,'grace.request_created','grace','assistant','Support request submitted with confirmation',
 jsonb_build_object('action',p_action,'consent_version','grace-request-v1'));
 insert into public.audit_log(action,entity_type,entity_id,reason)
 values('graceflow.request_created','grace_request',request_id::text,'Explicit contact consent');
 receipt:=jsonb_build_object('confirmed',true,'requestId',request_id,'status','submitted','deliveryStatus','queued',
 'message','Your request is submitted for team review. This does not confirm an appointment or that a team member has read it.');
 insert into public.grace_action_commands(idempotency_key,command_id,actor_profile_id,actor_mode,action,status,
 workflow_instance_id,confirmed_at,request_fingerprint,result_receipt)
 values(p_key,request_id,p_actor,p_mode,p_action,'confirmed',flow_id,now(),p_fingerprint,receipt);
 return receipt;
end $$;
revoke all on function public.create_grace_request_atomic(text,text,uuid,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_grace_request_atomic(text,text,uuid,text,text,jsonb,text) to service_role;
