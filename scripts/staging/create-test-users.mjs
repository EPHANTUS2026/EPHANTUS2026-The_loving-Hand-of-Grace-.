import { createAuthUser, restInsert, restSelect, restUpdate, requireEnv } from './lib.mjs';

requireEnv(['STAGING_TEST_PASSWORD']);
const password = process.env.STAGING_TEST_PASSWORD;
const domain = process.env.STAGING_TEST_EMAIL_DOMAIN || 'example.test';
const prefix = process.env.STAGING_TEST_EMAIL_PREFIX || 'lhg-stage';

const roles = [
  ['super_admin','Staging Super Admin','Platform Administration','Administration'],
  ['director','Staging Director','Centre Director','Management'],
  ['clinical_director','Staging Clinical Director','Clinical Director','Clinical'],
  ['doctor','Staging Doctor','Doctor','Clinical'],
  ['nurse','Staging Nurse','Nurse','Clinical'],
  ['psychologist','Staging Psychologist','Psychologist','Clinical'],
  ['counsellor','Staging Counsellor','Counsellor','Clinical'],
  ['social_worker','Staging Social Worker','Social Worker','Clinical'],
  ['case_manager','Staging Case Manager','Case Manager','Clinical'],
  ['aftercare_coordinator','Staging Aftercare Coordinator','Aftercare Coordinator','Aftercare'],
  ['family_liaison','Staging Family Liaison','Family Liaison','Family Services'],
  ['admissions','Staging Admissions','Admissions Officer','Admissions'],
  ['finance','Staging Finance','Finance Officer','Finance'],
  ['hr','Staging HR','HR Officer','People'],
  ['procurement','Staging Procurement','Procurement Officer','Resources'],
  ['inventory','Staging Inventory','Inventory Officer','Resources'],
  ['project_manager','Staging Project Manager','Project Manager','Operations'],
  ['helpdesk','Staging Helpdesk','Helpdesk Officer','Operations'],
  ['marketing','Staging Marketing','Marketing Officer','Growth'],
  ['accountant','Staging Accountant','Accountant','Finance'],
  ['field_service','Staging Field Service','Field Service Officer','Operations'],
  ['staff','Staging Staff','Staff Member','General']
];

for (const [role, fullName, jobTitle, department] of roles) {
  const email = `${prefix}+${role.replaceAll('_','-')}@${domain}`;
  const existingProfiles = await restSelect('profiles', `role=eq.${encodeURIComponent(role)}&full_name=eq.${encodeURIComponent(fullName)}&select=id,auth_user_id,staff_id`);
  if (existingProfiles?.length) {
    console.log(`↺ ${role}: profile already exists (${email})`);
    continue;
  }
  let user;
  try {
    user = await createAuthUser({ email, password, fullName });
  } catch (error) {
    if (!String(error.message).includes('already been registered')) throw error;
    console.warn(`! ${email} already exists in Auth; create/repair its profile manually if necessary.`);
    continue;
  }
  const staffCode = `STG-${role.toUpperCase().replaceAll('_','-').slice(0,18)}`;
  let staffRows = await restSelect('staff', `staff_code=eq.${encodeURIComponent(staffCode)}&select=id`);
  const staff = staffRows?.[0] || (await restInsert('staff', { staff_code: staffCode, full_name: fullName, job_title: jobTitle, department, active: true }))?.[0];
  await restInsert('profiles', { auth_user_id: user.id, full_name: fullName, role, is_active: true, staff_id: staff.id });
  console.log(`✓ ${role}: ${email}`);
}

console.log('\nStaging staff users created. Password was read from STAGING_TEST_PASSWORD and was not printed.');
