import {dbSelect} from './supabase-rest';
import {project} from './operational-health-projection.mjs';
export {project, graceOperationsBrief} from './operational-health-projection.mjs';
// All reads use the caller's token and RLS; page through the API row limit.
export async function operationalHealth(token) {
  const all = async (table, query) => {
    const rows = [];
    for (let offset = 0; ; ) {
      const page = await dbSelect(table, `${query}&order=id.asc&limit=500&offset=${offset}`, token);
      if (!Array.isArray(page)) throw new Error(`Invalid operational response: ${table}`);
      rows.push(...page);
      if (!page.length) return rows;
      offset += page.length;
    }
  };
  const [admissions, consents, aftercare, tasks, requests, events] = await Promise.all([
    all('admissions', 'select=id,reference,stage,priority,assigned_staff_id,next_action_due&stage=eq.assessment'),
    all('consents', 'select=id,client_id,consent_type,status,expires_at,revoked_at'),
    all('aftercare_plans', 'select=id,client_id,status,next_review_at,assigned_staff_id'),
    all('workflow_tasks', 'select=id,title,status,due_at,assigned_staff_id,payload&status=in.(queued,active,blocked)'),
    all('client_support_requests', 'select=id,subject,status,priority,response_due_at,first_responded_at&status=not.in.(RESOLVED,CLOSED)'),
    dbSelect('audit_events', 'select=id,event_type,action,entity_type,created_at&order=created_at.desc&limit=12', token),
  ]);
  return project({admissions, consents, aftercare, tasks, requests, events});
}
