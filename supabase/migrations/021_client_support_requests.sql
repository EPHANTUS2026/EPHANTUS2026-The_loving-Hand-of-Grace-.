-- My Journey + accountable client support requests.
create table if not exists public.client_support_requests(
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 request_type text not null check(request_type in ('COUNSELLOR','WELFARE','FAMILY_COMMUNICATION','FAMILY_MEETING','APPOINTMENT','DOCUMENT','SKILLS_TRAINING','REINTEGRATION','SPIRITUAL_SUPPORT','MEDICAL_ATTENTION','HOUSING_REINTEGRATION','AFTERCARE','FEEDBACK','COMPLAINT','GENERAL_SUPPORT')),
 subject text not null, details text, status text not null default 'RECEIVED' check(status in ('RECEIVED','TRIAGED','IN_PROGRESS','WAITING','RESOLVED','CLOSED')),
 client_visible_status text not null default 'RECEIVED', priority text not null default 'NORMAL' check(priority in ('NORMAL','HIGH','URGENT')),
 workflow_instance_id uuid references public.workflow_instances(id), assigned_staff_id uuid references public.staff(id),
 resolution_summary text, follow_up_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.client_support_requests enable row level security;
create policy "client own support request select" on public.client_support_requests for select to authenticated using(client_id=public.current_client_id());
revoke insert,update,delete on public.client_support_requests from anon,authenticated;
create or replace function public.create_client_support_request(p_request_type text,p_subject text,p_details text default null)
returns public.client_support_requests language plpgsql security definer set search_path=public,pg_temp as $$
declare v_client uuid; v_row public.client_support_requests;
begin
 v_client:=public.current_client_id(); if v_client is null then raise exception 'Client identity required'; end if;
 if p_request_type not in ('COUNSELLOR','WELFARE','FAMILY_COMMUNICATION','FAMILY_MEETING','APPOINTMENT','DOCUMENT','SKILLS_TRAINING','REINTEGRATION','SPIRITUAL_SUPPORT','MEDICAL_ATTENTION','HOUSING_REINTEGRATION','AFTERCARE','FEEDBACK','COMPLAINT','GENERAL_SUPPORT') then raise exception 'Unsupported request type'; end if;
 if length(trim(coalesce(p_subject,'')))<3 or length(p_subject)>160 then raise exception 'Subject must be 3-160 characters'; end if;
 if length(coalesce(p_details,''))>4000 then raise exception 'Details too long'; end if;
 insert into public.client_support_requests(client_id,request_type,subject,details)
 values(v_client,p_request_type,trim(p_subject),nullif(trim(coalesce(p_details,'')),''))
 returning * into v_row;
 insert into public.audit_log(actor_id,action,resource_type,resource_id,metadata)
 select p.id,'CLIENT_SUPPORT_REQUEST_CREATED','client_support_request',v_row.id,jsonb_build_object('client_id',v_client,'request_type',p_request_type)
 from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 return v_row;
end$$;
revoke all on function public.create_client_support_request(text,text,text) from public;
grant execute on function public.create_client_support_request(text,text,text) to authenticated;
