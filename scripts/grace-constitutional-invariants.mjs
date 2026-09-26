import assert from 'node:assert/strict';
import {
  GRACE_CONSTITUTION,
  GRACE_OPERATING_MODES,
  CONVERSATIONAL_STATES,
  CLINICAL_AUTHORITY,
  resolveGraceOperatingMode,
  clinicalAuthorityDecision,
} from '../lib/grace/constitution.js';

assert.equal(GRACE_CONSTITUTION.length,14);
assert.ok(GRACE_CONSTITUTION.includes('HUMAN_CLINICAL_AUTHORITY'));
assert.equal(GRACE_OPERATING_MODES.CLIENT.authority,'SELF_ONLY');
assert.equal(GRACE_OPERATING_MODES.FAMILY.authority,'CONSENT_SCOPED_RELATIONSHIP');
assert.equal(GRACE_OPERATING_MODES.STAFF.authority,'ROLE_ASSIGNMENT_SCOPE_PURPOSE');
assert.equal(CONVERSATIONAL_STATES.URGENT_SAFETY,'URGENT_SAFETY');
assert.equal(CLINICAL_AUTHORITY.consequentialOutcome,'HUMAN_REVIEW_REQUIRED');

const anonymous=resolveGraceOperatingMode({});
assert.equal(anonymous,'PUBLIC');
const client=resolveGraceOperatingMode({session:{profile:{is_active:true,role:'client'}}});
assert.equal(client,'CLIENT');
const family=resolveGraceOperatingMode({session:{profile:{is_active:true,role:'family'}}});
assert.equal(family,'FAMILY');
const staff=resolveGraceOperatingMode({session:{profile:{is_active:true,role:'counsellor'}}});
assert.equal(staff,'STAFF');
const forged=resolveGraceOperatingMode({requestedMode:'STAFF'});
assert.equal(forged,'PUBLIC');
const emergency=resolveGraceOperatingMode({safetyLevel:'EMERGENCY',session:{profile:{is_active:true,role:'client'}}});
assert.equal(emergency,'SAFETY');

for(const intent of ['DIAGNOSIS_REQUEST','MEDICATION_OR_MEDICAL_REQUEST','CLINICAL_DECISION_REQUEST']){
  const decision=clinicalAuthorityDecision(intent);
  assert.equal(decision.decision,'HUMAN_REVIEW_REQUIRED');
  assert.equal(decision.mayExecute,false);
}
assert.equal(clinicalAuthorityDecision('RECOVERY_EDUCATION').mayExecute,true);

console.log('Grace constitutional invariants: PASS');
