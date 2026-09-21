-- GRACE-6: client-safe My Requests projection over GraceFlow.
create or replace view public.grace_client_requests
with (security_invoker=true) as
select
  wi.id,
  p.client_id,
  wi.workflow_key as request_type,
  wi.status,
  wi.created_at as submitted_at,
  wi.updated_at,
  case when wi.status='completed' then 'Your request has been completed.'
       when wi.status='active' then 'Your request is being handled by the appropriate team.'
       else 'Your request has been recorded.' end as client_message
from public.workflow_instances wi
join public.profiles p on p.id::text=wi.metadata->'actor'->>'id'
where wi.metadata->>'source'='grace'
  and wi.metadata->'actor'->>'mode' in ('CLIENT','AFTERCARE')
  and p.auth_user_id=auth.uid()
  and p.is_active=true
  and p.role='client'
  and p.client_id is not null;

grant select on public.grace_client_requests to authenticated;
