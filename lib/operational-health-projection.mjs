const DAY = 86400000;
const lower = value => String(value || '').toLowerCase();
const time = value => value ? Date.parse(value) : NaN;
export function project({admissions = [], consents = [], aftercare = [], tasks = [], requests = [], events = []}, now = Date.now()) {
  const overdue = value => time(value) <= now;
  const due = (value, window) => time(value) > now && time(value) <= now + window;
  const assessments = admissions.filter(x => lower(x.stage) === 'assessment');
  const assessmentOverdue = assessments.filter(x => overdue(x.next_action_due));
  const assessmentSoon = assessments.filter(x => due(x.next_action_due, DAY));
  const consentActions = consents.filter(x => x.revoked_at || overdue(x.expires_at) || ['pending', 'incomplete', 'verification_required', 'expired', 'revoked'].includes(lower(x.status)) || due(x.expires_at, 30 * DAY));
  const consentExpiring = consentActions.filter(x => !x.revoked_at && due(x.expires_at, 30 * DAY));
  const plans = aftercare.filter(x => ['active', 'approved', 'ready_for_review'].includes(lower(x.status)));
  const planOverdue = plans.filter(x => overdue(x.next_review_at));
  const planDue = plans.filter(x => due(x.next_review_at, 7 * DAY));
  const openTasks = tasks.filter(x => ['queued', 'active', 'blocked'].includes(lower(x.status)));
  const taskOverdue = openTasks.filter(x => overdue(x.due_at));
  const taskBlocked = openTasks.filter(x => lower(x.status) === 'blocked');
  const taskHigh = openTasks.filter(x => ['high', 'urgent', 'critical'].includes(lower(x.payload?.priority)));
  const openRequests = requests.filter(x => !['resolved', 'closed', 'cancelled'].includes(lower(x.status)));
  const urgent = openRequests.filter(x => ['urgent', 'critical'].includes(lower(x.priority)));
  const responseOverdue = openRequests.filter(x => overdue(x.response_due_at) && !x.first_responded_at);
  const queueRow = (kind, x, reason, href) => ({key: `${kind}:${x.id}`, id: x.id, kind, label: x.reference || x.title || x.subject || x.consent_type || kind, reason, href});
  const consentQueue = consentActions.map(x => queueRow('Consent', x, x.revoked_at || lower(x.status) === 'revoked' ? 'Revoked' : overdue(x.expires_at) ? 'Expired' : due(x.expires_at, 30 * DAY) ? 'Expiring within 30 days' : 'Consent review required', `/staff/clients/${x.client_id}`));
  const aftercareQueue = plans.map(x => queueRow('Aftercare', x, overdue(x.next_review_at) ? 'Review overdue' : due(x.next_review_at, 7 * DAY) ? 'Review due within 7 days' : 'On track', `/staff/clients/${x.client_id}/aftercare`));
  const exceptions = [
    ...assessmentOverdue.map(x => queueRow('Assessment', x, 'Assessment overdue', `/staff/admissions/${x.id}`)),
    ...planOverdue.map(x => queueRow('Aftercare', x, 'Review overdue', `/staff/clients/${x.client_id}/aftercare`)),
    ...openTasks.filter(x => overdue(x.due_at) || lower(x.status) === 'blocked').map(x => queueRow('Task', x, lower(x.status) === 'blocked' ? 'Blocked' : 'Task overdue', '/staff/graceflow')),
    ...openRequests.filter(x => urgent.includes(x) || responseOverdue.includes(x)).map(x => queueRow('Support', x, responseOverdue.includes(x) ? 'Response overdue' : 'Urgent support', '/staff/cases')),
    ...consentQueue.filter(x => ['Expired', 'Revoked'].includes(x.reason)),
  ];
  const critical = urgent.some(x => responseOverdue.includes(x)) || openTasks.some(x => lower(x.payload?.priority) === 'critical' && overdue(x.due_at));
  const attention = exceptions.length || assessmentSoon.length || consentActions.length || planDue.length || taskHigh.length;
  return {
    generatedAt: new Date(now).toISOString(),
    state: critical ? 'CRITICAL ATTENTION' : attention ? 'ATTENTION REQUIRED' : 'HEALTHY',
    admissions: {count: assessments.length, overdue: assessmentOverdue.length, dueSoon: assessmentSoon.length, unassigned: assessments.filter(x => !x.assigned_staff_id).length},
    consents: {count: consentActions.length, expiring: consentExpiring.length},
    aftercare: {count: plans.length, onTrack: plans.length - planDue.length - planOverdue.length, due: planDue.length, overdue: planOverdue.length},
    tasks: {count: openTasks.length, high: taskHigh.length, overdue: taskOverdue.length, blocked: taskBlocked.length, unassigned: openTasks.filter(x => !x.assigned_staff_id).length},
    requests: {count: openRequests.length, urgent: urgent.length, overdue: responseOverdue.length},
    exceptions: exceptions.length, queues: {consent: consentQueue, aftercare: aftercareQueue, exceptions}, events,
  };
}
export function graceOperationsBrief(h) {
  if (h.state === 'HEALTHY') return 'No configured operational signals currently require attention.';
  const parts = [];
  if (h.admissions.overdue) parts.push(`${h.admissions.overdue} overdue assessments`);
  if (h.aftercare.due + h.aftercare.overdue) parts.push(`${h.aftercare.due + h.aftercare.overdue} aftercare reviews due or overdue`);
  if (h.requests.urgent) parts.push(`${h.requests.urgent} urgent support requests`);
  if (h.requests.overdue) parts.push(`${h.requests.overdue} overdue support responses`);
  if (h.tasks.overdue) parts.push(`${h.tasks.overdue} overdue GraceFlow tasks`);
  if (h.tasks.blocked) parts.push(`${h.tasks.blocked} blocked GraceFlow tasks`);
  if (h.consents.count) parts.push(`${h.consents.count} consent reviews required`);
  return `${parts.length ? parts.join('; ') : 'Operational attention is required'}.`;
}
