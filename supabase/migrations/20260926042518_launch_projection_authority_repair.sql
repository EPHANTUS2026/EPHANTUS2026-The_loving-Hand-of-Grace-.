-- Keep the client-facing projection inside the authoritative admission transaction.
-- No backfill: existing records are not rewritten by this migration.
create schema if not exists private;
create or replace function private.project_admission_recovery_journey()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_stage text; v_id uuid; v_previous text;
begin
 if new.client_id is null then return new; end if;
 if tg_op='UPDATE' and new.stage is not distinct from old.stage and new.client_id is not distinct from old.client_id then return new; end if;
 v_stage := case new.stage::text
  when 'enquiry' then 'ENQUIRY' when 'screening' then 'SCREENING'
  when 'assessment' then 'ASSESSMENT' when 'admission_ready' then 'ASSESSMENT'
  when 'admitted' then 'ADMISSION' when 'treatment' then 'ACTIVE_TREATMENT'
  when 'discharge' then 'DISCHARGE_PREPARATION' when 'aftercare' then 'AFTERCARE'
  when 'closed' then 'LONG_TERM_RECOVERY_SUPPORT' else null end;
 if v_stage is null then raise exception 'unsupported_recovery_projection_stage'; end if;
 select id,current_stage into v_id,v_previous from public.recovery_journeys where client_id=new.client_id for update;
 insert into public.recovery_journeys(client_id,current_stage,aftercare_status)
 values(new.client_id,v_stage,case when new.stage::text='closed' then 'completed' when new.stage::text='aftercare' then 'active' else null end)
 on conflict(client_id) do update set current_stage=excluded.current_stage,
  stage_started_at=case when recovery_journeys.current_stage is distinct from excluded.current_stage then now() else recovery_journeys.stage_started_at end,
  aftercare_status=excluded.aftercare_status,updated_at=now()
 returning id into v_id;
 if v_previous is distinct from v_stage then
  insert into public.recovery_journey_events(journey_id,from_stage,to_stage,actor_id,reason,metadata)
  values(v_id,v_previous,v_stage,(select id from public.profiles where auth_user_id=auth.uid() and is_active=true limit 1),
   'Authoritative admission projection',jsonb_build_object('admission_id',new.id,'source','admission_transaction'));
 end if;
 return new;
end $$;
revoke all on function private.project_admission_recovery_journey() from public,anon,authenticated;
drop trigger if exists admission_recovery_projection on public.admissions;
create trigger admission_recovery_projection after insert or update of stage,client_id on public.admissions
 for each row execute function private.project_admission_recovery_journey();
-- Projection and provenance writes belong to the server transaction, never clients.
revoke insert,update,delete on public.recovery_journeys,public.recovery_journey_events from anon,authenticated;

-- Future, ended and revoked assignments must never grant Grace access.
create or replace function public.grace_staff_authority(p_client_id uuid,p_scope text,p_purpose text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from public.profiles p join public.staff_client_assignments a on a.staff_id=p.staff_id
  where p.auth_user_id=auth.uid() and p.is_active=true and p.role::text not in ('client','family')
  and a.client_id=p_client_id and a.active=true and a.revoked_at is null
  and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now())
  and (p_scope=any(a.scopes) or '*'=any(a.scopes))
  and (p_purpose=any(a.purposes) or '*'=any(a.purposes))
 );
$$;
revoke all on function public.grace_staff_authority(uuid,text,text) from public,anon;
grant execute on function public.grace_staff_authority(uuid,text,text) to authenticated;
