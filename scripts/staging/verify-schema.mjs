import { restSelect } from './lib.mjs';

const expected = [
  'clients','staff','profiles','admissions','care_plans','care_goals','care_sessions','discharge_plans','aftercare_plans','aftercare_reviews',
  'workflow_instances','workflow_tasks','workflow_definitions','workflow_events','workflow_approvals','workflow_definition_versions','workflow_triggers','workflow_schedules',
  'workflow_approval_matrix_rules','workflow_sla_policies','workflow_escalation_rules','workflow_notifications','workflow_engine_runs','workflow_node_executions',
  'recovery_stage_catalog','recovery_journeys','recovery_journey_events','recovery_milestones','skill_programs','client_skill_plans','reintegration_plans',
  'consent_records','knowledge_articles','notification_outbox','integration_connectors','connector_executions','audit_events','grace_ai_audit','feature_flags','system_events',
  'integration_health_checks','graceflow_scheduler_runs','graceflow_engine_leases'
];

let failed = 0;
for (const table of expected) {
  try {
    await restSelect(table, 'select=*&limit=1');
    console.log(`✓ ${table}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${table}: ${error.message}`);
  }
}
if (failed) {
  console.error(`\nSchema verification failed: ${failed} required table(s) unavailable.`);
  process.exit(1);
}
console.log(`\nSchema verification passed (${expected.length} required tables).`);
