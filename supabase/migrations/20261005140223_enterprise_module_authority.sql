-- Explicit enterprise assignments; no operational users are granted access here.
create schema if not exists private;
create table private.enterprise_assignments (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id),
 module text not null check (module in ('purchase','inventory','hr','helpdesk','timesheets','project','crm','sign','accounting','discuss','documents','field-service','email-marketing')),
 action text not null check (action in ('read','create','edit','approve','execute','export')),
 record_id uuid references public.enterprise_records(id),
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 revoked_at timestamptz,
 decision_reference text not null check (length(trim(decision_reference))>0),
 check (ends_at is null or ends_at>starts_at)
);
create index enterprise_assignment_lookup on private.enterprise_assignments(profile_id,module,action);
alter table private.enterprise_assignments enable row level security;
revoke all on private.enterprise_assignments from public,anon,authenticated;

create or replace function private.enterprise_allowed(p_module text,p_action text,p_record uuid default null)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.profiles p join private.enterprise_assignments a on a.profile_id=p.id
  left join public.enterprise_records r on r.id=p_record
  where p.auth_user_id=auth.uid() and p.is_active and p.staff_id is not null
   and p.role::text not in ('client','family')
   and a.module=p_module and a.action=p_action
   and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now()) and a.revoked_at is null
   -- Execution adapters and approval thresholds are not yet configured.
   and p_action not in ('execute','approve')
   and (p_record is null or (r.module=p_module and
    (a.record_id=p_record or (a.record_id is null and r.owner_staff_id=p.staff_id))))
   and (p_action<>'create' or a.record_id is null)
 );
$$;
revoke all on function private.enterprise_allowed(text,text,uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.enterprise_allowed(text,text,uuid) to authenticated;
create or replace function public.enterprise_authority(p_module text,p_action text,p_record uuid default null)
returns boolean language sql stable security invoker set search_path='' as $$
 select private.enterprise_allowed(p_module,p_action,p_record);
$$;
revoke all on function public.enterprise_authority(text,text,uuid) from public,anon;
grant execute on function public.enterprise_authority(text,text,uuid) to authenticated;

create policy enterprise_assignment_read_guard on public.enterprise_records as restrictive
 for select to authenticated using (private.enterprise_allowed(module,'read',id));
create policy enterprise_no_direct_insert on public.enterprise_records as restrictive
 for insert to authenticated with check (false);
create policy enterprise_no_direct_update on public.enterprise_records as restrictive
 for update to authenticated using (false) with check (false);
create policy enterprise_no_direct_delete on public.enterprise_records as restrictive
 for delete to authenticated using (false);

create or replace function private.enterprise_record_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  if not private.enterprise_allowed(new.module,'create',null) or not exists
   (select 1 from public.profiles p where p.auth_user_id=auth.uid() and p.is_active and p.staff_id=new.owner_staff_id and p.staff_id=new.requester_staff_id)
  then raise exception 'enterprise_authority_denied' using errcode='42501'; end if;
 elsif tg_op='UPDATE' then
  if new.module<>old.module or new.owner_staff_id is distinct from old.owner_staff_id
   or new.requester_staff_id is distinct from old.requester_staff_id
   or new.status is distinct from old.status or not private.enterprise_allowed(old.module,'edit',old.id)
  then raise exception 'enterprise_authority_denied' using errcode='42501'; end if;
 else raise exception 'enterprise_authority_denied' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function private.enterprise_record_guard() from public,anon,authenticated;
create trigger enterprise_record_authority before insert or update or delete on public.enterprise_records
 for each row execute function private.enterprise_record_guard();

create or replace function private.enterprise_workflow_allowed(p_workflow uuid,p_action text)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select case when w.entity_type='enterprise_record'
  then exists(select 1 from public.enterprise_records r where r.id=w.entity_id
   and private.enterprise_allowed(r.module,p_action,r.id)) else true end
  from public.workflow_instances w where w.id=p_workflow),false);
$$;
revoke all on function private.enterprise_workflow_allowed(uuid,text) from public,anon;
grant execute on function private.enterprise_workflow_allowed(uuid,text) to authenticated;
create policy enterprise_flow_read_guard on public.workflow_instances as restrictive
 for select to authenticated using (private.enterprise_workflow_allowed(id,'read'));
