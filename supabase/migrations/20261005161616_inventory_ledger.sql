-- Append-only inventory ledger. No assignments or operational stock are seeded.
create table public.inventory_items (
 id uuid primary key references public.enterprise_records(id),
 item_code text not null unique check(item_code ~ '^[A-Za-z0-9_-]{1,40}$'),
 name text not null check(length(trim(name)) between 1 and 160),
 unit text not null check(length(trim(unit)) between 1 and 40),
 unit_cost numeric(14,2) not null check(unit_cost>=0 and unit_cost<1e10),
 reorder_level numeric(14,3) not null check(reorder_level>=0 and reorder_level<1e10),
 created_at timestamptz not null default clock_timestamp()
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references public.inventory_items(id),
 movement_key text not null unique check(length(movement_key) between 1 and 80),
 movement_date date not null, direction text not null check(direction in ('IN','OUT')),
 quantity numeric(14,3) not null check(quantity>0), issued_to text not null default '', received_from text not null default '',
 purpose text not null check(length(trim(purpose)) between 1 and 500), received_by text not null check(length(trim(received_by)) between 1 and 160),
 receipt_signature text not null check(length(trim(receipt_signature)) between 1 and 200),
 submitted_by uuid not null references public.profiles(id), created_at timestamptz not null default clock_timestamp(),
 posted_at timestamptz, approved_by uuid references public.profiles(id), approval_signature text,
 balance_after numeric(14,3),
 check((direction='OUT' and length(trim(issued_to)) between 1 and 160) or (direction='IN' and length(trim(received_from)) between 1 and 160)),
 check((posted_at is null and approved_by is null and approval_signature is null and balance_after is null) or
 (posted_at is not null and approved_by is not null and approved_by<>submitted_by and length(trim(approval_signature)) between 1 and 200 and balance_after>=0))
);
create index inventory_movement_item on public.inventory_movements(item_id,posted_at desc,id);
create table public.inventory_counts (
 id uuid primary key default gen_random_uuid(), count_key text not null unique check(length(count_key) between 1 and 80),
 item_id uuid not null references public.inventory_items(id), counted_quantity numeric(14,3) not null check(counted_quantity>=0),
 system_quantity numeric(14,3) not null check(system_quantity>=0), variance numeric(14,3) generated always as (counted_quantity-system_quantity) stored,
 counted_by uuid not null references public.profiles(id), reason text not null check(length(trim(reason)) between 1 and 500),
 created_at timestamptz not null default clock_timestamp()
);
-- Specific stock posting adapter: both separately assigned approve AND execute are required.
-- The general enterprise approve/execute denial remains intact for other workflows.
create function private.inventory_allowed(p_action text,p_item uuid default null)
returns boolean language sql stable security definer set search_path='' as $$
 select case when p_action in ('read','create') then private.enterprise_allowed('inventory',p_action,p_item)
 when p_action in ('approve','execute') then
 private.enterprise_allowed('inventory','read',p_item) and exists (
 select 1 from public.profiles p join private.enterprise_assignments a on a.profile_id=p.id
 where p.auth_user_id=auth.uid() and p.is_active and p.staff_id is not null and p.role::text not in ('client','family')
 and a.module='inventory' and a.action=p_action and (a.record_id is null or a.record_id=p_item)
 and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now()) and a.revoked_at is null)
 else false end;
$$;
revoke all on function private.inventory_allowed(text,uuid) from public,anon,service_role;
grant execute on function private.inventory_allowed(text,uuid) to authenticated;
create function public.inventory_authority(p_action text,p_item uuid default null)
returns boolean language sql stable security invoker set search_path='' as $$ select private.inventory_allowed(p_action,p_item); $$;
revoke all on function public.inventory_authority(text,uuid) from public,anon,service_role;
grant execute on function public.inventory_authority(text,uuid) to authenticated;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_counts enable row level security;
revoke all on public.inventory_items,public.inventory_movements,public.inventory_counts from public,anon,authenticated,service_role;
grant select on public.inventory_items,public.inventory_movements,public.inventory_counts to authenticated;
create policy inventory_items_read on public.inventory_items for select to authenticated using(private.inventory_allowed('read',id));
create policy inventory_movements_read on public.inventory_movements for select to authenticated using(private.inventory_allowed('read',item_id));
create policy inventory_counts_read on public.inventory_counts for select to authenticated using(private.inventory_allowed('read',item_id));
create function private.inventory_balance(p_item uuid) returns numeric language sql stable set search_path='' as $$
 select coalesce(sum(case direction when 'IN' then quantity else -quantity end),0) from public.inventory_movements where item_id=p_item and posted_at is not null;
