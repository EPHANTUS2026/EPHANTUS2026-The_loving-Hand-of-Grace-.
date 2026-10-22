-- Validate the RPC boundary and preserve the existing workflow signal atomically.
do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.submit_grace_checkin(uuid,integer,integer,text,text)'::regprocedure) into definition;
 definition := replace(definition,
 ' -- Serialise only this client''s retry key; no role or client ID input is accepted.',
 $validation$
 if exists (
  select 1 from unnest(string_to_array(coalesce(nullif(btrim(p_coping),''),''),' | ')) as item
  where item not in ('Talking to someone','Exercise','Prayer / reflection','Breathing','Grounding','Rest','Music','Journaling','Meeting / group','Time outdoors','Routine','Other')
 ) then
  raise exception 'invalid_checkin' using errcode='22023';
 end if;
 -- Serialise only this client's retry key; no role or client ID input is accepted.$validation$);
 if position('unnest(string_to_array' in definition)=0 then raise exception 'checkin validation patch not applied'; end if;
 execute definition;
end $migration$;

create or replace function public.grace_checkin_workflow_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare flow_id uuid;
begin
 select id into flow_id from public.workflow_instances
 where entity_type='client' and entity_id=new.client_id and status='active'
 order by updated_at desc limit 1;
 if flow_id is not null then
  insert into public.workflow_events(workflow_instance_id,event_type,source_channel,actor_type,actor_id,summary,metadata)
  values(flow_id,'grace_checkin_submitted','client_portal','client',new.client_id,
   'Client completed a Grace check-in',jsonb_build_object('checkin_id',new.id,'local_day',new.local_day));
 end if;
 return new;
end $$;
revoke all on function public.grace_checkin_workflow_event() from public,anon,authenticated;
create trigger grace_checkin_workflow_event after insert on public.grace_checkins
 for each row execute function public.grace_checkin_workflow_event();
