import assert from 'node:assert/strict';
import {providerHealthState,persistedHealthStatus} from '../lib/provider-health-state.mjs';
for(const [input,state] of [
  [{enabled:false,configured:true},'disabled'],
  [{enabled:true,configured:false},'unconfigured'],
  [{enabled:true,configured:true},'configured-unverified'],
  [{enabled:true,configured:true,health:{ok:true,verification:'unverified'}},'configured-unverified'],
  [{enabled:true,configured:true,health:{ok:true}},'healthy'],
  [{enabled:true,configured:true,health:{ok:false}},'degraded'],
]) assert.equal(providerHealthState(input),state);
assert.equal(persistedHealthStatus('configured-unverified'),'degraded');
console.log('PASS provider configuration never implies verified health');
