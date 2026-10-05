-- Synthetic fixtures only. This entire transaction rolls back, including grants.
begin;
insert into private.enterprise_assignments(profile_id,module,action,decision_reference)
select p.id,'inventory',a,'synthetic-inventory-certification-rollback'
from public.profiles p cross join unnest(array['read','create']) a
where p.full_name='Staging Procurement' and p.is_active;
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.profiles where full_name='Staging Procurement'),true);
set local role authenticated;
do $$declare item jsonb;m jsonb;again jsonb;begin
 item:=public.inventory_write('item','{"item_code":"SYNTH_INV_20261005","name":"Synthetic soap","unit":"pieces","unit_cost":100,"reorder_level":5}');
 if not (item->>'ok')::boolean then raise exception 'missing item receipt';end if;
 m:=public.inventory_write('movement','{"item_code":"SYNTH_INV_20261005","movement_key":"SYNTH_INV_IN_20261005","movement_date":"2026-10-05","direction":"IN","quantity":10,"received_from":"Synthetic supplier","issued_to":"","purpose":"Synthetic opening stock","received_by":"Synthetic receiver","receipt_signature":"synthetic-signed-voucher"}');
 if m->>'status'<>'pending_approval' then raise exception 'pending state failed';end if;
 again:=public.inventory_write('movement','{"item_code":"SYNTH_INV_20261005","movement_key":"SYNTH_INV_IN_20261005","movement_date":"2026-10-05","direction":"IN","quantity":10,"received_from":"Synthetic supplier","issued_to":"","purpose":"Synthetic opening stock","received_by":"Synthetic receiver","receipt_signature":"synthetic-signed-voucher"}');
 if not (again->>'duplicate')::boolean then raise exception 'duplicate failed';end if;
 if (select coalesce(sum(quantity),0) from public.inventory_movements where movement_key='SYNTH_INV_IN_20261005' and posted_at is not null)<>0 then raise exception 'pending changed stock';end if;
 begin update public.inventory_items set unit_cost=1 where item_code='SYNTH_INV_20261005';raise exception 'direct edit bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into private.enterprise_assignments(profile_id,module,action,record_id,decision_reference)
select p.id,'inventory',a,i.id,'synthetic-inventory-certification-rollback'
from public.profiles p cross join public.inventory_items i cross join unnest(array['read','approve','execute']) a
where p.full_name='Staging Finance' and p.is_active and i.item_code='SYNTH_INV_20261005';
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.profiles where full_name='Staging Finance'),true);
set local role authenticated;
do $$declare posted jsonb;mid uuid;begin
 select id into mid from public.inventory_movements where movement_key='SYNTH_INV_IN_20261005';
 posted:=public.inventory_write('post',jsonb_build_object('item_code','SYNTH_INV_20261005','movement_id',mid,'approval_signature','synthetic-signed-approval'));
 if (posted->>'balance_after')::numeric<>10 then raise exception 'incorrect posted balance';end if;
 if (public.inventory_workspace()->>'total_value')::numeric<>1000 then raise exception 'incorrect value';end if;
 if jsonb_array_length(public.inventory_workspace()->'last_five')<>1 then raise exception 'latest movement missing';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.profiles where full_name='Staging Procurement'),true);
set local role authenticated;
do $$declare c jsonb;begin
 c:=public.inventory_write('count','{"item_code":"SYNTH_INV_20261005","count_key":"SYNTH_INV_COUNT_20261005","counted_quantity":9,"reason":"Synthetic off-Friday test"}');
 if (c->>'variance')::numeric<>-1 then raise exception 'incorrect count snapshot';end if;
 begin perform public.inventory_import('[{"item_code":"SYNTH_INV_20261005","movement_key":"SYNTH_INV_BATCH_20261005","movement_date":"2026-10-05","direction":"IN","quantity":1,"received_from":"Synthetic supplier","purpose":"Synthetic receipt","received_by":"Synthetic receiver","receipt_signature":"synthetic-voucher"},{"item_code":"UNKNOWN_SYNTH_ITEM"}]');raise exception 'invalid batch accepted';exception when others then if sqlerrm='invalid batch accepted' then raise;end if;end;
 if exists(select 1 from public.inventory_movements where movement_key='SYNTH_INV_BATCH_20261005') then raise exception 'partial upload persisted';end if;
end $$;
reset role;
rollback;
select 'PASS live synthetic inventory rollback certification' as result,
 (select count(*) from public.inventory_items where item_code='SYNTH_INV_20261005') as remaining_test_items,
 (select count(*) from private.enterprise_assignments where module='inventory') as remaining_inventory_assignments;
