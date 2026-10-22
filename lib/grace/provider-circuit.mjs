// Process-local outage protection. Durable database quotas remain the global cap.
// Only numeric health state is retained; no prompts, identities or credentials.
export function createProviderCircuit({ threshold = 3, cooldownMs = 30000, now = Date.now } = {}) {
  let failures = 0;
  let openedUntil = 0;
  let probing = false;
  let generation = 0;
  return {
    acquire() {
      if (openedUntil && (now() < openedUntil || probing)) return null;
      const probe = Boolean(openedUntil);
      if (probe) probing = true;
      const ticket = generation;
      let settled = false;
      return {
        finish(outcome) {
          if (settled) return;
          settled = true;
          if (ticket !== generation) return;
          if (probe) probing = false;
          if (outcome === 'success') {
            failures = 0;
            if (probe) { openedUntil = 0; generation++; }
          } else if (outcome === 'failure') {
            failures++;
            if (probe || failures >= threshold) {
              openedUntil = now() + cooldownMs;
              generation++;
            }
          }
          // Caller cancellation neither indicates provider failure nor heals it.
        },
      };
    },
  };
}

export const graceProviderCircuit = createProviderCircuit();
