-- Public readers must not evaluate the authenticated-only staff-role helper.
-- Published visibility and mandatory approval predicates are unchanged.
alter policy "meditations staff govern" on public.meditations to authenticated;
