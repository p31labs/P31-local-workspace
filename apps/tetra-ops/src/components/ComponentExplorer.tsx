/**
 * @file ComponentExplorer — DevMenu panel: live search + props + copy code for all P31 components.
 * Reuses the tetra-ops components.ts data.
 */

import { useState } from 'react';
import { COMPONENTS } from '../data/components';

export function ComponentExplorer() {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const filtered = query
    ? COMPONENTS.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : COMPONENTS;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search components..."
        style={{
          padding: '6px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#f0f2f5', fontSize: 11, outline: 'none',
        }}
      />
      <div style={{ maxHeight: '50vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(c => (
          <div
            key={c.id}
            style={{
              padding: '8px 10px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#f0f2f5' }}>{c.name}</span>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: c.maturity === 'stable' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: c.maturity === 'stable' ? '#34d399' : '#fbbf24' }}>{c.maturity}</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,242,245,0.4)', lineHeight: 1.5, marginBottom: 6 }}>{c.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <code style={{ flex: 1, fontSize: 10, color: 'rgba(52,211,153,0.6)', fontFamily: 'var(--p31-font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.installCommand}
              </code>
              <button
                onClick={() => copy(c.installCommand)}
                style={{
                  padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.2)',
                  background: copied === c.installCommand ? 'rgba(52,211,153,0.2)' : 'transparent',
                  color: copied === c.installCommand ? '#34d399' : 'rgba(52,211,153,0.5)',
                  fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {copied === c.installCommand ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 16, color: 'rgba(240,242,245,0.3)', fontSize: 11 }}>
            No components match "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentExplorer;
