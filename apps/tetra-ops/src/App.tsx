import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { registerP31CrisisOverlay } from '@p31/design-core/crisis-overlay';
import { useDeviceClass } from '@p31/design-core/device';
import { useSpoonStore, type SceneKind } from './state/spoonStore';
import { useTelemetryStore } from './state/telemetryStore';
import { notify } from './state/notificationStore';
import { useNotificationStore } from './state/notificationStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StarfieldLayer, type StarfieldHandle } from './components/StarfieldLayer';
import { NotificationContainer } from './components/NotificationContainer';
import { AppCatalog } from './panels/AppCatalog';
import { AppDetail } from './panels/AppDetail';
import { DesignCatalog } from './panels/DesignCatalog';
import { SkinCatalog } from './panels/SkinCatalog';
import { CradlePanel } from './panels/CradlePanel';
import { AdoptionDashboard } from './panels/AdoptionDashboard';
import { ServiceCatalog } from './panels/ServiceCatalog';
import { DevMenu } from './components/DevMenu';
import { ControlsPanel } from './components/ControlsPanel';
import { ComponentExplorer } from './components/ComponentExplorer';
import { StarControls } from './components/StarControls';
import { GeneratePanel } from './components/GeneratePanel';
import { PageBuilder } from './components/PageBuilder';
import { GameBuilder } from './components/GameBuilder';
import { NonprofitDash } from './panels/NonprofitDash';
import { WorkflowPanel } from './panels/WorkflowPanel';
import { LovePanel } from './panels/LovePanel';
import { GovernancePanel } from './panels/GovernancePanel';
import { ObservabilityPanel } from './panels/ObservabilityPanel';
import { PageManager } from './panels/PageManager';
import { MarketplacePanel } from './panels/MarketplacePanel';
import { FeatureRegistryPanel } from './panels/FeatureRegistryPanel';
import { MCPToolPanel } from './panels/MCPToolPanel';
import type { AppEntry } from './data/apps';

// Lazy-loaded Three.js panels — code-split to reduce initial bundle
const VertexRegistry = lazy(() => import('./panels/VertexRegistry').then(m => ({ default: m.VertexRegistry })));
const EdgeRegistry = lazy(() => import('./panels/EdgeRegistry').then(m => ({ default: m.EdgeRegistry })));
const TelemetryPanel = lazy(() => import('./panels/TelemetryPanel').then(m => ({ default: m.TelemetryPanel })));
const SynthPanel = lazy(() => import('./panels/SynthPanel').then(m => ({ default: m.SynthPanel })));
const ArchitecturePanel = lazy(() => import('./panels/ArchitecturePanel').then(m => ({ default: m.ArchitecturePanel })));
const K4Canvas = lazy(() => import('./three/K4Canvas').then(m => ({ default: m.K4Canvas })));

const PanelFallback = () => (
  <div style={{
    minHeight: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--p31-text-tertiary, rgba(240,242,245,0.3))',
    fontSize: 12, fontFamily: 'var(--p31-font-mono, monospace)'
  }}>Loading...</div>
);

if (typeof window !== 'undefined') registerP31CrisisOverlay();

