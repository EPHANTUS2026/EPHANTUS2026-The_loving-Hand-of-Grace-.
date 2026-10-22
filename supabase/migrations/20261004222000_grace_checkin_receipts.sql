-- GR CLI 02: append-only statements, current authority, safe retry receipts.
alter table public.grace_checkins add column if not exists idempotency_key uuid;
alter table public.grace_checkins add column if not exists local_day date
 generated always as ((created_at at time zone 'Africa/Nairobi')::date) stored;
create unique index if not exists grace_checkins_client_retry_idx
 on public.grace_checkins(client_id,idempotency_key);

create or replace function public.submit_grace_checkin(
 p_key uuid,p_mood integer,p_craving integer,p_coping text,p_note text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_client uuid;
 v_row public.grace_checkins%rowtype;
begin
 select client_id into v_client from public.profiles
 where auth_user_id=auth.uid() and is_active and role='client' limit 1;
 if auth.uid() is null or v_client is null then
  raise exception 'client_authority_required' using errcode='42501';
 end if;
 if p_key is null or p_mood is null or p_mood not between 1 and 5
 or p_craving is null or p_craving not between 0 and 10
 or length(coalesce(p_coping,''))>1000 or length(coalesce(p_note,''))>2000 then
  raise exception 'invalid_checkin' using errcode='22023';
 end if;
 -- Serialise only this client's retry key; no role or client ID input is accepted.
 perform pg_advisory_xact_lock(hashtextextended(v_client::text||p_key::text,0));
 select * into v_row from public.grace_checkins
 where client_id=v_client and idempotency_key=p_key;
 if found then
  if v_row.mood_score is distinct from p_mood or v_row.craving_level is distinct from p_craving
  or v_row.coping_tool is distinct from nullif(btrim(p_coping),'')
  or v_row.note is distinct from nullif(btrim(p_note),'') then
   raise exception 'checkin_retry_conflict' using errcode='PT409';
  end if;
 else
  insert into public.grace_checkins(client_id,idempotency_key,mood_score,craving_level,coping_tool,note)
  values(v_client,p_key,p_mood,p_craving,nullif(btrim(p_coping),''),nullif(btrim(p_note),''))
  returning * into v_row;
 end if;
 return jsonb_build_object('id',v_row.id,'created_at',v_row.created_at,'local_day',v_row.local_day,'status','saved');
end $$;
revoke all on function public.submit_grace_checkin(uuid,integer,integer,text,text) from public,anon;
grant execute on function public.submit_grace_checkin(uuid,integer,integer,text,text) to authenticated;

-- Clinical check-in statements require both professional scope and active assignment.
alter policy grace_checkins_care_team_select on public.grace_checkins
 using (public.current_profile_role()::text in ('counsellor','clinician','clinical_director','doctor','psychologist')
 and public.grace_staff_authority(client_id,'checkins','care'));
