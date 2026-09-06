/**
 * @file FeatureRegistryPanel — Unified catalog of every mesh capability:
 * components, app surfaces, workers, skins, templates, blocks, and add-ons.
 *
 * Supersedes the scattered per-type explorers with one searchable, filterable
 * registry backed by lib/featureRegistry.ts. (CWP-2026-070 deliverable.)
 */

import { useMemo, useState } from 'react';
import { allFeatures, searchFeatures, FeatureType } from '../lib/featureRegistry';

const TYPE_LABELS: Record<FeatureType, string> = {
  component: 'Components',
  surface: 'Surfaces',
  worker: 'Workers',
  skin: 'Skins',
  template: 'Templates',
  block: 'Blocks',
  addon: 'Add-ons',
};

const ACCENT: Record<FeatureType, string> = {
  component: '#00F0FF',
  surface: '#A78BFA',
  worker: '#FBBF24',
  skin: '#34D399',
  template: '#FB7185',
  block: '#818CF8',
  addon: '#60A5FA',
};

export function FeatureRegistryPanel() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<FeatureType | 'all'>('all');

  const features = useMemo(() => {
    const base = searchFeatures(query);
    return type === 'all' ? base : base.filter((f) => f.type === type);
  }, [query, type]);

  const counts = useMemo(() => {
    const all = allFeatures();
    const c = {} as Record<FeatureType | 'all', number>;
    c.all = all.length;
    for (const f of all) c[f.type] = (c[f.type] ?? 0) + 1;
    return c;
  }, []);

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }} data-mcp-tool="featureRegistryPanel" data-mcp-state={type}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f2f5', margin: 0 }}>Feature Registry</h2>
        <span style={{ fontSize: 11, color: 'rgba(240,242,245,0.4)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
          {counts.all} capabilities
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} data-mcp-tool="featureFilterGroup" data-mcp-target="feature-filters">
        <FilterChip label={`All · ${counts.all}`} active={type === 'all'} color="#f0f2f5" onClick={() => setType('all')} data-mcp-tool="setFeatureFilter" data-mcp-target="filter-all" data-mcp-state={type === 'all' ? 'active' : 'inactive'} />
        {(Object.keys(TYPE_LABELS) as FeatureType[]).map((t) => (
          <FilterChip
            key={t}
            label={`${TYPE_LABELS[t]} · ${counts[t] ?? 0}`}
            active={type === t}
            color={ACCENT[t]}
            onClick={() => setType(t)}
            data-mcp-tool="setFeatureFilter"
            data-mcp-target={`filter-${t}`}
            data-mcp-state={type === t ? 'active' : 'inactive'}
          />
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, id, tag…"
        data-mcp-tool="searchFeatures"
        data-mcp-type="input"
        data-mcp-target="feature-search"
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.25)',
          color: '#f0f2f5',
          fontSize: 13,
          fontFamily: 'var(--p31-font-mono, monospace)',
          outline: 'none',
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, alignContent: 'start' }}>
        {features.map((f) => (
          <div
            key={f.id}
            style={{
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${ACCENT[f.type]}33`,
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f2f5' }}>{f.name}</span>
              <span style={{ fontSize: 9, color: ACCENT[f.type], fontFamily: 'var(--p31-font-mono, monospace)' }}>
                {f.maturity}
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.35)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
              {TYPE_LABELS[f.type]} · {f.category} · v{f.version}
            </span>
            <p style={{ fontSize: 11, color: 'rgba(240,242,245,0.6)', lineHeight: 1.5, margin: 0 }}>{f.description}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {f.tags?.map((t) => (
                <span key={t} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(240,242,245,0.5)', fontFamily: 'var(--p31-font-mono, monospace)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
        {features.length === 0 && (
          <span style={{ fontSize: 12, color: 'rgba(240,242,245,0.4)' }}>No matches.</span>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: active ? `${color}1a` : 'rgba(255,255,255,0.03)',
        color: active ? color : 'rgba(240,242,245,0.6)',
        fontSize: 10,
        cursor: 'pointer',
        fontFamily: 'var(--p31-font-mono, monospace)',
      }}
    >
      {label}
    </button>
  );
}
