import { useState, useEffect } from 'react';

const SAVE_KEY = 'p31:pages';

interface PageMeta {
  id: string;
  name: string;
  blocks: unknown[];
  createdAt: number;
}

export function PageManager() {
  const [pages, setPages] = useState<PageMeta[]>([]);

  useEffect(() => {
    try { setPages(JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')); } catch { setPages([]); }
  }, []);

  const refresh = () => {
    try { setPages(JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')); } catch { setPages([]); }
  };

  const del = (id: string) => {
    const updated = pages.filter(p => p.id !== id);
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
    setPages(updated);
  };

  const load = (id: string) => {
    const page = pages.find(p => p.id === id);
    if (page) {
      window.dispatchEvent(new CustomEvent('p31:load-blocks', { detail: page.blocks }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Saved Pages ({pages.length})
        </span>
        <button onClick={refresh} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(240,242,245,0.3)', fontSize: 9, cursor: 'pointer' }}>↻</button>
      </div>
      {pages.length === 0 && (
        <div style={{ padding: 12, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'rgba(240,242,245,0.2)', fontSize: 10 }}>
          No saved pages yet. Use the Build panel to create and save pages.
        </div>
      )}
      {pages.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#f0f2f5', fontSize: 11 }}>{p.name}</div>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.25)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{p.blocks.length} blocks · {new Date(p.createdAt).toLocaleDateString()}</div>
          </div>
          <button onClick={() => load(p.id)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.06)', color: '#00f0ff', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>Load</button>
          <button onClick={() => del(p.id)} style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid rgba(251,113,133,0.15)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
        </div>
      ))}
    </div>
  );
}

export default PageManager;
