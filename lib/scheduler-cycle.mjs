// Persist operational outcomes only, never exception text or returned care records.
export async function runSchedulerCycle(subsystems) {
  const outcomes = {};
  for (const [name, run] of Object.entries(subsystems)) {
    try {
      await run();
      outcomes[name] = { status: 'completed' };
    } catch {
      outcomes[name] = { status: 'failed', errorCode: 'subsystem_failed' };
    }
  }
  return { status: Object.values(outcomes).some(item => item.status === 'failed') ? 'failed' : 'completed', outcomes };
}
