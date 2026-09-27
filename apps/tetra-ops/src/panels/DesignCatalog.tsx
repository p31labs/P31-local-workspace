/**
 * @file DesignCatalog — Grid of all @p31ca/ui components with install commands.
 */

import { useState } from 'react';
import { COMPONENTS, searchComponents } from '../data/components';

export function DesignCatalog() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = query ? searchComponents(query) : COMPONENTS;
  const detail = COMPONENTS.find(c => c.id === selected);

  if (detail) {
    return (
      <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => setSelected(null)} style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(240,242,245,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--p31-font-mono, monospace)' }}>← Back to catalog</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f2f5', margin: 0 }}>{detail.name}</h2>
        <p style={{ fontSize: 13, color: 'rgba(240,242,245,0.6)', lineHeight: 1.6 }}>{detail.description}</p>
        <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
          <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.3)', marginBottom: 6 }}>Install</div>
          <code style={{ fontSize: 12, color: '#34d399', cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(detail.installCommand); }}>{detail.installCommand}</code>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
          <span>{detail.category}</span><span>·</span><span>{detail.package}</span><span>·</span><span style={{ color: detail.status === 'stable' ? '#34d399' : '#fbbf24' }}>{detail.status}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search components..." aria-label="Search components" style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f2f5', fontSize: 12, outline: 'none', flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignContent: 'start' }}>
        {filtered.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#f0f2f5' }}>{c.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: c.status === 'stable' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: c.status === 'stable' ? '#34d399' : '#fbbf24' }}>{c.status}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,242,245,0.4)', lineHeight: 1.5 }}>{c.description}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'rgba(240,242,245,0.25)', fontFamily: 'var(--p31-font-mono, monospace)', marginTop: 2 }}>
              <span style={{ color: c.maturity === 'stable' ? '#34d399' : '#fbbf24' }}>{c.maturity}</span>
              <span>·</span>
              <span>v{c.version}</span>
              <span>·</span>
              <span>{c.usedBy.length} app{c.usedBy.length > 1 ? 's' : ''}</span>
            </div>
            <code style={{ fontSize: 10, color: 'rgba(52,211,153,0.5)', fontFamily: 'var(--p31-font-mono, monospace)', marginTop: 2 }}>{c.installCommand}</code>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DesignCatalog;
