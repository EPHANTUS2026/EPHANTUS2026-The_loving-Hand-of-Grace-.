-- Staff support request authority: relationship scoped for care roles, management oversight for managers.
create policy "assigned staff support request read" on public.client_support_requests for select to authenticated using (
 public.current_role() in ('administrator','manager','super_admin')
 or exists(select 1 from public.client_team_assignments a where a.client_id=client_support_requests.client_id and a.staff_id=(public.current_profile()).staff_id and a.active=true and (a.ended_at is null or a.ended_at>now()))
);
create or replace function public.transition_client_support_request(p_request_id uuid,p_to text,p_resolution_summary text default null,p_follow_up_at timestamptz default null)
returns public.client_support_requests language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.client_support_requests;v_profile public.profiles;v_allowed boolean;v_from text;
begin
 select * into v_profile from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1;if v_profile.id is null then raise exception 'Active staff identity required';end if;
 select * into v from public.client_support_requests where id=p_request_id for update;if v.id is null then raise exception 'Request not found';end if;
 v_allowed:=v_profile.role in ('administrator','manager','super_admin') or exists(select 1 from public.client_team_assignments a where a.client_id=v.client_id and a.staff_id=v_profile.staff_id and a.active=true and (a.ended_at is null or a.ended_at>now()));
 if not v_allowed then raise exception 'Support request relationship authority required' using errcode='42501';end if;
 if p_to not in ('TRIAGED','IN_PROGRESS','WAITING','RESOLVED','CLOSED') then raise exception 'Unsupported transition';end if;
 v_from:=v.status;
 if v_from='RECEIVED' and p_to='TRIAGED' and v.first_responded_at is null then v.first_responded_at:=now();end if;
 if not ((v_from='RECEIVED' and p_to='TRIAGED') or (v_from='TRIAGED' and p_to in ('IN_PROGRESS','WAITING')) or (v_from in ('IN_PROGRESS','WAITING') and p_to in ('IN_PROGRESS','WAITING','RESOLVED')) or (v_from='RESOLVED' and p_to='CLOSED')) then raise exception 'Invalid support request transition % -> %',v_from,p_to;end if;
 if p_to='RESOLVED' and length(trim(coalesce(p_resolution_summary,'')))<3 then raise exception 'Resolution summary required';end if;
 update public.client_support_requests set status=p_to,client_visible_status=p_to,first_responded_at=case when v_from='RECEIVED' and p_to='TRIAGED' then coalesce(first_responded_at,now()) else first_responded_at end,resolution_summary=case when p_to='RESOLVED' then trim(p_resolution_summary) else resolution_summary end,follow_up_at=coalesce(p_follow_up_at,follow_up_at),assigned_staff_id=coalesce(assigned_staff_id,v_profile.staff_id),updated_at=now() where id=v.id returning * into v;
 update public.workflow_instances set current_state=p_to,status=case when p_to='CLOSED' then 'completed' else 'active' end,updated_at=now() where id=v.workflow_instance_id;
 update public.workflow_tasks set status=case when p_to in ('RESOLVED','CLOSED') then 'completed' else 'in_progress' end,assigned_staff_id=coalesce(assigned_staff_id,v_profile.staff_id),completed_at=case when p_to in ('RESOLVED','CLOSED') then now() else null end where workflow_instance_id=v.workflow_instance_id and task_type='CLIENT_SUPPORT_TRIAGE';
 insert into public.audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_state,after_state,reason) values(auth.uid(),v_profile.id,'CLIENT_SUPPORT_REQUEST_TRANSITION','client_support_request',v.id::text,jsonb_build_object('status',v_from),jsonb_build_object('status',p_to,'follow_up_at',p_follow_up_at),coalesce(nullif(trim(p_resolution_summary),''),'Support request workflow transition'));
 return v;
end$$;
revoke execute on function public.transition_client_support_request(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.transition_client_support_request(uuid,text,text,timestamptz) to authenticated;
