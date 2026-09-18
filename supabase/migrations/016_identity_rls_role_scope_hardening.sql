-- Authentication role-scope hardening.
-- Evidence-driven: preserve existing predicates and behavior while preventing anon
-- from entering sensitive table RLS policies. Intentional anonymous RPC boundaries
-- confirm_booking_slot and search_grace_approved_knowledge are not changed here.

alter policy "own profile" on public.profiles to authenticated;
alter policy "staff profiles admin" on public.profiles to authenticated;

alter policy "care staff clients" on public.clients to authenticated;
alter policy "care staff insert clients" on public.clients to authenticated;
alter policy "care staff update clients" on public.clients to authenticated;
alter policy "client self" on public.clients to authenticated;
alter policy "family client basic" on public.clients to authenticated;

alter policy "staff directory authorised" on public.staff to authenticated;

alter policy "family own" on public.family_members to authenticated;
alter policy "family staff manage" on public.family_members to authenticated;
alter policy "family approved updates" on public.family_updates to authenticated;
alter policy "family update staff" on public.family_updates to authenticated;

alter policy "care plans staff" on public.care_plans to authenticated;
alter policy "care sessions staff" on public.care_sessions to authenticated;

alter policy "passport_reflections_client_insert" on public.recovery_passport_reflections to authenticated;
alter policy "passport_reflections_client_select" on public.recovery_passport_reflections to authenticated;
alter policy "passport_reflections_client_update" on public.recovery_passport_reflections to authenticated;
alter policy "passport_projection_client_select" on public.passport_projection_events to authenticated;
