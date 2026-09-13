import { appFetch, expectStatus, requireEnv } from './lib.mjs';
requireEnv(['GRACEFLOW_ENGINE_SECRET']);
const result = await appFetch('/api/graceflow/scheduler', {
  method: 'POST',
  headers: { 'x-graceflow-secret': process.env.GRACEFLOW_ENGINE_SECRET }
});
expectStatus(result, 200, 'GraceFlow scheduler');
console.log(JSON.stringify(result.body, null, 2));
