/**
 * @file AppDetail — Detail panel for a selected app.
 */

import type { AppEntry } from '../data/apps';

export interface AppDetailProps {
  app: AppEntry;
  onBack: () => void;
}

export function AppDetail({ app, onBack }: AppDetailProps) {
  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
          color: 'rgba(240,242,245,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--p31-font-mono, monospace)',
        }}
      >
        ← Back to catalog
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>{app.icon}</span>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f2f5', margin: 0 }}>{app.name}</h2>
          <div style={{ fontSize: 11, color: 'rgba(240,242,245,0.4)', marginTop: 4, fontFamily: 'var(--p31-font-mono, monospace)' }}>
            {app.category} · {app.slug}
          </div>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: 10, padding: '4px 10px', borderRadius: 6,
          background: app.status === 'live' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
          color: app.status === 'live' ? '#34d399' : '#fbbf24', fontFamily: 'var(--p31-font-mono, monospace)',
        }}>{app.status.toUpperCase()}</span>
      </div>

      <p style={{ fontSize: 13, color: 'rgba(240,242,245,0.6)', lineHeight: 1.6 }}>{app.description}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.3)',
            background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          🚀 Launch
        </a>
        <button
          onClick={() => { navigator.clipboard.writeText(app.url); }}
          style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(240,242,245,0.6)', fontSize: 13,
            cursor: 'pointer',
          }}
        >
          📋 Copy URL
        </button>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        fontSize: 11, fontFamily: 'var(--p31-font-mono, monospace)',
      }}>
        <div>
          <div style={{ color: 'rgba(240,242,245,0.3)', marginBottom: 4 }}>URL</div>
          <div style={{ color: 'rgba(240,242,245,0.5)', wordBreak: 'break-all' }}>{app.url}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(240,242,245,0.3)', marginBottom: 4 }}>Category</div>
          <div style={{ color: 'rgba(240,242,245,0.5)' }}>{app.category}</div>
        </div>
        {app.telemetrySiteId && (
          <div>
            <div style={{ color: 'rgba(240,242,245,0.3)', marginBottom: 4 }}>Telemetry ID</div>
            <div style={{ color: 'rgba(240,242,245,0.5)' }}>{app.telemetrySiteId}</div>
          </div>
        )}
        <div>
          <div style={{ color: 'rgba(240,242,245,0.3)', marginBottom: 4 }}>Status</div>
          <div style={{ color: app.status === 'live' ? '#34d399' : '#fbbf24' }}>{app.status}</div>
        </div>
      </div>
    </div>
  );
}

export default AppDetail;
