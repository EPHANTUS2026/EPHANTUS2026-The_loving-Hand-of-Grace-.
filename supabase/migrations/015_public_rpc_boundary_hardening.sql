-- Harden the two intentional anonymous RPC boundaries without disabling them.
-- Booking remains available to unauthenticated visitors who possess a valid hold token.
-- Grace knowledge search remains public, but input/output are constrained to the approved corpus.

create or replace function public.search_grace_approved_knowledge(p_query text, p_limit integer default 3)
returns table(id uuid,title text,summary text,body text,version integer,last_reviewed_at timestamptz,source_references jsonb,score real)
language plpgsql stable security definer set search_path=public
as $$
declare v_query text := trim(coalesce(p_query,'')); v_limit integer := greatest(1,least(coalesce(p_limit,3),5));
begin
  if length(v_query) < 2 then raise exception 'invalid_query'; end if;
  if length(v_query) > 300 then raise exception 'query_too_long'; end if;
  return query
  with q as (select websearch_to_tsquery('english',v_query) query)
  select a.id,a.title,a.summary,a.body,a.version,a.last_reviewed_at,a.source_references,
    ts_rank_cd(to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.summary,'')||' '||coalesce(a.body,'')),q.query)::real
  from public.grace_approved_knowledge a cross join q
  where q.query is not null
    and to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.summary,'')||' '||coalesce(a.body,'')) @@ q.query
  order by 8 desc,a.last_reviewed_at desc nulls last limit v_limit;
end; $$;
revoke all on function public.search_grace_approved_knowledge(text,integer) from public;
grant execute on function public.search_grace_approved_knowledge(text,integer) to anon,authenticated,service_role;

-- Tighten booking confirmation inputs while preserving the valid anonymous hold-token flow.
-- The canonical implementation remains migration 010; this wrapper-compatible replacement
-- adds bounded public inputs and forbids anonymous callers from assigning a user identity.
create or replace function public.confirm_booking_slot(p_hold_id uuid,p_hold_token_hash text,p_first_name text,p_last_name text,p_phone text,p_email text,p_preferred_contact_method text,p_consent_version text,p_manage_token_hash text,p_idempotency_key text,p_optional_note text default null,p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_hold public.booking_slot_holds%rowtype;v_booking public.booking_requests%rowtype;v_reference text;v_uid uuid:=auth.uid();
begin
 if p_hold_id is null then raise exception 'hold_required'; end if;
 if coalesce(length(trim(p_hold_token_hash)),0)<16 or length(p_hold_token_hash)>256 then raise exception 'invalid_hold_token'; end if;
 if coalesce(length(trim(p_idempotency_key)),0)<8 or length(p_idempotency_key)>128 then raise exception 'invalid_idempotency_key'; end if;
 if coalesce(length(trim(p_manage_token_hash)),0)<16 or length(p_manage_token_hash)>256 then raise exception 'invalid_manage_token'; end if;
 if length(trim(coalesce(p_first_name,''))) not between 1 and 100 or length(trim(coalesce(p_last_name,''))) not between 1 and 100 then raise exception 'invalid_name'; end if;
 if length(trim(coalesce(p_phone,''))) not between 7 and 32 then raise exception 'invalid_phone'; end if;
 if length(coalesce(p_email,''))>254 or length(coalesce(p_optional_note,''))>2000 or length(coalesce(p_consent_version,''))>100 then raise exception 'input_too_long'; end if;
 if p_user_id is not null and (v_uid is null or p_user_id<>v_uid) then raise exception 'invalid_user_binding'; end if;
 if p_preferred_contact_method not in ('phone','sms','whatsapp','email') then raise exception 'invalid_contact_method';end if;
 if p_preferred_contact_method='email' and nullif(trim(coalesce(p_email,'')),'') is null then raise exception 'email_required';end if;
 select * into v_booking from public.booking_requests where idempotency_key=p_idempotency_key limit 1;
 if found then return jsonb_build_object('booking_id',v_booking.id,'public_reference',v_booking.public_reference,'status',v_booking.status,'idempotent',true);end if;
 select * into v_hold from public.booking_slot_holds where id=p_hold_id for update;
 if not found then raise exception 'hold_not_found';end if;
 if v_hold.hold_token_hash is distinct from p_hold_token_hash then raise exception 'invalid_hold_token';end if;
 select * into v_booking from public.booking_requests where slot_hold_id=p_hold_id limit 1;
 if found then return jsonb_build_object('booking_id',v_booking.id,'public_reference',v_booking.public_reference,'status',v_booking.status,'idempotent',true);end if;
 if v_hold.expires_at<=now() then raise exception 'hold_expired';end if;
 if v_hold.staff_id is null then raise exception 'hold_missing_staff';end if;
 perform pg_advisory_xact_lock(hashtext(v_hold.staff_id::text||v_hold.start_at::text));
 if exists(select 1 from public.booking_requests b where b.assigned_staff_id=v_hold.staff_id and b.status not in ('CANCELLED','FAILED','EXPIRED') and tstzrange(b.start_at,b.end_at,'[)')&&tstzrange(v_hold.start_at,v_hold.end_at,'[)')) then raise exception 'slot_unavailable';end if;
 v_reference:='LHG-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 insert into public.booking_requests(public_reference,user_id,booking_type_id,booked_for,first_name,last_name,phone,email,preferred_contact_method,optional_note,appointment_format,start_at,end_at,timezone,status,assigned_staff_id,consent_version,manage_token_hash,slot_hold_id,idempotency_key)
 values(v_reference,p_user_id,v_hold.booking_type_id,coalesce(v_hold.booked_for,'self'),trim(p_first_name),trim(p_last_name),trim(p_phone),nullif(trim(coalesce(p_email,'')),''),p_preferred_contact_method,nullif(trim(coalesce(p_optional_note,'')),''),coalesce(v_hold.appointment_format,'phone'),v_hold.start_at,v_hold.end_at,'Africa/Nairobi','CONFIRMED',v_hold.staff_id,p_consent_version,p_manage_token_hash,p_hold_id,p_idempotency_key) returning * into v_booking;
 insert into public.booking_events(booking_id,event_type,actor_type,actor_id,metadata) values(v_booking.id,'CONFIRMED',case when p_user_id is null then 'public' else 'user' end,p_user_id,jsonb_build_object('slot_hold_id',p_hold_id,'idempotency_key',p_idempotency_key));
 update public.booking_slot_holds set expires_at=now() where id=p_hold_id;
 return jsonb_build_object('booking_id',v_booking.id,'public_reference',v_booking.public_reference,'status',v_booking.status,'idempotent',false);
exception when exclusion_violation or unique_violation then
 select * into v_booking from public.booking_requests where idempotency_key=p_idempotency_key or slot_hold_id=p_hold_id order by created_at asc limit 1;
 if found then return jsonb_build_object('booking_id',v_booking.id,'public_reference',v_booking.public_reference,'status',v_booking.status,'idempotent',true);end if;
 raise exception 'slot_unavailable';
end; $$;
revoke all on function public.confirm_booking_slot(uuid,text,text,text,text,text,text,text,text,text,text,uuid) from public;
grant execute on function public.confirm_booking_slot(uuid,text,text,text,text,text,text,text,text,text,text,uuid) to anon,authenticated,service_role;
