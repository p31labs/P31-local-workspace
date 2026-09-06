import type { Widget } from '../types';

// Maps a role + view-data payload to a list of widgets. This is the single
// source of truth that replaces the per-role hardcoded JSX switches previously
// in UserTestDashboard. Low-spoons truncation happens in the generator.
export function buildWidgets(viewData: any, role: string, _spoons: number): Widget[] {
  const w: Widget[] = [];
  const deadlines = viewData?.deadlines;

  if (role === 'coordinator') {
    pushStat(w, viewData, 'participants_count', 'Participants');
    pushStat(w, viewData, 'sessions_count', 'Sessions');
    pushStat(w, viewData, 'payments_pending', 'Pending Payments');
    pushStat(w, viewData, 'days_until_aug1', 'Days to Aug 1');
    if (viewData?.participants_by_cohort)
      w.push({ type: 'metric-grid', id: 'cohort', title: 'By Cohort', dataBinding: 'participants_by_cohort' });
    if (viewData?.sessions_by_phase)
      w.push({ type: 'metric-grid', id: 'phase', title: 'By Phase', dataBinding: 'sessions_by_phase' });
    if (Array.isArray(deadlines) && deadlines.length)
      w.push({ type: 'deadline-list', id: 'deadlines', title: 'Deadlines', dataBinding: 'deadlines' });
    if ((viewData?.payments_pending ?? 0) > 0)
      w.push({ type: 'queue-panel', id: 'queue', title: 'Payment Queue', dataBinding: 'payments_pending' });
  } else if (role === 'researcher') {
    pushStat(w, viewData, 'wcag_pass_rate', 'WCAG Pass %');
    pushStat(w, viewData, 'avg_spoons_start', 'Avg Spoons Start');
    pushStat(w, viewData, 'avg_spoons_end', 'Avg Spoons End');
    pushStat(w, viewData, 'spoon_fit', 'Spoon Fit');
    if (viewData?.findings_by_severity)
      w.push({ type: 'alert-list', id: 'findings', title: 'Findings by Severity', dataBinding: 'findings_by_severity' });
    if (Array.isArray(deadlines) && deadlines.length)
      w.push({ type: 'deadline-list', id: 'deadlines', title: 'Deadlines', dataBinding: 'deadlines' });
  } else if (role === 'participant') {
    const sessions = viewData?.sessions;
    if (Array.isArray(sessions) && sessions.length)
      w.push({ type: 'transaction-feed', id: 'sessions', title: 'Your Sessions', dataBinding: 'sessions', props: { showPayments: true } });
    else
      w.push({ type: 'text-block', id: 'none', title: 'No sessions yet for this pseudonym.', dataBinding: null });
  } else if (role === 'grant-reviewer') {
    if (Array.isArray(viewData?.nlnet_deliverables) && viewData.nlnet_deliverables.length)
      w.push({ type: 'deadline-list', id: 'deliverables', title: 'NLnet Deliverables', dataBinding: 'nlnet_deliverables', props: { showStatus: true } });
    if (viewData?.ada_compliance)
      w.push({ type: 'metric-grid', id: 'compliance', title: 'Compliance', dataBinding: 'ada_compliance' });
    pushStat(w, viewData, 'days_until_aug1', 'Days to Aug 1');
    if (Array.isArray(deadlines) && deadlines.length)
      w.push({ type: 'deadline-list', id: 'deadlines', title: 'Deadlines', dataBinding: 'deadlines' });
  }

  return w;
}

function pushStat(w: Widget[], viewData: any, key: string, title: string) {
  if (viewData && viewData[key] !== undefined)
    w.push({ type: 'stat-card', id: `stat-${key}`, title, dataBinding: key });
}
