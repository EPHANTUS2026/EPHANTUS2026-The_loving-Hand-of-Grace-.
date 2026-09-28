import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Run the actual scheduler worker with an in-memory atomic database boundary.
const source = (await readFile(new URL('../lib/notification-delivery.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export async function', 'async function');
const bind = new Function('dbAdminSelect', 'dbUpdate', 'dispatchConnector', `${source}\nreturn processNotificationOutbox;`);
const seed = () => ({id:'synthetic', channel:'email', recipient:'approved@example.test', template_key:'approved', payload:{recipient:'forged@example.test',templateKey:'forged'}, status:'queued',attempt:0,max_attempts:2});
let row = seed();
let calls = 0;
const select = async () => [{...row}];
const update = async (_table, query, patch) => {
  if (query.includes('status=eq.queued') && (row.status !== 'queued' || !query.endsWith(`attempt=eq.${row.attempt}`))) return [];
  Object.assign(row, patch);
  return [{...row}];
};
const worker = bind(select, update, async ({payload}) => {
  calls++;
  assert.equal(payload.recipient,'approved@example.test');
  assert.equal(payload.templateKey,'approved');
  return {providerReference:'synthetic-reference'};
});
await Promise.all([worker(), worker()]);
assert.equal(calls,1,'Only the atomic claim winner may dispatch');
assert.equal(row.attempt,1);

row = seed();
const failing = bind(select, update, async () => {throw new Error('provider response contains private data');});
await failing();
assert.equal(row.status,'queued');
assert.equal(row.attempt,1);
assert.equal(row.last_error,'connector_dispatch_failed');
await failing();
assert.equal(row.status,'dead_letter');
assert.equal(row.attempt,2);

await assert.rejects(bind(async () => {throw new Error('database unavailable');}, update, async () => {})(), /database unavailable/);
await assert.rejects(bind(select, async () => {throw new Error('claim unavailable');}, async () => {throw new Error('must not dispatch');})(), /claim unavailable/);
console.log('Notification worker regression checks PASS: concurrent claim, recipient authority, retry exhaustion, redacted failure, database failure visibility');
