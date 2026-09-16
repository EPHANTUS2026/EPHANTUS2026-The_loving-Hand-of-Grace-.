-- Keep the admissions system-of-record authorization aligned with the
-- application GraceFlow clinical authority model. Without this, a valid
-- clinical_director session can authorize a transition at the route layer
-- but RLS hides the admission row, producing a misleading 404.

drop policy if exists "admissions authorised" on public.admissions;

create policy "admissions authorised" on public.admissions
for all
to public
using (
  "current_role"() = any (
    array[
      'admissions'::user_role,
      'clinician'::user_role,
      'clinical_director'::user_role,
      'doctor'::user_role,
      'psychologist'::user_role,
      'counsellor'::user_role,
      'administrator'::user_role,
      'super_admin'::user_role
    ]
  )
)
with check (
  "current_role"() = any (
    array[
      'admissions'::user_role,
      'clinician'::user_role,
      'clinical_director'::user_role,
      'doctor'::user_role,
      'psychologist'::user_role,
      'counsellor'::user_role,
      'administrator'::user_role,
      'super_admin'::user_role
    ]
  )
);
