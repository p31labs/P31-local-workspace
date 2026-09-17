import { useCallback, useEffect, useRef, useState } from 'react';
import { GlassPanel, MetricBadge, SpoonDial, Starfield } from '@p31/design-core/compositions';
import { controlAction, fetchEye, fetchWhoami, openEyeStream } from './api';
import type { EyeData, WhoAmI } from './types';
import { K4Eye } from './eye/K4Eye';
import FleetPanel from './panels/FleetPanel';
import SurfacesPanel from './panels/SurfacesPanel';
import MeshPanel from './panels/MeshPanel';
import GrantsPanel from './panels/GrantsPanel';
import CostsPanel from './panels/CostsPanel';
import McpPanel from './panels/McpPanel';

type Tab = 'eye' | 'fleet' | 'surfaces' | 'funding' | 'costs' | 'reach';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'eye', label: 'The Eye' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'funding', label: 'Funding' },
  { id: 'costs', label: 'Costs' },
  { id: 'reach', label: 'Reach' },
];

function readSpoons(): number {
  try {
    const v = Number(localStorage.getItem('cc:spoons'));
    return Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 3;
  } catch {
    return 3;
  }
}

export function App() {
  const [eye, setEye] = useState<EyeData | null>(null);
  const [whoami, setWhoami] = useState<WhoAmI>({ authenticated: false });
  const [tab, setTab] = useState<Tab>('eye');
  const [spoons, setSpoons] = useState<number>(readSpoons);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const data = await fetchEye();
      setEye(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    fetchWhoami().then(setWhoami);
    refresh();
    const stopStream = openEyeStream(refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      stopStream();
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    document.documentElement.dataset.spoons = String(spoons);
    try {
      localStorage.setItem('cc:spoons', String(spoons));
    } catch {
      /* ignore */
    }
  }, [spoons]);

  const onSpoon = useCallback((level: number) => {
    setSpoons(level);
    void fetch('/api/operator/shift', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ spoons: level }),
    }).catch(() => undefined);
  }, []);

  const canControl =
    !!eye?.control_enabled && (whoami.role === 'admin' || whoami.role === 'operator');

  const runControl = useCallback(
    async (action: 'quarantine' | 'rollback', name: string) => {
      setNotice(`${action}: ${name}…`);
      try {
        const res = await controlAction(action, name);
        setNotice(res.ok ? `${action} ok: ${res.message ?? name}` : `${action} failed: ${res.error ?? 'unknown'}`);
      } catch (e) {
        setNotice(`${action} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      refresh();
    },
    [refresh],
  );

  const updated = eye ? new Date(eye.ts).toLocaleTimeString() : '—';

  return (
    <>
      <Starfield spoons={spoons} />
      <div className="cc-app">
        <header className="cc-header">
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 className="cc-title">
              P31 <span style={{ color: 'var(--p31-accent)' }}>Command Center</span>
            </h1>
            <div className="cc-sub">
              All-Seeing Eye · {whoami.authenticated ? `${whoami.email} (${whoami.role})` : 'not authenticated'} · updated {updated}
            </div>
          </div>
          <SpoonDial level={spoons} onChange={onSpoon} />
        </header>

        {eye && (
          <div className="cc-grid">
            <GlassPanel padding="sm">
              <MetricBadge label="Nodes Online" value={`${eye.kpi.workers_online}/${eye.kpi.workers_total}`} />
            </GlassPanel>
            <GlassPanel padding="sm">
              <MetricBadge label="Portals Live" value={`${eye.kpi.portals_live}`} />
            </GlassPanel>
            <GlassPanel padding="sm">
              <MetricBadge label="Active Grants" value={`${eye.kpi.grants_active}`} />
            </GlassPanel>
            <GlassPanel padding="sm">
              <MetricBadge label="Days to Grant" value={`${eye.kpi.days_to_next_deadline}`} />
            </GlassPanel>
            <GlassPanel padding="sm">
              <MetricBadge label="Days to Hearing" value={`${eye.kpi.days_to_hearing}`} />
            </GlassPanel>
          </div>
        )}

        {error && (
          <div className="cc-secondary" role="status">
            telemetry error: {error}
          </div>
        )}
        {notice && (
          <div className="cc-secondary" role="status" aria-live="polite">
            {notice}
          </div>
        )}

        <nav className="cc-tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`cc-chip ${tab === t.id ? 'cc-chip--ok' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {!eye ? (
          <GlassPanel>
            <div className="cc-muted">Syncing operator telemetry…</div>
          </GlassPanel>
        ) : tab === 'eye' ? (
          <div className="cc-grid cc-grid--wide">
            <K4Eye mesh={eye.mesh} />
            <MeshPanel mesh={eye.mesh} />
          </div>
        ) : tab === 'fleet' ? (
          <FleetPanel
            fleet={eye.fleet}
            canControl={canControl}
            onQuarantine={(name) => runControl('quarantine', name)}
            onRollback={(name) => runControl('rollback', name)}
          />
        ) : tab === 'surfaces' ? (
          <SurfacesPanel surfaces={eye.surfaces} />
        ) : tab === 'funding' ? (
          <GrantsPanel grants={eye.grants} legal={eye.legal} />
        ) : tab === 'costs' ? (
          <CostsPanel costs={eye.costs} />
        ) : (
          <McpPanel mcp={eye.mcp} />
        )}

        <footer className="cc-muted" style={{ fontSize: 11, textAlign: 'center', paddingTop: 8 }}>
          P31 Labs Inc · EIN 42-1888158 · command-center.p31ca.org
        </footer>
      </div>
    </>
  );
}

export default App;