$$;
revoke all on function private.inventory_balance(uuid) from public,anon,authenticated,service_role;
create function private.inventory_write(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_profile public.profiles; v_item public.inventory_items; v_move public.inventory_movements; v_count public.inventory_counts;
 v_result jsonb; v_balance numeric; v_id uuid; v_date date;
begin
 if jsonb_typeof(p_data)<>'object' or p_data is null then raise exception 'inventory_invalid';end if;
 if p_action not in ('item','movement','post','count') then raise exception 'inventory_invalid';end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in
  (select unnest(case p_action
   when 'item' then array['item_code','name','unit','unit_cost','reorder_level']
   when 'movement' then array['movement_key','item_code','movement_date','direction','quantity','issued_to','received_from','purpose','received_by','receipt_signature']
   when 'post' then array['item_code','movement_id','approval_signature']
   else array['item_code','count_key','counted_quantity','reason'] end))) then raise exception 'inventory_invalid';end if;
 if p_action='item' and (coalesce(p_data->>'unit_cost','') !~ '^\d+(\.\d{1,2})?$' or coalesce(p_data->>'reorder_level','') !~ '^\d+(\.\d{1,3})?$') then raise exception 'inventory_invalid';end if;
 if p_action='movement' and (coalesce(p_data->>'quantity','') !~ '^\d+(\.\d{1,3})?$' or (p_data->>'quantity')::numeric>=1e10) then raise exception 'inventory_invalid';end if;
 if p_action='count' and (coalesce(p_data->>'counted_quantity','') !~ '^\d+(\.\d{1,3})?$' or (p_data->>'counted_quantity')::numeric>=1e10) then raise exception 'inventory_invalid';end if;
 select * into v_profile from public.profiles where auth_user_id=auth.uid() and is_active and staff_id is not null and role::text not in ('client','family') for share;
 if v_profile.id is null then raise exception 'inventory_denied' using errcode='42501'; end if;
 if p_action='item' then
  if not private.inventory_allowed('create') then raise exception 'inventory_denied' using errcode='42501';end if;
  if coalesce(p_data->>'item_code','') !~ '^[A-Za-z0-9_-]{1,40}$' then raise exception 'inventory_invalid';end if;
  v_result:=public.create_enterprise_record('inventory','inventory_item',p_data->>'name');
  v_id:=(v_result->'record'->>'id')::uuid;
  insert into public.inventory_items(id,item_code,name,unit,unit_cost,reorder_level) values(v_id,p_data->>'item_code',p_data->>'name',p_data->>'unit',(p_data->>'unit_cost')::numeric,(p_data->>'reorder_level')::numeric);
  return jsonb_build_object('ok',true,'receipt_id',v_id,'status','item_created');
 end if;
 -- Serialise all ledger/count mutations per item before calculating balances.
 select * into v_item from public.inventory_items where item_code=p_data->>'item_code' for update;
 if v_item.id is null then raise exception 'inventory_invalid';end if;
 if not private.inventory_allowed('read',v_item.id) then raise exception 'inventory_denied' using errcode='42501';end if;
 if p_action in ('movement','count') and not private.inventory_allowed('create') then raise exception 'inventory_denied' using errcode='42501';end if;
 if p_action='movement' then
  v_date:=(p_data->>'movement_date')::date;
  if v_date is null or v_date>(clock_timestamp() at time zone 'Africa/Nairobi')::date or v_date<date '2000-01-01' then raise exception 'inventory_invalid';end if;
  select * into v_move from public.inventory_movements where movement_key=p_data->>'movement_key';
  if v_move.id is not null then
   if v_move.item_id<>v_item.id or v_move.submitted_by<>v_profile.id or v_move.movement_date<>v_date or
    v_move.direction<>p_data->>'direction' or v_move.quantity<>(p_data->>'quantity')::numeric or
    v_move.issued_to<>coalesce(p_data->>'issued_to','') or v_move.received_from<>coalesce(p_data->>'received_from','') or
    v_move.purpose<>p_data->>'purpose' or v_move.received_by<>p_data->>'received_by' or v_move.receipt_signature<>p_data->>'receipt_signature'
   then raise exception 'inventory_duplicate_conflict';end if;
   return jsonb_build_object('ok',true,'receipt_id',v_move.id,'status',case when v_move.posted_at is null then 'pending_approval' else 'posted' end,'duplicate',true);
  end if;
  insert into public.inventory_movements(item_id,movement_key,movement_date,direction,quantity,issued_to,received_from,purpose,received_by,receipt_signature,submitted_by)
  values(v_item.id,p_data->>'movement_key',v_date,p_data->>'direction',(p_data->>'quantity')::numeric,coalesce(p_data->>'issued_to',''),coalesce(p_data->>'received_from',''),p_data->>'purpose',p_data->>'received_by',p_data->>'receipt_signature',v_profile.id) returning * into v_move;
  return jsonb_build_object('ok',true,'receipt_id',v_move.id,'status','pending_approval');
 elsif p_action='post' then
  if not private.inventory_allowed('approve',v_item.id) or not private.inventory_allowed('execute',v_item.id) then raise exception 'inventory_denied' using errcode='42501';end if;
  select * into v_move from public.inventory_movements where id=(p_data->>'movement_id')::uuid and item_id=v_item.id for update;
  if v_move.id is null then raise exception 'inventory_invalid';end if;
  if v_move.submitted_by=v_profile.id then raise exception 'inventory_self_approval';end if;
  if length(trim(coalesce(p_data->>'approval_signature',''))) not between 1 and 200 then raise exception 'inventory_invalid';end if;
  if v_move.posted_at is not null then
   if v_move.approved_by<>v_profile.id or v_move.approval_signature<>p_data->>'approval_signature' then raise exception 'inventory_duplicate_conflict';end if;
   return jsonb_build_object('ok',true,'receipt_id',v_move.id,'status','posted','duplicate',true);
  end if;
  v_balance:=private.inventory_balance(v_item.id)+case v_move.direction when 'IN' then v_move.quantity else -v_move.quantity end;
  if v_balance<0 then raise exception 'inventory_insufficient_stock';end if;
  update public.inventory_movements set posted_at=clock_timestamp(),approved_by=v_profile.id,approval_signature=p_data->>'approval_signature',balance_after=v_balance where id=v_move.id;
  return jsonb_build_object('ok',true,'receipt_id',v_move.id,'status','posted','balance_after',v_balance);
 elsif p_action='count' then
  select * into v_count from public.inventory_counts where count_key=p_data->>'count_key';
  if v_count.id is not null then
   if v_count.item_id<>v_item.id or v_count.counted_by<>v_profile.id or v_count.counted_quantity<>(p_data->>'counted_quantity')::numeric or v_count.reason<>p_data->>'reason' then raise exception 'inventory_duplicate_conflict';end if;
   return jsonb_build_object('ok',true,'receipt_id',v_count.id,'status','count_recorded','duplicate',true);
  end if;
  insert into public.inventory_counts(count_key,item_id,counted_quantity,system_quantity,counted_by,reason)
  values(p_data->>'count_key',v_item.id,(p_data->>'counted_quantity')::numeric,private.inventory_balance(v_item.id),v_profile.id,p_data->>'reason') returning * into v_count;
  return jsonb_build_object('ok',true,'receipt_id',v_count.id,'status','count_recorded','variance',v_count.variance);
 end if;
 raise exception 'inventory_invalid';
