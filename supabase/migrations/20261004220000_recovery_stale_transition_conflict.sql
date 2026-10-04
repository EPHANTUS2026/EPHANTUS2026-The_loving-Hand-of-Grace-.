-- Stale application state is a conflict, not a retryable serialization failure.
-- Preserve the deployed function, including all authority and prerequisite gates.
do $migration$
declare
  definition text := pg_get_functiondef(
    'public.transition_recovery_journey(uuid,public.admission_stage,public.admission_stage,text)'::regprocedure
  );
begin
  if position('errcode=''40001''' in definition) > 0 then
    execute replace(definition, 'errcode=''40001''', 'errcode=''PT409''');
  elsif position('errcode=''PT409''' in definition) = 0 then
    raise exception 'Expected recovery conflict guard not found; migration aborted';
  end if;
end
$migration$;

