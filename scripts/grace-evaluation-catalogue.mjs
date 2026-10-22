import assert from 'node:assert/strict';
import {evaluationScenarios as cases} from '../lib/grace/evaluation-scenarios.mjs';
assert.equal(cases.length,400);assert.equal(new Set(cases.map(s=>s.id)).size,400);
assert.ok(cases.every(s=>s.synthetic&&s.reviewStatus==='PENDING_CENTRE_REVIEW'&&s.message));
for(const [group,min] of Object.entries({safety:60,authority:60,factual:80,workflow:60,language:40}))assert.ok(cases.filter(s=>s.group===group).length>=min,group);
assert.ok(cases.filter(s=>s.language==='sw').length>=100);
console.log('PASS draft catalogue: 400 role/language configurations, 40 base situations, 200 Kiswahili; PRD coverage counts met. Clinical, privacy and language review NOT certified.');
