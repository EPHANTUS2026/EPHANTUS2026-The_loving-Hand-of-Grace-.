export function providerHealthState({enabled, configured, health = null}) {
  if (!enabled) return 'disabled';
  if (!configured) return 'unconfigured';
  if (!health || health.verification === 'unverified') return 'configured-unverified';
  return health.ok ? 'healthy' : 'degraded';
}
// Preserve the existing database status constraint; exact state lives in metadata.
export const persistedHealthStatus = state => ['healthy','unconfigured'].includes(state) ? state : 'degraded';
