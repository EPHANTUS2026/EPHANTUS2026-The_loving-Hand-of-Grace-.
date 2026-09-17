-- GRACE360 release-gate Supabase hardening.
-- Mirrors the verified staging database changes applied during release certification.

-- Published meditation reads execute with the caller's permissions and underlying RLS.
alter view public.grace_published_meditations set (security_invoker = true);

-- Internal operational tables are server/service-role controlled. Keep RLS enabled and
-- remove direct browser-role privileges. Explicit deny policies keep the RLS posture visible.
revoke all privileges on table public.booking_slot_holds from anon, authenticated;
revoke all privileges on table public.booking_staff_pool from anon, authenticated;
revoke all privileges on table public.graceflow_engine_leases from anon, authenticated;
revoke all privileges on table public.meditation_review_events from anon, authenticated;
revoke all privileges on table public.passport_visibility_rules from anon, authenticated;

drop policy if exists booking_slot_holds_no_direct_client_access on public.booking_slot_holds;
create policy booking_slot_holds_no_direct_client_access on public.booking_slot_holds for all to anon, authenticated using (false) with check (false);
drop policy if exists booking_staff_pool_no_direct_client_access on public.booking_staff_pool;
create policy booking_staff_pool_no_direct_client_access on public.booking_staff_pool for all to anon, authenticated using (false) with check (false);
drop policy if exists graceflow_engine_leases_no_direct_client_access on public.graceflow_engine_leases;
create policy graceflow_engine_leases_no_direct_client_access on public.graceflow_engine_leases for all to anon, authenticated using (false) with check (false);
drop policy if exists meditation_review_events_no_direct_client_access on public.meditation_review_events;
create policy meditation_review_events_no_direct_client_access on public.meditation_review_events for all to anon, authenticated using (false) with check (false);
drop policy if exists passport_visibility_rules_no_direct_client_access on public.passport_visibility_rules;
create policy passport_visibility_rules_no_direct_client_access on public.passport_visibility_rules for all to anon, authenticated using (false) with check (false);

-- Grace response feedback is authenticated and user-scoped.
revoke all privileges on table public.grace_response_feedback from anon, authenticated;
grant select, insert on table public.grace_response_feedback to authenticated;
drop policy if exists grace_response_feedback_own_select on public.grace_response_feedback;
drop policy if exists grace_response_feedback_own_insert on public.grace_response_feedback;
create policy grace_response_feedback_own_select on public.grace_response_feedback for select to authenticated using ((select auth.uid()) = user_id);
create policy grace_response_feedback_own_insert on public.grace_response_feedback for insert to authenticated with check ((select auth.uid()) = user_id);

-- Identity helpers deliberately remain SECURITY DEFINER because they are referenced from
-- profiles RLS; SECURITY INVOKER here recursively re-enters profiles policies. They are
-- not anonymous RPCs, and their search_path is already pinned to public.
alter function public.current_client_id() security definer;
alter function public.current_profile() security definer;
alter function public.current_profile_role() security definer;
alter function public.current_role() security definer;
alter function public.current_staff_id() security definer;
alter function public.is_staff_user() security definer;
revoke execute on function public.current_client_id() from public, anon;
revoke execute on function public.current_profile() from public, anon;
revoke execute on function public.current_profile_role() from public, anon;
revoke execute on function public.current_role() from public, anon;
revoke execute on function public.current_staff_id() from public, anon;
revoke execute on function public.is_staff_user() from public, anon;
grant execute on function public.current_client_id() to authenticated;
grant execute on function public.current_profile() to authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.is_staff_user() to authenticated;

-- Clinical authority must be consistent across GraceFlow, operational APIs and RLS.
drop policy if exists "discharge care staff" on public.discharge_plans;
create policy "discharge care staff" on public.discharge_plans for all to authenticated
using (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']))
with check (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']));
drop policy if exists "aftercare care staff" on public.aftercare_plans;
create policy "aftercare care staff" on public.aftercare_plans for all to authenticated
using (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']))
with check (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']));
drop policy if exists "aftercare review care staff" on public.aftercare_reviews;
create policy "aftercare review care staff" on public.aftercare_reviews for all to authenticated
using (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']))
with check (public.current_role()::text = any(array['counsellor','clinician','clinical_director','doctor','psychologist','administrator','super_admin']));

-- Keep public execution for confirm_booking_slot and search_grace_approved_knowledge:
-- those are intentional public application boundaries and are separately constrained.
