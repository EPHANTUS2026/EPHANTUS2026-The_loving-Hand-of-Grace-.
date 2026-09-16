-- Align workflow execution persistence with the explicit clinical authority
-- already enforced by the GraceFlow transition route.

create or replace function public.graceflow_clinical_workflow_role_allowed()
returns boolean
language sql
stable
as $$
  select "current_role"() = any (array[
    'counsellor'::user_role,
    'clinician'::user_role,
    'clinical_director'::user_role,
    'doctor'::user_role,
    'psychologist'::user_role,
    'admissions'::user_role,
    'finance'::user_role,
    'administrator'::user_role,
    'manager'::user_role,
    'super_admin'::user_role
  ]);
$$;

drop policy if exists "workflow authorised insert" on public.workflow_instances;
create policy "workflow authorised insert" on public.workflow_instances
for insert to public with check (public.graceflow_clinical_workflow_role_allowed());

drop policy if exists "workflow authorised update" on public.workflow_instances;
create policy "workflow authorised update" on public.workflow_instances
for update to public using (public.graceflow_clinical_workflow_role_allowed())
with check (public.graceflow_clinical_workflow_role_allowed());

drop policy if exists "task authorised insert" on public.workflow_tasks;
create policy "task authorised insert" on public.workflow_tasks
for insert to public with check (public.graceflow_clinical_workflow_role_allowed());

drop policy if exists "task authorised update" on public.workflow_tasks;
create policy "task authorised update" on public.workflow_tasks
for update to public using (public.graceflow_clinical_workflow_role_allowed())
with check (public.graceflow_clinical_workflow_role_allowed());
