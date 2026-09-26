import assert from 'node:assert/strict';
import {project, graceOperationsBrief} from '../lib/operational-health-projection.mjs';
const now = Date.parse('2026-09-26T00:00:00Z');
const past = new Date(now - 1).toISOString(), future = new Date(now + 86400000).toISOString();
const cases = [
  ['overdue routine response', {requests: [{id:'r', status:'RECEIVED', priority:'NORMAL', response_due_at:past}]}, 'requests', 'overdue'],
  ['blocked task without deadline', {tasks: [{id:'t', status:'blocked'}]}, 'tasks', 'blocked'],
  ['expired active consent', {consents: [{id:'c', client_id:'a', status:'active', expires_at:past}]}, 'consents', 'count'],
  ['revoked active consent', {consents: [{id:'c', client_id:'a', status:'active', revoked_at:past}]}, 'consents', 'count'],
];
for (const [label, input, section, key] of cases) {
  const result = project(input, now);
  assert.equal(result.state, 'ATTENTION REQUIRED', label);
  assert.equal(result[section][key], 1, label);
  assert.equal(result.exceptions, 1, label);
  assert.ok(!graceOperationsBrief(result).includes('No configured'), label);
}
const closed = project({requests:['RESOLVED','CLOSED','cancelled'].map((status,id)=>({id,status,priority:'URGENT',response_due_at:past})), tasks:[{id:'done',status:'completed',due_at:past}]}, now);
assert.equal(closed.state,'HEALTHY');assert.equal(closed.requests.count,0);assert.equal(closed.tasks.count,0);
const urgent=project({requests:[{id:'r',status:'RECEIVED',priority:'URGENT',response_due_at:past}]},now);
assert.equal(urgent.state,'CRITICAL ATTENTION');assert.equal(urgent.exceptions,1,'same support record counted once');
const boundary=project({aftercare:[{id:'a',client_id:'c',status:'active',next_review_at:new Date(now).toISOString()},{id:'b',client_id:'c',status:'active',next_review_at:future}]},now);
assert.equal(boundary.aftercare.overdue,1);assert.equal(boundary.aftercare.due,1);assert.equal(boundary.aftercare.onTrack,0);
assert.equal(boundary.queues.aftercare.length,2);
console.log('Operational health regression checks PASS');
