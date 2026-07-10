import React, { useState } from 'react';
import { useUserTest } from '../../hooks/useUserTest';
import { useUserTestStream } from '../../hooks/useUserTestStream';
import SignalsPanel from './SignalsPanel';
import ParticipantTable from './ParticipantTable';
import SessionCaptureForm from './SessionCaptureForm';
import FindingsList from './FindingsList';
import QueuePanel from './QueuePanel';
import DeadlineTracker from './DeadlineTracker';
import EntanglementGraph from './EntanglementGraph';
import { DashboardErrorBoundary } from './ErrorBoundary';

const ROLES = ['Coordinator', 'Researcher', 'Participant', 'Grant-Reviewer'] as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-panel p-4">
      <div className="text-2xl font-mono text-quantum-cyan">{value}</div>
      <div className="text-xs uppercase tracking-wide text-cloud mt-1">{label}</div>
    </div>
  );
}

export default function UserTestDashboard() {
  const [role, setRole] = useState<string>('Coordinator');
  const [pseudonym, setPseudonym] = useState('');
  const [spoons, setSpoons] = useState(5);

  const viewEndpoint =
    role === 'Participant' && pseudonym
      ? `views/participant?pseudonym=${encodeURIComponent(pseudonym)}`
      : `views/${role.toLowerCase()}`;
  const { data: view, loading } = useUserTest(viewEndpoint);
  const { signals } = useUserTestStream();

  return (
    <div className="min-h-screen bg-void text-white p-4 space-y-6" data-spoons={spoons}>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-4">
        <div>
          <h1 className="text-2xl font-light tracking-wide">P31 User-Testing Convergence</h1>
          <p className="text-sm text-cloud">Live signals · spoon-aware · multi-viewer</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="spoon-slider" className="text-xs text-cloud">Spoons</label>
          <input
            id="spoon-slider"
            type="range" min={0} max={5} value={spoons}
            onChange={(e) => setSpoons(Number(e.target.value))}
            aria-label="Current spoon / energy level"
            className="accent-[var(--color-quantum-cyan)]"
          />
          <span className="font-mono text-quantum-cyan" aria-live="polite">{spoons}</span>
        </div>
      </header>

      <SignalsPanel signals={signals} />

      <nav className="flex flex-wrap gap-2 border-b border-white/10" role="tablist" aria-label="Viewer role">
        {ROLES.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => setRole(r)}
            className={`min-h-[48px] px-4 text-sm font-medium rounded-t ${role === r ? 'text-quantum-cyan border-b-2 border-quantum-cyan' : 'text-cloud hover:text-white'}`}
          >
            {r}
          </button>
        ))}
        {role === 'Participant' && (
          <input
            type="text"
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            placeholder="Pseudonym"
            aria-label="Participant pseudonym"
            className="ml-2 min-h-[48px] px-3 rounded bg-white/5 border border-white/10 text-white placeholder-cloud focus:border-quantum-cyan"
          />
        )}
      </nav>

      <section className="glass-panel p-6" aria-live="polite">
        <h2 className="text-sm font-semibold text-quantum-cyan mb-4">{role} view</h2>
        {loading ? (
          <p className="text-cloud">Loading…</p>
        ) : !view ? (
          <p className="text-cloud">No data.</p>
        ) : role === 'Coordinator' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Participants" value={view.participants_count ?? 0} />
            <StatCard label="Sessions" value={view.sessions_count ?? 0} />
            <StatCard label="Pending pay" value={view.payments_pending ?? 0} />
            <StatCard label="Days to Aug 1" value={view.days_until_aug1 ?? '—'} />
            <div className="col-span-2 glass-panel p-3">
              <div className="text-xs text-cloud mb-1">By cohort</div>
              <ul className="text-sm space-y-1">{Object.entries(view.participants_by_cohort || {}).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-white">{k}</span><span className="text-quantum-cyan">{String(v)}</span></li>)}</ul>
            </div>
            <div className="col-span-2 glass-panel p-3">
              <div className="text-xs text-cloud mb-1">By phase</div>
              <ul className="text-sm space-y-1">{Object.entries(view.sessions_by_phase || {}).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-white">Phase {k}</span><span className="text-quantum-cyan">{String(v)}</span></li>)}</ul>
            </div>
          </div>
        ) : role === 'Researcher' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="WCAG pass %" value={view.wcag_pass_rate ?? 0} />
            <StatCard label="Avg spoons start" value={view.avg_spoons_start ?? '—'} />
            <StatCard label="Avg spoons end" value={view.avg_spoons_end ?? '—'} />
            <StatCard label="Spoon fit" value={view.spoon_fit ?? '—'} />
            <div className="col-span-2 md:col-span-4 glass-panel p-3">
              <div className="text-xs text-cloud mb-1">Findings by severity</div>
              <ul className="text-sm space-y-1">{Object.entries(view.findings_by_severity || {}).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-white">S{k}</span><span className="text-quantum-cyan">{String(v)}</span></li>)}</ul>
            </div>
          </div>
        ) : role === 'Participant' ? (
          <div className="space-y-2">
            {(view.sessions || []).map((s: any) => (
              <div key={s.id} className="flex justify-between items-center glass-panel p-3">
                <div>
                  <span className="text-white font-medium">Phase {s.phase} · {s.format}</span>
                  <div className="text-xs text-cloud">Spoons {s.spoons_start} → {s.spoons_end}</div>
                </div>
                <span className={s.paid ? 'text-quantum-green' : 'text-cloud'}>
                  {s.paid ? `Paid $${s.payment_amount}` : `Pending $${s.payment_amount}`}
                </span>
              </div>
            ))}
            {(view.sessions || []).length === 0 && <p className="text-cloud">No sessions for this pseudonym.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="glass-panel p-3">
              <div className="text-xs text-cloud mb-1">NLnet deliverables</div>
              <ul className="text-sm space-y-1">{(view.nlnet_deliverables || []).map((d: any) => <li key={d.id} className="flex justify-between"><span className="text-white">{d.id}</span><span className={d.status === 'ready' ? 'text-quantum-green' : 'text-quantum-gold'}>{d.status}</span></li>)}</ul>
            </div>
            <div className="glass-panel p-3">
              <div className="text-xs text-cloud mb-1">Compliance</div>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between"><span className="text-white">ADA WCAG 2.1 AA</span><span className={view.ada_compliance?.wcag_2_1_aa ? 'text-quantum-green' : 'text-cloud'}>{view.ada_compliance?.wcag_2_1_aa ? 'Pass' : 'Review'}</span></li>
                <li className="flex justify-between"><span className="text-white">eIDAS 2.0</span><span className={view.ada_compliance?.eidas_2_0 ? 'text-quantum-green' : 'text-quantum-gold'}>{view.ada_compliance?.eidas_2_0 ? 'Aligned' : 'Review'}</span></li>
              </ul>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardErrorBoundary label="Participants"><ParticipantTable /></DashboardErrorBoundary>
        <DashboardErrorBoundary label="Session form"><SessionCaptureForm /></DashboardErrorBoundary>
        <DashboardErrorBoundary label="Findings"><FindingsList /></DashboardErrorBoundary>
        <DashboardErrorBoundary label="Queue"><QueuePanel /></DashboardErrorBoundary>
        <DashboardErrorBoundary label="Deadlines"><DeadlineTracker /></DashboardErrorBoundary>
        <DashboardErrorBoundary label="Entanglements"><EntanglementGraph /></DashboardErrorBoundary>
      </div>
    </div>
  );
}