end;
$$;
revoke all on function private.inventory_write(text,jsonb) from public,anon,service_role;
grant execute on function private.inventory_write(text,jsonb) to authenticated;
create function public.inventory_write(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.inventory_write(p_action,p_data);$$;
revoke all on function public.inventory_write(text,jsonb) from public,anon,service_role;
grant execute on function public.inventory_write(text,jsonb) to authenticated;
create function private.inventory_workspace() returns jsonb language plpgsql security definer set search_path='' as $$
declare v_items jsonb; v_total numeric;v_low integer;v_out integer;
begin
 if not private.inventory_allowed('read') then raise exception 'inventory_denied' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'item_code',i.item_code,'name',i.name,'unit',i.unit,'unit_cost',i.unit_cost,'reorder_level',i.reorder_level,'balance',private.inventory_balance(i.id),'can_post',private.inventory_allowed('approve',i.id) and private.inventory_allowed('execute',i.id)) order by i.item_code),'[]'::jsonb),
 coalesce(sum(private.inventory_balance(i.id)*i.unit_cost),0),count(*) filter(where private.inventory_balance(i.id)>0 and private.inventory_balance(i.id)<=i.reorder_level),count(*) filter(where private.inventory_balance(i.id)=0)
 into v_items,v_total,v_low,v_out from public.inventory_items i where private.inventory_allowed('read',i.id);
 return jsonb_build_object('items',v_items,'total_value',v_total,'low_stock',v_low,'out_of_stock',v_out,'can_create',private.inventory_allowed('create'),
 'movements',coalesce((select jsonb_agg(to_jsonb(m)) from(select m.*,i.item_code,i.name from public.inventory_movements m join public.inventory_items i on i.id=m.item_id where private.inventory_allowed('read',i.id) order by m.created_at desc,m.id desc limit 200)m),'[]'::jsonb),
 'last_five',coalesce((select jsonb_agg(to_jsonb(m)) from(select m.*,i.item_code from public.inventory_movements m join public.inventory_items i on i.id=m.item_id where m.posted_at is not null and private.inventory_allowed('read',i.id) order by m.posted_at desc,m.id desc limit 5)m),'[]'::jsonb),
 'counts',coalesce((select jsonb_agg(to_jsonb(c)) from(select c.*,i.item_code from public.inventory_counts c join public.inventory_items i on i.id=c.item_id where private.inventory_allowed('read',i.id) order by c.created_at desc,c.id desc limit 100)c),'[]'::jsonb));
