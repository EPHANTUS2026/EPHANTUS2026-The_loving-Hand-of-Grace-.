-- Server-only atomic enquiry creation. No public read or RPC permissions.
create table public.public_enquiry_receipts (
  submission_key uuid primary key,
  fingerprint text not null,
  contact_hash text not null,
  created_at timestamptz not null default now()
);
create index public_enquiry_receipts_time on public.public_enquiry_receipts(created_at);
create index public_enquiry_receipts_contact on public.public_enquiry_receipts(contact_hash, created_at);
alter table public.public_enquiry_receipts enable row level security;
revoke all on public.public_enquiry_receipts from public, anon, authenticated;
grant select, insert, delete on public.public_enquiry_receipts to service_role;

create or replace function public.submit_public_enquiry(
  p_key uuid, p_fingerprint text, p_contact_hash text,
  p_name text, p_phone text, p_email text, p_service text
) returns jsonb language plpgsql security invoker set search_path = public
as $$
declare
  existing text;
  admission_id uuid;
  flow_id uuid;
  reference_id text := 'ADM-' || gen_random_uuid()::text;
begin
  if p_key is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$'
    or p_contact_hash is null or p_contact_hash !~ '^[a-f0-9]{64}$'
    or p_name is null or length(trim(p_name)) not between 1 and 120
    or p_phone is null or p_phone !~ '^\+?[0-9 ()-]{7,30}$'
    or p_email is null or length(p_email) > 160
    or (p_email <> '' and p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or p_service is null or p_service not in ('general','residential-rehabilitation','outpatient-support','relapse-prevention','family-program','life-skills-reintegration','aftercare')
  then raise exception 'invalid_enquiry'; end if;

  -- Serializes quotas and duplicate checks across application instances.
  perform pg_advisory_xact_lock(762910527);
  select fingerprint into existing from public.public_enquiry_receipts where submission_key = p_key;
  if found then
    return jsonb_build_object('status', case when existing = p_fingerprint then 'accepted' else 'conflict' end);
  end if;
  if (select count(*) from public.public_enquiry_receipts where created_at > now() - interval '1 hour') >= 100
    or (select count(*) from public.public_enquiry_receipts where contact_hash=p_contact_hash and created_at > now() - interval '1 hour') >= 3
  then return jsonb_build_object('status','limited'); end if;

  insert into public.public_enquiry_receipts(submission_key,fingerprint,contact_hash) values(p_key,p_fingerprint,p_contact_hash);
  insert into public.admissions(reference,enquiry_name,enquiry_phone,enquiry_email,source,stage,priority,next_action)
    values(reference_id,trim(p_name),p_phone,nullif(p_email,''),'website:' || p_service,'enquiry','routine','Private screening contact')
    returning id into admission_id;
  insert into public.workflow_instances(workflow_key,entity_type,entity_id,current_state,status,metadata)
    values('recovery_journey','admission',admission_id,'enquiry','active','{"source":"website_contact"}'::jsonb)
    returning id into flow_id;
  insert into public.workflow_events(workflow_instance_id,event_type,source_channel,actor_type,summary,metadata)
    values(flow_id,'enquiry_submitted','website','visitor','Confidential enquiry received','{"consent":true,"consent_version":"public-enquiry-v1"}'::jsonb);
  insert into public.workflow_tasks(workflow_instance_id,task_type,title,assigned_role,status,payload)
    values(flow_id,'admissions_screening','Contact enquirer and complete private screening','admissions','queued',jsonb_build_object('admission_id',admission_id));
  insert into public.audit_log(action,entity_type,entity_id,after_state,reason)
    values('website_enquiry_received','admission',admission_id::text,'{"stage":"enquiry"}'::jsonb,'Public contact consent v1');
  return jsonb_build_object('status','accepted');
end;
$$;
revoke all on function public.submit_public_enquiry(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_public_enquiry(uuid,text,text,text,text,text,text) to service_role;