create policy enterprise_flow_update_guard on public.workflow_instances as restrictive
 for update to authenticated using (entity_type<>'enterprise_record') with check (entity_type<>'enterprise_record');
create policy enterprise_flow_insert_guard on public.workflow_instances as restrictive
 for insert to authenticated with check (entity_type<>'enterprise_record');
create policy enterprise_flow_delete_guard on public.workflow_instances as restrictive
 for delete to authenticated using (entity_type<>'enterprise_record');

do $$ declare t text;begin
 foreach t in array array['workflow_tasks','workflow_events','workflow_approvals'] loop
  execute format('create policy enterprise_related_read_guard on public.%I as restrictive for select to authenticated using (workflow_instance_id is null or private.enterprise_workflow_allowed(workflow_instance_id,''read''))',t);
  execute format('create policy enterprise_related_insert_guard on public.%I as restrictive for insert to authenticated with check (workflow_instance_id is null or exists(select 1 from public.workflow_instances w where w.id=workflow_instance_id and w.entity_type<>''enterprise_record''))',t);
  execute format('create policy enterprise_related_update_guard on public.%I as restrictive for update to authenticated using (workflow_instance_id is null or exists(select 1 from public.workflow_instances w where w.id=workflow_instance_id and w.entity_type<>''enterprise_record'')) with check (workflow_instance_id is null or exists(select 1 from public.workflow_instances w where w.id=workflow_instance_id and w.entity_type<>''enterprise_record''))',t);
  execute format('create policy enterprise_related_delete_guard on public.%I as restrictive for delete to authenticated using (workflow_instance_id is null or exists(select 1 from public.workflow_instances w where w.id=workflow_instance_id and w.entity_type<>''enterprise_record''))',t);
 end loop;
end $$;
create policy enterprise_comment_read_guard on public.enterprise_comments as restrictive
 for select to authenticated using (exists(select 1 from public.enterprise_records r where r.id=record_id and private.enterprise_allowed(r.module,'read',r.id)));
create policy enterprise_comment_update_guard on public.enterprise_comments as restrictive
 for update to authenticated using (exists(select 1 from public.enterprise_records r where r.id=record_id and private.enterprise_allowed(r.module,'edit',r.id)))
 with check (exists(select 1 from public.enterprise_records r where r.id=record_id and private.enterprise_allowed(r.module,'edit',r.id)));

create or replace function public.create_enterprise_record(p_module text,p_type text,p_title text,p_priority text default 'routine',p_amount numeric default null,p_due timestamptz default null,p_details text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles; r public.enterprise_records; w uuid;
begin
 select * into p from public.profiles where auth_user_id=auth.uid() and is_active for share;
 if p.id is null or not private.enterprise_allowed(p_module,'create',null)
 then raise exception 'enterprise_authority_denied' using errcode='42501'; end if;
 if p_title is null or length(trim(p_title)) not between 1 and 160 or length(coalesce(p_details,''))>3000
  or p_priority not in ('routine','high','urgent') or p_amount<0 or p_amount::text in ('NaN','Infinity','-Infinity')
  or not (case p_module
   when 'purchase' then p_type=any(array['purchase_request','purchase_order','vendor'])
   when 'inventory' then p_type=any(array['inventory_item','stock_receipt','stock_issue','stock_transfer'])
   when 'hr' then p_type=any(array['employee','leave_request','recruitment','onboarding'])
   when 'helpdesk' then p_type=any(array['ticket','service_request','incident'])
   when 'timesheets' then p_type=any(array['timesheet','time_entry'])
   when 'project' then p_type=any(array['project','project_task','milestone'])
   when 'crm' then p_type=any(array['lead','opportunity','organisation','activity'])
   when 'sign' then p_type=any(array['signature_request','signature_template'])
   when 'accounting' then p_type=any(array['bill','expense','journal','payment_request'])
   when 'discuss' then p_type=any(array['channel','thread','discussion'])
   when 'documents' then p_type=any(array['document','policy','procedure'])
   when 'field-service' then p_type=any(array['work_order','service_visit','asset_service'])
   when 'email-marketing' then p_type=any(array['campaign','audience','email_asset']) else false end)
 then raise exception 'invalid_enterprise_record' using errcode='22023'; end if;
 insert into public.enterprise_records(module,record_type,reference,title,priority,owner_staff_id,requester_staff_id,amount,currency,due_at,data)
 values(p_module,p_type,'LHG-'||gen_random_uuid()::text,trim(p_title),p_priority,p.staff_id,p.staff_id,p_amount,'KES',p_due,
  jsonb_build_object('details',coalesce(p_details,''),'created_by_role',p.role,'source','staff_portal')) returning * into r;
 insert into public.workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata)
 values(p_module||'_'||p_type,'enterprise_record',r.id,'created','active',jsonb_build_object('module',p_module,'record_type',p_type,'source','staff_portal')) returning id into w;
 insert into public.workflow_events(workflow_instance_id,event_type,source_channel,actor_type,actor_id,summary,metadata)
 values(w,'record_created','staff_portal','staff',p.staff_id,'Enterprise record created',jsonb_build_object('module',p_module,'record_id',r.id));
 insert into public.workflow_tasks(workflow_instance_id,task_type,title,assigned_staff_id,status,due_at,payload)
 values(w,p_module||'_review','Review enterprise record',p.staff_id,'queued',p_due,jsonb_build_object('record_id',r.id,'module',p_module));
 insert into public.audit_log(action,entity_type,entity_id,actor_profile_id,after_state,reason)
 values('enterprise_record_created','enterprise_record',r.id,p.id,jsonb_build_object('module',p_module,'status','new'),'Authorised transactional enterprise creation');
 return jsonb_build_object('ok',true,'record',to_jsonb(r),'workflow_id',w);