export function App() {
  const spoons = useSpoonStore((s) => s.spoons);
  const setSpoons = useSpoonStore((s) => s.setSpoons);
  const [scene, setScene] = useState<SceneKind>('tetra');
  const [, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<'dashboard' | 'catalog'>('dashboard');
  const [catalogTab, setCatalogTab] = useState<'apps' | 'components' | 'skins' | 'adoption' | 'services'>('apps');
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);
  useDeviceClass();

  const data = useTelemetryStore((s) => s.data);
  const status = useTelemetryStore((s) => s.status);
  const fetchTelemetry = useTelemetryStore((s) => s.fetchTelemetry);
  const unreachable = useTelemetryStore((s) => s.unreachable);

  const sfRef = useRef<StarfieldHandle>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const prevNotifyLen = useRef(notifications.length);

  const prevSpoons = useRef<number>(spoons);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      // Only poll while the worker is reachable; degraded mode halts automatically.
      if (!useTelemetryStore.getState().unreachable) fetchTelemetry();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Notify on spoon-level change (loaded after first paint to avoid boot toast).
  useEffect(() => {
    if (prevSpoons.current !== spoons) {
      prevSpoons.current = spoons;
      notify({ severity: 'info', title: `Spoon level ${spoons}`, message: spoons === 0 ? 'Crisis mode engaged.' : `Motion scale ${spoons}/5.` });
    }
  }, [spoons]);

  // One-shot notice when we fall back to offline/seed data.
  useEffect(() => {
    if (unreachable) {
      // eslint-disable-next-line no-console
      console.warn('[tetra-ops] tetra-hub unreachable — showing seed/offline topology.');
    }
  }, [unreachable]);

  // Crisis overlay "ready" -> restore to calmer default (spoon 3).
  useEffect(() => {
    const onReady = () => setSpoons(3);
    document.addEventListener('p31-ready', onReady as EventListener);
    return () => document.removeEventListener('p31-ready', onReady as EventListener);
  }, [setSpoons]);

  const vertices = data?.vertices ?? [];
  const edges = data?.edges ?? [];

  // ═══ Molecular Starfield SMART Pipeline ═══

  // Voltage from vertex health → starfield color shift
  const aliveCount = vertices.filter(v => v.alive).length;
  const totalVertices = vertices.length || 4;
  useEffect(() => {
    const prevVoltage = (useTelemetryStore.getState() as any)._voltage || 'GREEN';
    const voltage = aliveCount === 0 ? 'RED' : aliveCount < totalVertices ? 'AMBER' : 'GREEN';
    if (voltage !== prevVoltage) {
      sfRef.current?.setVoltage(voltage);
      (useTelemetryStore.getState() as any)._voltage = voltage;
      if (voltage === 'AMBER') sfRef.current?.burst?.('coral');
      if (voltage === 'GREEN' && prevVoltage !== 'GREEN') sfRef.current?.burst?.('gold');
    }
  }, [aliveCount, totalVertices]);

  // Notification → starfield burst
  useEffect(() => {
    if (notifications.length > prevNotifyLen.current) {
      const latest = notifications[notifications.length - 1];
      const color = latest?.severity === 'error' ? 'coral' : latest?.severity === 'warning' ? 'coral' : latest?.severity === 'success' ? 'gold' : 'phosphor';
      sfRef.current?.burst?.(color);
    }
    prevNotifyLen.current = notifications.length;
  }, [notifications]);

  // Remembrance stars for each vertex
  useEffect(() => {
    if (vertices.length === 0) return;
    const stars = vertices.map((v, i) => {
      const angle = (i / vertices.length) * Math.PI * 2;
      return {
        x: 0.5 + 0.35 * Math.cos(angle),
        y: 0.5 + 0.35 * Math.sin(angle),
        a: v.alive ? 0.5 : 0.1,
        phase: i * 1.2,
      };
    });
    sfRef.current?.setRemembrance?.(stars.map(s => ({ x: s.x, y: s.y })));
  }, [vertices]);

  return (
    <div className="tetra-app" data-spoons={spoons}>
      <StarfieldLayer ref={sfRef} />
      <div style={{ gridArea: 'hdr' }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 4px' }}>
          <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}>
            <button onClick={() => { setView('dashboard'); setSelectedApp(null); }} style={{ padding: '4px 12px', border: 'none', background: view === 'dashboard' ? 'rgba(0,240,255,0.12)' : 'transparent', color: view === 'dashboard' ? '#00f0ff' : 'rgba(240,242,245,0.5)', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer', fontWeight: view === 'dashboard' ? 600 : 400 }}>Dashboard</button>
            <button onClick={() => { setView('catalog'); setSelectedApp(null); }} style={{ padding: '4px 12px', border: 'none', background: view === 'catalog' ? 'rgba(0,240,255,0.12)' : 'transparent', color: view === 'catalog' ? '#00f0ff' : 'rgba(240,242,245,0.5)', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer', fontWeight: view === 'catalog' ? 600 : 400 }}>Catalog</button>
          </div>
        </div>
      </div>

      {view === 'catalog' ? (
        <main className="tetra-main" id="main-content">
          {/* Catalog sub-tabs */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', padding: '14px 0 0' }}>
            <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', background: 'rgba(10,10,15,0.7)' }}>
              {(['apps', 'components', 'skins', 'adoption', 'services'] as const).map(t => (
                <button key={t} onClick={() => { setCatalogTab(t); setSelectedApp(null); }} style={{ padding: '5px 14px', border: 'none', background: catalogTab === t ? 'rgba(0,240,255,0.1)' : 'transparent', color: catalogTab === t ? '#00f0ff' : 'rgba(240,242,245,0.4)', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t === 'apps' ? 'Apps' : t === 'components' ? 'Components' : t === 'skins' ? 'Skins' : t === 'adoption' ? 'Adoption' : 'Services'}
                </button>
              ))}
            </div>
          </div>
          {catalogTab === 'apps' && (
            selectedApp
              ? <AppDetail app={selectedApp} onBack={() => setSelectedApp(null)} />
              : <AppCatalog onSelect={setSelectedApp} />
          )}
          {catalogTab === 'components' && <DesignCatalog />}
          {catalogTab === 'skins' && <SkinCatalog />}
          {catalogTab === 'adoption' && <AdoptionDashboard />}
          {catalogTab === 'services' && <ServiceCatalog />}
          {/* Community bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', color: 'rgba(240,242,245,0.3)', flexShrink: 0 }}>
            <a href="https://github.com/p31labs" target="_blank" style={{ color: 'rgba(240,242,245,0.4)', textDecoration: 'none' }}>GitHub</a>
            <span>·</span>
            <a href="https://discord.gg/uYW5rTCuZ" target="_blank" style={{ color: 'rgba(240,242,245,0.4)', textDecoration: 'none' }}>Discord</a>
            <span>·</span>
            <a href="https://ko-fi.com/trimtab69420" target="_blank" style={{ color: 'rgba(240,242,245,0.4)', textDecoration: 'none' }}>Ko-fi</a>
            <span>·</span>
            <span>P31 Labs 2026</span>
          </div>
        </main>
      ) : (
        <>
      <Suspense fallback={<PanelFallback />}><VertexRegistry vertices={vertices} onSelect={setSelected} /></Suspense>

      <main className="tetra-main" id="main-content">
        <div className="tetra-canvas">
          <Suspense fallback={<div className="tetra-canvas" />}><K4Canvas scene={scene} /></Suspense>
        </div>

        {/* Scene toggle overlay */}
        <div className="ui-chrome" style={{ position: 'absolute', top: 11, right: 11, display: 'flex', gap: 5 }}>
          <button onClick={() => setScene('tetra')} className={`abtn ${scene === 'tetra' ? 'text-gold' : 'text-muted'}`} style={{ minHeight: 36, padding: '0 12px', borderColor: scene === 'tetra' ? 'rgba(251,191,36,.28)' : 'var(--p31-glass-border)', background: scene === 'tetra' ? 'rgba(251,191,36,.08)' : 'transparent' }}>
            K₄ Tetra
          </button>
          <button onClick={() => setScene('posner')} className={`abtn ${scene === 'posner' ? 'text-gold' : 'text-muted'}`} style={{ minHeight: 36, padding: '0 12px', borderColor: scene === 'posner' ? 'rgba(251,191,36,.28)' : 'var(--p31-glass-border)', background: scene === 'posner' ? 'rgba(251,191,36,.08)' : 'transparent' }}>
            Posner
          </button>
          <button onClick={() => setScene('cradle')} className={`abtn ${scene === 'cradle' ? 'text-gold' : 'text-muted'}`} style={{ minHeight: 36, padding: '0 12px', borderColor: scene === 'cradle' ? 'rgba(251,191,36,.28)' : 'var(--p31-glass-border)', background: scene === 'cradle' ? 'rgba(251,191,36,.08)' : 'transparent' }}>
            🌌 Cradle
          </button>
        </div>

        {/* Bottom metrics overlay */}
        <div className="ui-chrome" style={{ position: 'absolute', bottom: 10, left: 11, right: 11, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
          <div className="glass-subtle" style={{ padding: '5px 12px', borderRadius: 8, fontFamily: 'var(--p31-font-mono)', fontSize: 10, color: 'var(--p31-text-secondary)' }}>
            V: <span style={{ color: 'var(--p31-text-primary)' }}>{data?.stats.vertices ?? 4}</span> ·
            E: <span style={{ color: 'var(--p31-text-primary)' }}>{data?.stats.edges ?? 6}</span> ·
            Rigidity: <span style={{ color: 'var(--p31-accent-green)' }}>Rigid ✓</span>
          </div>
          <div className="glass-subtle" style={{ padding: '5px 12px', borderRadius: 8, fontFamily: 'var(--p31-font-mono)', fontSize: 10, color: 'var(--p31-text-secondary)' }}>
            E ≥ 3V−6 ⇒ 6 ≥ 6 ✓
          </div>
        </div>
      </main>

      <div className="tetra-right">
        <div className="tetra-pi">
          {scene === 'cradle' ? <CradlePanel /> : (
            <>
          <Suspense fallback={<PanelFallback />}><TelemetryPanel data={data} status={status} /></Suspense>
          <div className="div" />
          <Suspense fallback={<PanelFallback />}><EdgeRegistry edges={edges} vertices={vertices} /></Suspense>
          <div className="div" />
          <Suspense fallback={<PanelFallback />}><SynthPanel /></Suspense>
          <div className="div" />
          <Suspense fallback={<PanelFallback />}><ArchitecturePanel /></Suspense>
          <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button className="abtn text-violet" style={{ borderColor: 'rgba(167,139,250,.22)' }} onClick={fetchTelemetry}>
              <i className="fa-solid fa-bolt" style={{ fontSize: 10 }} /> Refresh
            </button>
            <button
              className="abtn text-cyan"
              style={{ borderColor: unreachable ? 'rgba(251,113,133,.3)' : 'rgba(0,240,255,.22)' }}
              onClick={() => useTelemetryStore.getState().retry()}
            >
              <i className={`fa-solid ${unreachable ? 'fa-triangle-exclamation' : 'fa-link'}`} style={{ fontSize: 10, color: unreachable ? 'var(--p31-accent-red)' : 'var(--p31-accent)' }} />
              {unreachable ? 'Reconnect' : 'Status'}
            </button>
          </div>
          {unreachable && (
            <div className="trow" style={{ background: 'rgba(251,113,133,.06)', borderColor: 'rgba(251,113,133,.2)' }}>
              <span className="text-red" style={{ fontSize: 9 }}>tetra-hub unreachable — seed topology</span>
            </div>
          )}
            </>
          )}
        </div>
      </div>
        </>
      )}

      <Footer />

      <DevMenu tools={[
        { id: 'controls', label: 'Controls', emoji: '🎛️', Component: () => <ControlsPanel scene={scene} setScene={setScene as any} /> },
        { id: 'stars', label: 'Stars', emoji: '✨', Component: () => <StarControls onBurst={(c) => sfRef.current?.burst?.(c)} /> },
        { id: 'generate', label: 'Generate', emoji: '🤖', Component: () => <GeneratePanel /> },
        { id: 'build', label: 'Build', emoji: '🧱', Component: () => <PageBuilder /> },
        { id: 'game-builder', label: 'Games', emoji: '🎮', Component: () => <GameBuilder /> },
        { id: 'nonprofit', label: 'Nonprofit', emoji: '🏛️', Component: () => <NonprofitDash /> },
        { id: 'workflow', label: 'Workflow', emoji: '⚡', Component: () => <WorkflowPanel /> },
        { id: 'love', label: 'LOVE', emoji: '♥', Component: () => <LovePanel /> },
        { id: 'components', label: 'Components', emoji: '🧩', Component: () => <ComponentExplorer /> },
        { id: 'governance', label: 'Governance', emoji: '🏛', Component: () => <GovernancePanel /> },
        { id: 'observability', label: 'Observability', emoji: '🔭', Component: () => <ObservabilityPanel /> },
        { id: 'pages', label: 'Pages', emoji: '📄', Component: () => <PageManager /> },
        { id: 'marketplace', label: 'Marketplace', emoji: '🏪', Component: () => <MarketplacePanel /> },
        { id: 'features', label: 'Features', emoji: '🗂️', Component: () => <FeatureRegistryPanel /> },
        { id: 'mcp-tools', label: 'MCP Tools', emoji: '🔧', Component: () => <MCPToolPanel /> },
      ]} />

      <NotificationContainer />

      {/* design-core crisis overlay — shows at spoons === 0 */}
      <p31-crisis-overlay message="Rest. Breathe. The mesh holds. Exit when ready." button-label="I'm ready" />
    </div>
  );
}
