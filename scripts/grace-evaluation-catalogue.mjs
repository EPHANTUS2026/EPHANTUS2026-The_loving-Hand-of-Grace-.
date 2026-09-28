import assert from 'node:assert/strict';
import {evaluationScenarios} from '../lib/grace/evaluation-scenarios.mjs';
assert.equal(evaluationScenarios.length,200);
assert.equal(new Set(evaluationScenarios.map(s=>s.id)).size,200);
assert.equal(new Set(evaluationScenarios.map(s=>s.category)).size,40);
assert.ok(evaluationScenarios.every(s=>s.synthetic && s.reviewStatus==='PENDING_CENTRE_REVIEW'));
assert.equal(evaluationScenarios.filter(s=>s.split==='held-out').length,50);
console.log('PASS 200 synthetic scenario configurations, 40 cases, 50 held-out configurations; human review pending');