end;
$$;
revoke all on function public.create_enterprise_record(text,text,text,text,numeric,timestamptz,text) from public,anon,service_role;
grant execute on function public.create_enterprise_record(text,text,text,text,numeric,timestamptz,text) to authenticated;

create policy enterprise_comment_insert_guard on public.enterprise_comments as restrictive
 for insert to authenticated with check (exists(select 1 from public.enterprise_records r where r.id=record_id and private.enterprise_allowed(r.module,'edit',r.id)));
create policy enterprise_comment_delete_guard on public.enterprise_comments as restrictive
 for delete to authenticated using (exists(select 1 from public.enterprise_records r where r.id=record_id and private.enterprise_allowed(r.module,'edit',r.id)));

-- Stop privileged generic engines/RPCs from completing unconfigured enterprise work.
create function private.enterprise_flow_mutation_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  if new.entity_type='enterprise_record' and not exists
   (select 1 from public.enterprise_records r where r.id=new.entity_id and private.enterprise_allowed(r.module,'create',r.id))
  then raise exception 'enterprise_authority_denied' using errcode='42501'; end if;
  return new;
 end if;
 if old.entity_type='enterprise_record' or (tg_op='UPDATE' and new.entity_type='enterprise_record')
 then raise exception 'enterprise_execution_unconfigured' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;return new;
end;
$$;
revoke all on function private.enterprise_flow_mutation_guard() from public,anon,authenticated;
create trigger enterprise_flow_mutation_authority before insert or update or delete on public.workflow_instances
 for each row execute function private.enterprise_flow_mutation_guard();
create function private.enterprise_related_mutation_guard()
returns trigger language plpgsql security definer set search_path='' as $$
declare wid uuid;begin
 if tg_op='DELETE' then wid=old.workflow_instance_id;else wid=new.workflow_instance_id;end if;
 if exists(select 1 from public.workflow_instances w where w.id=wid and w.entity_type='enterprise_record') then
  if tg_op<>'INSERT' or not private.enterprise_workflow_allowed(wid,'create')
  then raise exception 'enterprise_execution_unconfigured' using errcode='42501'; end if;
 end if;
 if tg_op='UPDATE' and old.workflow_instance_id is distinct from new.workflow_instance_id and exists
  (select 1 from public.workflow_instances w where w.id=old.workflow_instance_id and w.entity_type='enterprise_record')
 then raise exception 'enterprise_authority_denied' using errcode='42501';end if;
 if tg_op='DELETE' then return old;end if;return new;
end;
$$;
revoke all on function private.enterprise_related_mutation_guard() from public,anon,authenticated;
do $$declare t text;begin
 foreach t in array array['workflow_tasks','workflow_events','workflow_approvals'] loop
  execute format('create trigger enterprise_related_mutation_authority before insert or update or delete on public.%I for each row execute function private.enterprise_related_mutation_guard()',t);
 end loop;
end $$;
