/**
 * @file AppCatalog — Grid of all P31 ecosystem apps with search and category filter.
 */

import { useState } from 'react';
import { APPS, searchApps, getAppsByCategory, type AppEntry } from '../data/apps';

const CATEGORIES = ['all', 'vertex', 'tool', 'infra', 'design'] as const;

export interface AppCatalogProps {
  onSelect: (app: AppEntry) => void;
}

export function AppCatalog({ onSelect }: AppCatalogProps) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');

  const filtered = query ? searchApps(query) : cat === 'all' ? APPS : getAppsByCategory()[cat] ?? [];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search apps..."
          aria-label="Search apps"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f2f5', fontSize: 12, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCat(c); setQuery(''); }}
              style={{
                padding: '4px 10px', borderRadius: 8, border: `1px solid ${cat === c ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                background: cat === c ? 'rgba(0,240,255,0.1)' : 'transparent', color: cat === c ? '#00f0ff' : 'rgba(240,242,245,0.5)',
                fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)', cursor: 'pointer', textTransform: 'uppercase',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignContent: 'start' }}>
        {filtered.map(app => (
          <button
            key={app.id}
            onClick={() => onSelect(app)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
              textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,240,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{app.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#f0f2f5' }}>{app.name}</span>
              <span style={{
                marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 4,
                background: app.status === 'live' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                color: app.status === 'live' ? '#34d399' : '#fbbf24',
              }}>{app.status}</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,242,245,0.4)', lineHeight: 1.5 }}>{app.description}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'rgba(240,242,245,0.25)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
              <span>{app.category}</span>
              <span>·</span>
              <span>{app.url}</span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: 'rgba(240,242,245,0.3)', fontSize: 13 }}>
            No apps match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

export default AppCatalog;
