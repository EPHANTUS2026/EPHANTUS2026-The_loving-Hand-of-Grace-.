begin;
set local role service_role;
do $$
declare r jsonb; r2 jsonb; k text:=encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex'); i integer;
begin
 for i in 1..30 loop assert public.consume_grace_model_quota(k); end loop;
 assert not public.consume_grace_model_quota(k);
 r:=public.create_grace_request_atomic(k,repeat('a',64),null,'PUBLIC','appointment_request',
 '{"name":"Synthetic verification","phone":"+254700000003","email":""}'::jsonb,'');
 r2:=public.create_grace_request_atomic(k,repeat('a',64),null,'PUBLIC','appointment_request',
 '{"name":"Synthetic verification","phone":"+254700000003","email":""}'::jsonb,'');
 assert r=r2;
 assert r->>'status'='submitted';
 assert r->>'deliveryStatus'='queued';
 assert (select count(*) from public.grace_action_commands where idempotency_key=k)=1;
 begin
  perform public.create_grace_request_atomic(k,repeat('b',64),null,'PUBLIC','appointment_request',
  '{"phone":"+254700000003"}'::jsonb,'');
  raise exception 'conflict_not_rejected';
 exception when others then
  if sqlerrm <> 'conflicting retry' then raise; end if;
 end;
 assert not has_function_privilege('anon','public.create_grace_request_atomic(text,text,uuid,text,text,jsonb,text)','execute');
 assert not has_function_privilege('authenticated','public.consume_grace_model_quota(text)','execute');
end $$;
rollback;
