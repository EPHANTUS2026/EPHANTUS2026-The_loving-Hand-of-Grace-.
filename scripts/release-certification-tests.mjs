import assert from 'node:assert/strict';
import {releaseCertificationErrors,requiredReleaseGates} from '../lib/release-certification.mjs';
const sha='a'.repeat(40);
const valid={candidateSha:sha,stagingProjectId:'prj_fabxbaSexQuS7In3lDTb2tGFxUHZ',supabaseRef:'rpszhpjmchirzzndasrb',deploymentId:'dpl_synthetic',migrationVersions:['20261005010009'],gates:Object.fromEntries(requiredReleaseGates.map(name=>[name,{status:'passed',candidateSha:sha,reviewer:'Synthetic reviewer',evidence:'synthetic fixture only',reviewedAt:'2026-10-05T15:00:00+03:00'}]))};
assert.deepEqual(releaseCertificationErrors(valid,sha),[]);
assert.ok(releaseCertificationErrors(undefined,sha).length);
assert.ok(releaseCertificationErrors(valid,'b'.repeat(40)).length);
for(const name of requiredReleaseGates){
 for(const status of ['pending','blocked','failed',undefined]){
  const copy=structuredClone(valid);copy.gates[name].status=status;
  assert.ok(releaseCertificationErrors(copy,sha).some(x=>x.startsWith(name+':')));
 }
 for(const field of ['reviewer','evidence','reviewedAt','candidateSha']){
  const copy=structuredClone(valid);delete copy.gates[name][field];
  assert.ok(releaseCertificationErrors(copy,sha).some(x=>x.startsWith(name+':')));
 }
}
for(const field of ['deploymentId','migrationVersions','supabaseRef','stagingProjectId']){
 const copy=structuredClone(valid);delete copy[field];assert.ok(releaseCertificationErrors(copy,sha).length);
}
console.log('PASS release evidence missing/failed/blocked gates, exact SHA, identities and attributable receipt requirements. Synthetic tests do not constitute acceptance.');
