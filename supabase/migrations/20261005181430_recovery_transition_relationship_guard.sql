-- Forward repair: retain the existing recovery lifecycle and role gates while
-- requiring current journey/care authority for linked client admissions.
-- Unlinked intake enquiries retain their existing role-controlled behaviour.
do $repair$
declare definition text; guard text := $guard$
if v_a.client_id is not null and not public.grace_staff_authority(v_a.client_id,'journey','care') then
 raise exception 'client_relationship_required' using errcode='42501';
end if;
$guard$;
begin
 definition := pg_get_functiondef('public.transition_recovery_journey(uuid,public.admission_stage,public.admission_stage,text)'::regprocedure);
 if position('client_relationship_required' in definition)>0 then return;end if;
 if (length(definition)-length(replace(definition,'if v_a.stage','')))/length('if v_a.stage')<>1 then
  raise exception 'recovery_transition_repair_anchor_mismatch';
 end if;
 execute replace(definition,'if v_a.stage',guard||'if v_a.stage');
end $repair$;
