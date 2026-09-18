-- Route every client support request into GraceFlow with relationship-aware assignment.
create or replace function public.create_client_support_request(p_request_type text,p_subject text,p_details text default null)
returns public.client_support_requests language plpgsql security definer set search_path=public,pg_temp as $$
declare v_client uuid;v_row public.client_support_requests;v_profile uuid;v_staff uuid;v_role public.user_role;v_workflow uuid;
begin
 v_client:=public.current_client_id();if v_client is null then raise exception 'Client identity required';end if;
 select id into v_profile from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;
 if p_request_type not in ('COUNSELLOR','WELFARE','FAMILY_COMMUNICATION','FAMILY_MEETING','APPOINTMENT','DOCUMENT','SKILLS_TRAINING','REINTEGRATION','SPIRITUAL_SUPPORT','MEDICAL_ATTENTION','HOUSING_REINTEGRATION','AFTERCARE','FEEDBACK','COMPLAINT','GENERAL_SUPPORT') then raise exception 'Unsupported request type';end if;
 if length(trim(coalesce(p_subject,'')))<3 or length(p_subject)>160 then raise exception 'Subject must be 3-160 characters';end if;
 if length(coalesce(p_details,''))>4000 then raise exception 'Details too long';end if;
 v_role:=case when p_request_type='COUNSELLOR' then 'counsellor'::public.user_role when p_request_type in ('FAMILY_COMMUNICATION','FAMILY_MEETING') then 'family_liaison'::public.user_role when p_request_type='MEDICAL_ATTENTION' then 'nurse'::public.user_role when p_request_type='AFTERCARE' then 'aftercare_coordinator'::public.user_role when p_request_type in ('REINTEGRATION','HOUSING_REINTEGRATION','WELFARE') then 'case_manager'::public.user_role else 'staff'::public.user_role end;
 select a.staff_id into v_staff from public.client_team_assignments a join public.staff s on s.id=a.staff_id and s.active=true where a.client_id=v_client and a.active=true and (a.ended_at is null or a.ended_at>now()) order by case when lower(a.team_role)=replace(v_role::text,'_',' ') then 0 else 1 end,a.assigned_at asc limit 1;
 insert into public.workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata,engine_status) values('CLIENT_SUPPORT_REQUEST','client',v_client,'RECEIVED','active',jsonb_build_object('request_type',p_request_type,'requested_by_profile_id',v_profile),'ready') returning id into v_workflow;
 insert into public.client_support_requests(client_id,request_type,subject,details,workflow_instance_id,assigned_staff_id) values(v_client,p_request_type,trim(p_subject),nullif(trim(coalesce(p_details,'')),''),v_workflow,v_staff) returning * into v_row;
 insert into public.workflow_tasks(workflow_instance_id,task_type,title,assigned_role,assigned_staff_id,status,payload) values(v_workflow,'CLIENT_SUPPORT_TRIAGE','Triage client support request: '||trim(p_subject),v_role,v_staff,'queued',jsonb_build_object('support_request_id',v_row.id,'client_id',v_client,'request_type',p_request_type));
 insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_state,reason) values(auth.uid(),v_profile,'CLIENT_SUPPORT_REQUEST_CREATED','client_support_request',v_row.id::text,jsonb_build_object('client_id',v_client,'request_type',p_request_type,'status',v_row.status,'workflow_instance_id',v_workflow,'assigned_staff_id',v_staff),'Client requested support; GraceFlow workflow created');
 return v_row;
end$$;
revoke all on function public.create_client_support_request(text,text,text) from public;grant execute on function public.create_client_support_request(text,text,text) to authenticated;
