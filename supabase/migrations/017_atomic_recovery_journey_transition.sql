-- Atomic, server-authoritative GraceFlow recovery journey transition boundary.
create or replace function public.transition_recovery_journey(
  p_admission_id uuid,
  p_to admission_stage,
  p_expected_from admission_stage,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a admissions%rowtype;
  v_profile profiles%rowtype;
  v_role user_role;
  v_flow workflow_instances%rowtype;
  v_now timestamptz := now();
  v_task_type text;
  v_task_title text;
  v_task_role user_role;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_profile from profiles where auth_user_id=auth.uid() and is_active=true limit 1;
  if v_profile.id is null then raise exception 'active_profile_required' using errcode='42501'; end if;
  v_role := v_profile.role;

  select * into v_a from admissions where id=p_admission_id for update;
  if v_a.id is null then raise exception 'admission_not_found' using errcode='P0002'; end if;
  if v_a.stage <> p_expected_from then raise exception 'stale_transition:%',v_a.stage using errcode='40001'; end if;

  if not (
    (v_a.stage='enquiry' and p_to='screening') or
    (v_a.stage='screening' and p_to='assessment') or
    (v_a.stage='assessment' and p_to='admission_ready') or
    (v_a.stage='admission_ready' and p_to='admitted') or
    (v_a.stage='admitted' and p_to='treatment') or
    (v_a.stage='treatment' and p_to='discharge') or
    (v_a.stage='discharge' and p_to='aftercare') or
    (v_a.stage='aftercare' and p_to='closed')
  ) then raise exception 'invalid_transition:%->%',v_a.stage,p_to using errcode='23514'; end if;

  if (p_to='screening' and v_role not in ('admissions','counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin'))
  or (p_to in ('assessment','admission_ready','admitted') and v_role not in ('admissions','clinician','clinical_director','doctor','psychologist','administrator','super_admin'))
  or (p_to='treatment' and v_role not in ('counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin'))
  or (p_to in ('discharge','aftercare','closed') and v_role not in ('clinician','clinical_director','doctor','psychologist','administrator','super_admin'))
  then raise exception 'transition_role_forbidden' using errcode='42501'; end if;

  if p_to='assessment' and nullif(btrim(v_a.screening_summary),'') is null then raise exception 'screening_summary_required' using errcode='23514'; end if;
  if p_to='admission_ready' and nullif(btrim(v_a.assessment_summary),'') is null then raise exception 'assessment_summary_required' using errcode='23514'; end if;
  if p_to='admitted' and v_a.client_id is null then raise exception 'linked_client_required' using errcode='23514'; end if;
  if p_to='treatment' and not exists(select 1 from care_plans where client_id=v_a.client_id and status='active') then raise exception 'active_care_plan_required' using errcode='23514'; end if;
  if p_to='discharge' and not exists(select 1 from discharge_plans where client_id=v_a.client_id and status in ('ready_for_review','approved','completed')) then raise exception 'discharge_plan_review_required' using errcode='23514'; end if;
  if p_to='aftercare' and not exists(select 1 from discharge_plans where client_id=v_a.client_id and status in ('approved','completed') and approved_by is not null and approved_at is not null) then raise exception 'clinical_discharge_approval_required' using errcode='23514'; end if;
  if p_to='aftercare' and not exists(select 1 from aftercare_plans where client_id=v_a.client_id) then raise exception 'aftercare_plan_required' using errcode='23514'; end if;
  if p_to='closed' and not exists(select 1 from aftercare_plans where client_id=v_a.client_id and status='completed') then raise exception 'completed_aftercare_required' using errcode='23514'; end if;

  update admissions set stage=p_to,updated_at=v_now where id=v_a.id;
  if v_a.client_id is not null then
    update clients set admission_stage=p_to,
      admission_date=case when p_to='admitted' then current_date else admission_date end,
      discharge_date=case when p_to='aftercare' then current_date else discharge_date end,
      updated_at=v_now where id=v_a.client_id;
  end if;

  select * into v_flow from workflow_instances where status='active' and
    ((entity_type='admission' and entity_id=v_a.id) or (v_a.client_id is not null and entity_type='client' and entity_id=v_a.client_id))
    order by case when entity_type='admission' then 0 else 1 end limit 1 for update;

  if v_flow.id is null then
    insert into workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata)
    values('recovery_journey','admission',v_a.id,p_to::text,case when p_to='closed' then 'completed' else 'active' end,
      jsonb_build_object('reference',v_a.reference,'client_id',v_a.client_id))
    returning * into v_flow;
  else
    update workflow_instances set current_state=p_to::text,status=case when p_to='closed' then 'completed' else 'active' end,
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('client_id',v_a.client_id),updated_at=v_now where id=v_flow.id returning * into v_flow;
  end if;

  update workflow_tasks set status='completed',completed_at=v_now
    where workflow_instance_id=v_flow.id and status in ('queued','active','blocked');

  select x.task_type,x.title,x.role into v_task_type,v_task_title,v_task_role from (values
    ('screening','admissions_screening','Complete screening summary','admissions'::user_role),
    ('assessment','admissions_assessment','Complete assessment and programme recommendation','clinician'::user_role),
    ('admission_ready','admission_preparation','Confirm client record and prepare admission','admissions'::user_role),
    ('admitted','care_plan','Create active care plan','counsellor'::user_role),
    ('treatment','care_delivery','Deliver care plan, sessions and scheduled reviews','counsellor'::user_role),
    ('discharge','discharge_handoff','Complete discharge handoff and aftercare plan','clinician'::user_role),
    ('aftercare','aftercare_followup','Run aftercare reviews and follow-up cadence','counsellor'::user_role)
  ) x(state,task_type,title,role) where x.state=p_to::text;
  if v_task_type is not null then insert into workflow_tasks(workflow_instance_id,task_type,title,assigned_role,status,payload)
    values(v_flow.id,v_task_type,v_task_title,v_task_role,'queued',jsonb_build_object('admission_id',v_a.id,'client_id',v_a.client_id,'state',p_to)); end if;

  insert into audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_state,after_state,reason)
  values(auth.uid(),v_profile.id,'graceflow_transition','admission',v_a.id::text,jsonb_build_object('stage',v_a.stage),jsonb_build_object('stage',p_to),
    left(coalesce(nullif(btrim(p_reason),''),'Approved workflow transition'),500));

  return jsonb_build_object('ok',true,'admission_id',v_a.id,'from',v_a.stage,'to',p_to,'workflow_instance_id',v_flow.id);
end $$;
revoke all on function public.transition_recovery_journey(uuid,admission_stage,admission_stage,text) from public, anon;
grant execute on function public.transition_recovery_journey(uuid,admission_stage,admission_stage,text) to authenticated;
