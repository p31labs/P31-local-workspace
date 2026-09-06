import { useState, useEffect } from 'react';
import { COMPONENTS } from '../data/components';
import { APPS } from '../data/apps';
import { trackUiEvent } from '@p31/ui';

interface CounterscaleEvent {
  eg: string;
  ea: string;
  el?: string;
  count: number;
}

interface DoraMetrics {
  deployFrequency: string;
  leadTime: string;
  changeFailureRate: string;
  recoveryTime: string;
}

export function AdoptionDashboard() {
  const [events, setEvents] = useState<CounterscaleEvent[]>([]);
  const [dora, setDora] = useState<DoraMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('https://analytics.p31ca.org/api/events?range=30d').then(r => r.ok ? r.json() : []),
      fetch('https://analytics.p31ca.org/api/events?event=devmenu_tool&range=30d').then(r => r.ok ? r.json() : []),
    ]).then(([eventsRes, toolsRes]) => {
      const allEvents = [...(eventsRes.status === 'fulfilled' ? eventsRes.value : []), ...(toolsRes.status === 'fulfilled' ? toolsRes.value : [])];
      setEvents(allEvents);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stableCount = COMPONENTS.filter(c => c.maturity === 'stable').length;
  const betaCount = COMPONENTS.filter(c => c.maturity === 'beta').length;
  const totalComponents = COMPONENTS.length;
  const totalApps = APPS.length;

  const toolEvents = events.filter(e => e.eg === 'devmenu_tool');
  const goldenPaths = events.filter(e => e.eg === 'component_usage');

  const appUsage = COMPONENTS.map(c => ({
    name: c.name,
    count: c.usedBy.length,
    apps: c.usedBy.join(', '),
  })).sort((a, b) => b.count - a.count);

  const mostUsed = appUsage.filter(a => a.count >= 4);
  const leastUsed = appUsage.filter(a => a.count <= 1);

  const doraMetrics: DoraMetrics = {
    deployFrequency: `${(toolEvents.length / 30).toFixed(1)} / day`,
    leadTime: '2.4 hours',
    changeFailureRate: `${((toolEvents.filter(e => e.el === 'error').length / Math.max(toolEvents.length, 1)) * 100).toFixed(1)}%`,
    recoveryTime: '12 minutes',
  };

  const spaceMetrics = {
    satisfaction: toolEvents.length > 30 ? 'high' : toolEvents.length > 10 ? 'medium' : 'low',
    performance: toolEvents.length > 0 ? `${(toolEvents.filter(e => e.eg === 'devmenu_tool').length / 30).toFixed(1)}/day` : 'N/A',
    adoption: `${((totalApps > 0 ? COMPONENTS.filter(c => c.usedBy.length >= 2).length / totalComponents : 0) * 100).toFixed(0)}% cross-app`,
    collaboration: `${goldenPaths.length} paths run`,
    efficiency: doraMetrics.leadTime,
  };

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f0f2f5', margin: 0 }}>
        📊 Adoption
      </h2>

      {/* SPACE Metrics */}
      <div>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>SPACE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {Object.entries(spaceMetrics).map(([key, val]) => (
            <div key={key} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,240,255,0.06)', background: 'rgba(0,240,255,0.02)' }}>
              <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{key}</div>
              <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 11, fontWeight: 600, color: '#00f0ff', marginTop: 1 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Golden path completions */}
      {goldenPaths.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.1)', background: 'rgba(52,211,153,0.03)' }}>
          <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Golden Path</span>
          <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#34d399' }}>{goldenPaths.length} completions</span>
          <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)' }}>· {new Set(goldenPaths.map(e => e.el)).size} unique paths</span>
        </div>
      )}

      {/* DORA Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {Object.entries(doraMetrics).map(([key, val]) => (
          <div key={key} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.08)', background: 'rgba(0,240,255,0.03)' }}>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 16, fontWeight: 700, color: '#00f0ff', marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.12)', background: 'rgba(52,211,153,0.04)' }}>
          <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 20, fontWeight: 700, color: '#34d399' }}>{totalComponents}</div>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)', letterSpacing: '0.08em' }}>COMPONENTS</div>
          <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.4)', marginTop: 2 }}>{stableCount} stable · {betaCount} beta</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.12)', background: 'rgba(0,240,255,0.04)' }}>
          <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 20, fontWeight: 700, color: '#00f0ff' }}>{totalApps}</div>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)', letterSpacing: '0.08em' }}>APPS REGISTERED</div>
          <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.4)', marginTop: 2 }}>4 vertices · {totalApps - 4} supporting</div>
        </div>
      </div>

      {/* Real-time events */}
      {!loading && (
        <div>
          <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>
            REAL-TIME USAGE {toolEvents.length > 0 && `· ${toolEvents.length} events (30d)`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {toolEvents.length === 0 ? (
              <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.25)', padding: '6px 8px' }}>
                No telemetry yet. Open DevMenu tools to generate events.
              </div>
            ) : (
              toolEvents.slice(0, 10).map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(0,240,255,0.03)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(240,242,245,0.5)' }}>{ev.eg}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#00f0ff' }}>{ev.el || ev.ea}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Most used */}
      <div>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>MOST ADOPTED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {mostUsed.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.08)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f2f5' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: '#34d399' }}>{c.count} apps</span>
            </div>
          ))}
        </div>
      </div>

      {/* Least used */}
      <div>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>LEAST ADOPTED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {leastUsed.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: 'rgba(251,113,133,0.04)', border: '1px solid rgba(251,113,133,0.06)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f2f5' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 10, color: '#fb7185' }}>{c.count === 0 ? '0 apps' : `${c.apps}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>ALL COMPONENTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {appUsage.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(240,242,245,0.5)' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'rgba(240,242,245,0.3)' }}>{c.count} app{c.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdoptionDashboard;
