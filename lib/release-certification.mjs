export const requiredReleaseGates = Object.freeze([
 'exactDeploymentIdentity','engineeringAssurance','enterpriseAuthority',
 'responsiveAccessibilityPerformance','graceRulesAndEnhanced',
 'englishFemaleVoice','kiswahiliFemaleVoice','singleScheduler',
 'notificationDeliveryAndRecovery','clinicalReview','privacyReview',
 'kiswahiliReview','operationalReview','monitoringAlertReceipt',
 'isolatedBackupRestore','stagingRollback','productionIdentity','productionApproval',
]);

export function releaseCertificationErrors(record, expectedSha){
 const errors=[];
 if(!/^[a-f0-9]{40}$/.test(expectedSha||''))errors.push('expected candidate SHA is missing or invalid');
 if(!record||typeof record!=='object')return [...errors,'release evidence is missing'];
 if(record.candidateSha!==expectedSha)errors.push('release evidence does not match the exact candidate SHA');
 if(record.stagingProjectId!=='prj_fabxbaSexQuS7In3lDTb2tGFxUHZ')errors.push('canonical LHG staging project identity is missing or incorrect');
 if(record.supabaseRef!=='rpszhpjmchirzzndasrb')errors.push('LHG database identity is missing or incorrect');
 if(!/^dpl_[A-Za-z0-9]+$/.test(record.deploymentId||''))errors.push('deployment ID is missing');
 if(!Array.isArray(record.migrationVersions)||!record.migrationVersions.length||record.migrationVersions.some(x=>!/^\d{14}$/.test(x)))errors.push('applied migration inventory is missing or invalid');
 for(const name of requiredReleaseGates){
  const gate=record.gates?.[name];
  if(gate?.status!=='passed'){errors.push(`${name}: ${gate?.status||'missing'}`);continue;}
  if(gate.candidateSha!==expectedSha)errors.push(`${name}: evidence belongs to a different candidate`);
  if(typeof gate.reviewer!=='string'||!gate.reviewer.trim())errors.push(`${name}: accountable reviewer/operator missing`);
  if(typeof gate.evidence!=='string'||!gate.evidence.trim())errors.push(`${name}: evidence reference missing`);
  if(typeof gate.reviewedAt!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(gate.reviewedAt)||!Number.isFinite(Date.parse(gate.reviewedAt)))errors.push(`${name}: review timestamp missing or invalid`);
 }
 return errors;
}
