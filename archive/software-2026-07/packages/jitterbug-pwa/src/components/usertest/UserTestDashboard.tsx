import React, { useMemo, useState } from 'react';
import { useUserTest } from '../../hooks/useUserTest';
import { useUserTestStream } from '../../hooks/useUserTestStream';
import {
  generateInterface,
  InterfaceRenderer,
  CrisisOverlay,
  normalizePassport,
} from '@p31/interface-generator';
import SignalsPanel from './SignalsPanel';
import ParticipantTable from './ParticipantTable';
import SessionCaptureForm from './SessionCaptureForm';
import FindingsList from './FindingsList';
import QueuePanel from './QueuePanel';
import DeadlineTracker from './DeadlineTracker';
import EntanglementGraph from './EntanglementGraph';
import { DashboardErrorBoundary } from './ErrorBoundary';

const ROLES = ['Coordinator', 'Researcher', 'Participant', 'Grant-Reviewer'] as const;

export default function UserTestDashboard() {
  const [role, setRole] = useState<string>('Coordinator');
  const [pseudonym, setPseudonym] = useState('');
  const [spoons, setSpoons] = useState(5);

  const passport = useMemo(
    () =>
      normalizePassport(
        typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('phos:passport') || '{}')
          : {}
      ),
    []
  );

  const viewEndpoint =
    role === 'Participant' && pseudonym
      ? `views/participant?pseudonym=${encodeURIComponent(pseudonym)}`
      : `views/${role.toLowerCase()}`;
  const { data: viewData, loading } = useUserTest(viewEndpoint);
  const { signals } = useUserTestStream();

  // Generate the adaptive InterfaceDescription from passport + data + spoon state.
  const description = useMemo(() => {
    if (!viewData || loading) return null;
    try {
      return generateInterface({
        passport,
        viewData,
        role: role.toLowerCase() as any,
        spoons,
      });
    } catch {
      return null;
    }
  }, [viewData, loading, role, spoons, passport]);

  // Crisis mode: render ONLY the breathing overlay — no chrome (DESIGN.md).
  // Returned before the [data-spoons] root so the animation is not frozen.
  if (description?.crisisMode) {
    return <CrisisOverlay onReady={() => setSpoons(3)} />;
  }

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
        ) : description ? (
          <InterfaceRenderer description={description} data={{ ...viewData, signals }} />
        ) : (
          <p className="text-cloud">No data.</p>
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
