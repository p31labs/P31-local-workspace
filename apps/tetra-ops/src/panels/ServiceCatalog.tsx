/**
 * @file ServiceCatalog — Shows all deployed Workers, apps, and edges with live health status.
 * Polls each Worker's /health endpoint every 60s via shared healthStore.
 */

import { useState, useEffect } from 'react';
import { WORKERS, useHealthStore } from '../state/healthStore';

const APPS = [
  { name: 'PHOS',          vert: 3, accent: '#a78bfa', url: 'https://phos.p31ca.org' },
  { name: 'WILLOW',        vert: 4, accent: '#34d399', url: 'https://willow.p31ca.org' },
  { name: 'p31ca.org',      vert: 1, accent: '#fbbf24', url: 'https://p31ca.org' },
  { name: 'phosphorus31',   vert: 2, accent: '#00f0ff', url: 'https://phosphorus31.org' },
  { name: 'tetra-ops',     vert: 1, accent: '#fbbf24', url: 'https://p31ca-ops.pages.dev' },
];

export function ServiceCatalog() {
  const [tab, setTab] = useState<'workers' | 'apps'>('workers');
  const workerHealth = useHealthStore((s) => s.workerHealth);
  const lastChecked = useHealthStore((s) => s.lastChecked);
  const start = useHealthStore((s) => s.start);

  useEffect(() => {
    start();
  }, [start]);

  const healthy = (name: string) => workerHealth[name] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['workers', 'apps'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '5px 12px', border: 'none', borderBottom: `2px solid ${tab === t ? '#00f0ff' : 'transparent'}`,
            background: 'transparent', color: tab === t ? '#00f0ff' : 'rgba(240,242,245,0.4)', fontSize: 10, cursor: 'pointer', fontWeight: tab === t ? 600 : 400, textTransform: 'uppercase',
          }}>
            {t} ({t === 'workers' ? WORKERS.length : APPS.length})
          </button>
        ))}
        {lastChecked && (
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(240,242,245,0.25)', padding: '5px 8px' }}>
            checked {Math.floor((Date.now() - lastChecked) / 1000)}s ago
          </span>
        )}
      </div>

      {tab === 'workers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {WORKERS.map(w => {
            const up = healthy(w.name);
            const alive = up === true;
            const unknown = up === null;
            return (
            <div key={w.name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: unknown ? 'rgba(240,242,245,0.2)' : alive ? '#34d399' : '#fb7185',
                boxShadow: unknown ? 'none' : `0 0 6px ${alive ? '#34d399' : '#fb7185'}`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: unknown ? 'rgba(240,242,245,0.3)' : alive ? '#34d399' : '#fb7185' }}>
                  {w.name}
                  {unknown && <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.25)', marginLeft: 6 }}>pending…</span>}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)' }}>{w.desc}</div>
              </div>
              <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{w.binding}</span>
            </div>
            );
          })}
        </div>
      )}

      {tab === 'apps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {APPS.map(a => (
            <div key={a.name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: a.accent, boxShadow: `0 0 6px ${a.accent}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: a.accent }}>{a.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)' }}>Vertex V{a.vert}</div>
              </div>
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#00f0ff', textDecoration: 'none', fontFamily: 'var(--p31-font-mono, monospace)' }}>Launch ↗</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServiceCatalog;