end;$$;
revoke all on function private.inventory_workspace() from public,anon,service_role;
grant execute on function private.inventory_workspace() to authenticated;
create function public.inventory_workspace() returns jsonb language sql security invoker set search_path='' as $$select private.inventory_workspace();$$;
revoke all on function public.inventory_workspace() from public,anon,service_role;
grant execute on function public.inventory_workspace() to authenticated;
-- Authoritative bounded atomic upload; each row goes through the same ledger validation.
create function private.inventory_import(p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row_data jsonb;receipt jsonb;receipts jsonb:='[]'::jsonb;begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 200 then raise exception 'inventory_invalid';end if;
 -- Lock items in deterministic order to avoid cross-item upload deadlocks.
 perform 1 from public.inventory_items where item_code in(select value->>'item_code' from jsonb_array_elements(p_rows)) order by item_code for update;
 for row_data in select value from jsonb_array_elements(p_rows) loop
 receipt:=private.inventory_write('movement',row_data);receipts:=receipts||jsonb_build_array(receipt);end loop;
 return jsonb_build_object('ok',true,'receipts',receipts,'status','pending_approval');end;$$;
revoke all on function private.inventory_import(jsonb) from public,anon,service_role;
grant execute on function private.inventory_import(jsonb) to authenticated;
create function public.inventory_import(p_rows jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.inventory_import(p_rows);$$;
revoke all on function public.inventory_import(jsonb) from public,anon,service_role;
grant execute on function public.inventory_import(jsonb) to authenticated;
