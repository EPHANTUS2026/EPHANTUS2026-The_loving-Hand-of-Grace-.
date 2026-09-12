import { appFetch, expectStatus, requireEnv } from './lib.mjs';
requireEnv(['STAGING_PROVIDER_TOKEN']);
for (const channel of ['email','sms','whatsapp']) {
  const result = await appFetch(`/api/staging/providers/${channel}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.STAGING_PROVIDER_TOKEN}` },
    json: { action: 'send', payload: { recipient: channel === 'email' ? 'synthetic@example.test' : '+254700000000', templateKey: 'staging-smoke', message: 'Synthetic staging delivery test. No real client data.' } }
  });
  expectStatus(result, 200, `${channel} staging provider`);
  console.log(`✓ ${channel}: ${JSON.stringify(result.body)}`);
}
