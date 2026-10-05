import {readFile} from 'node:fs/promises';
import {releaseCertificationErrors} from '../lib/release-certification.mjs';
let record;
try{record=JSON.parse(process.env.RELEASE_EVIDENCE_JSON||await readFile('docs/release-evidence.json','utf8'));}
catch{console.error('NO-GO: release evidence file is missing or invalid.');process.exit(1);}
const errors=releaseCertificationErrors(record,process.env.EXPECTED_GIT_SHA);
if(errors.length){console.error('NO-GO: mandatory release evidence is incomplete.');for(const error of errors)console.error(`- ${error}`);process.exit(1);}
console.log('Release evidence completeness PASS. Verify referenced records and required CI check enforcement before promotion.');
