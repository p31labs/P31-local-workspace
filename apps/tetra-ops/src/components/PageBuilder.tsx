/**
 * @file PageBuilder — DevMenu panel: drag-and-drop page assembly from @p31ca/ui blocks.
 * HTML5 native drag-and-drop. No external deps. Vertical block stack + export.
 */

import { useState, useRef, useEffect } from 'react';
import { COMPONENTS, type PropDef, type ComponentEntry } from '../data/components';
import { EphemeralProvider, AdaptiveLayout } from '@p31ca/ui';

interface PageMeta { id: string; name: string; blocks: PageBlock[]; createdAt: number; }

const TEMPLATES = [
  { id: 'landing', name: 'Landing Page', description: 'Hero + features + CTA + footer', blocks: ['glass-card', 'glow-button', 'footer'] },
  { id: 'dashboard', name: 'Dashboard', description: 'K4 topology + stats + LOVE balance', blocks: ['app-nav', 'glass-card', 'sovereignty-strip'] },
  { id: 'campaign', name: 'Campaign', description: 'Donation form + progress + testimonials', blocks: ['glass-card', 'glow-button', 'footer'] },
  { id: 'portfolio', name: 'Portfolio', description: 'Showcase with grid + project cards', blocks: ['glass-card', 'glow-button', 'footer'] },
];

const PRESETS = [
  { id: 'hero', label: 'Hero Section', blocks: ['glass-card', 'glow-button'] },
  { id: 'feature-grid', label: 'Feature Grid', blocks: ['glass-card', 'glass-card'] },
  { id: 'testimonial', label: 'Testimonial Row', blocks: ['glass-card'] },
  { id: 'pricing', label: 'Pricing Table', blocks: ['glass-card', 'glow-button'] },
  { id: 'contact', label: 'Contact Form', blocks: ['glass-card'] },
  { id: 'faq', label: 'FAQ Section', blocks: ['glass-card'] },
];

interface PageBlock {
  id: string;
  compId: string;
  order: number;
  props: Record<string, unknown>;
  /** Per-size-class prop overrides (compact/regular/medium/expanded). */
  responsive?: Partial<Record<'compact' | 'regular' | 'medium' | 'expanded', Record<string, unknown>>>;
}

type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';

/** Resolve the active size-class from the DOM attribute set by design-core/device. */
function getCurrentSizeClass(): SizeClass {
  const sc = (typeof document !== 'undefined' && document.documentElement.dataset.sizeClass) as SizeClass | undefined;
  return sc && ['compact', 'regular', 'medium', 'expanded'].includes(sc) ? sc : 'regular';
}

/** Hook: returns the effective (responsive-resolved) props for a block at the live size-class. */
function useResponsiveProps(block: PageBlock): Record<string, unknown> {
  const [, force] = useState(0);
  useEffect(() => {
    const onResize = () => force((n) => n + 1);
    window.addEventListener('resize', onResize);
    const mo = new MutationObserver(onResize);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-size-class'] });
    return () => { window.removeEventListener('resize', onResize); mo.disconnect(); };
  }, []);
  const sc = getCurrentSizeClass();
  return { ...block.props, ...(block.responsive?.[sc] || {}) };
}

function PropEditor({ block, comp, onUpdate }: { block: PageBlock; comp: { props?: Record<string, PropDef> }; onUpdate: (key: string, value: unknown) => void }) {
  if (!comp.props) return <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)' }}>No configurable props</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Object.entries(comp.props).map(([key, def]) => (
        <div key={key}>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)', marginBottom: 2 }}>{def.label || key}</div>
          {def.type === 'boolean' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, color: 'rgba(240,242,245,0.6)' }}>
              <input type="checkbox" checked={!!block.props[key]} onChange={e => onUpdate(key, e.target.checked)} style={{ accentColor: '#00f0ff' }} />
              {String(def.default)}
            </label>
          ) : def.type === 'select' ? (
            <select value={String(block.props[key] ?? def.default)} onChange={e => onUpdate(key, e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit' }}>
              {(def.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : def.type === 'number' ? (
            <input type="number" value={Number(block.props[key] ?? def.default)} onChange={e => onUpdate(key, Number(e.target.value))} style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit' }} />
          ) : (
            <input type="text" value={String(block.props[key] ?? def.default)} onChange={e => onUpdate(key, e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function PageBuilder() {
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [deployUrl, setDeployUrl] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [frameSizeClass, setFrameSizeClass] = useState<SizeClass | null>(null);
  const [pageName, setPageName] = useState('');
  const [savedPages, setSavedPages] = useState<PageMeta[]>([]);
  const refreshPages = () => setSavedPages(loadPages());
  useState(() => refreshPages());
  const nextId = useRef(1);
  const dragItem = useRef<number | null>(null);

  const addBlock = (compId: string) => {
    const comp = COMPONENTS.find(c => c.id === compId);
    const defaults: Record<string, unknown> = {};
    if (comp?.props) {
      for (const [key, def] of Object.entries(comp.props)) {
        defaults[key] = def.default;
      }
    }
    const newBlock = { id: `b_${nextId.current++}`, compId, order: blocks.length, props: defaults, responsive: {} };
    setBlocks(b => [...b, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setBlocks(b => b.filter(x => x.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (idx: number, toIdx: number) => {
    const copy = [...blocks];
    const [item] = copy.splice(idx, 1);
    copy.splice(toIdx, 0, item);
    setBlocks(copy.map((b, i) => ({ ...b, order: i })));
  };

  const updateBlockProp = (blockId: string, key: string, value: unknown) => {
    setBlocks(b => b.map(block =>
      block.id === blockId ? { ...block, props: { ...block.props, [key]: value } } : block
    ));
  };

  const makeBlock = (compId: string) => {
    const comp = COMPONENTS.find(c => c.id === compId);
    const defaults: Record<string, unknown> = {};
    if (comp?.props) for (const [k, d] of Object.entries(comp.props)) defaults[k] = d.default;
    return { id: `b_${nextId.current++}`, compId, order: blocks.length, props: defaults, responsive: {} };
  };

  const applyTemplate = (templateId: string) => {
    const t = TEMPLATES.find(x => x.id === templateId);
    if (!t) return;
    const newBlocks = t.blocks.map(id => makeBlock(id));
    setBlocks(prev => [...prev, ...newBlocks]);
    setSelectedBlockId(newBlocks[newBlocks.length - 1]?.id ?? null);
  };

  const applyPreset = (presetId: string) => {
    const p = PRESETS.find(x => x.id === presetId);
    if (!p) return;
    const newBlocks = p.blocks.map(id => makeBlock(id));
    setBlocks(prev => [...prev, ...newBlocks]);
    setSelectedBlockId(newBlocks[newBlocks.length - 1]?.id ?? null);
  };

  const SAVE_KEY = 'p31:pages';
  const loadPages = (): PageMeta[] => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch { return []; } };
  const persistPages = (pages: PageMeta[]) => localStorage.setItem(SAVE_KEY, JSON.stringify(pages));

  const saveCurrentPage = (name: string) => {
    const pages = loadPages();
    const existing = pages.find(p => p.name === name);
    const page: PageMeta = { id: existing?.id || `page_${Date.now()}`, name, blocks: blocks as PageBlock[], createdAt: Date.now() };
    if (existing) Object.assign(existing, page);
    else pages.push(page);
    persistPages(pages);
  };

  const loadPageById = (id: string) => {
    const pages = loadPages();
    const page = pages.find(p => p.id === id);
    if (page) setBlocks(page.blocks as PageBlock[]);
  };

  const exportProject = () => {
    const pkg = { name: 'p31-page', version: '1.0.0', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', '@p31ca/design-core': '^1.0.0', '@p31ca/ui': '^1.0.0' }, devDependencies: { vite: '^8.0.0', '@vitejs/plugin-react': '^4.0.0' } };
    const vc = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });`;
    const app = `import React from 'react';\nimport '@p31ca/design-core/css/all.css';\nimport { EphemeralProvider, AdaptiveLayout } from '@p31ca/ui';\n\n${exportImports()}\n\nexport default function App() {\n  return (\n    <EphemeralProvider ambientMode="soft">\n      <AdaptiveLayout>\n${exportJSX()}\n      </AdaptiveLayout>\n    </EphemeralProvider>\n  );\n}`;
    const main = `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nconst el = document.getElementById('root');\nif (el) createRoot(el).render(<App />);`;
    const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>P31 Page</title></head><body><div id="root"></div><script type="module" src="./src/main.tsx"></script></body></html>';
    const files = { 'package.json': JSON.stringify(pkg, null, 2), 'vite.config.ts': vc, 'index.html': html, 'src/main.tsx': main, 'src/App.tsx': app };
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'p31-page-project.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSX = () => {
    return blocks.map(block => {
      const comp = COMPONENTS.find(c => c.id === block.compId);
      if (!comp) return '';
      const propStr = block.props && Object.keys(block.props).length > 0
        ? ' ' + Object.entries(block.props).map(([k, v]) => {
            if (typeof v === 'boolean') return v ? k : `${k}={false}`;
            return `${k}="${String(v)}"`;
          }).join(' ')
        : '';
      return `  <${comp.name}${propStr} />`;
    }).join('\n');
  };

  const exportImports = () => {
    const seen = new Set<string>();
    return blocks.map(b => COMPONENTS.find(c => c.id === b.compId))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .filter(c => {
        if (seen.has(c.package)) return false;
        seen.add(c.package);
        return true;
      })
      .map(c => c.installCommand.replace(';', '') || '')
      .join('\n');
  };

  const copyExport = () => navigator.clipboard.writeText(exportJSX());
  const copyImports = () => navigator.clipboard.writeText(exportImports());

  const deployPage = async () => {
    setDeploying(true);
    setDeployError('');
    setDeployUrl('');
    try {
      const imports = exportJSX();
      const name = `page-${blocks.length}-blocks`;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title></head><body style="background:#0A0A1A;color:#f0f2f5;font-family:system-ui,sans-serif;padding:24px"><h1>${name}</h1><p>Generated by P31 Page Builder</p><pre style="color:#34d399">${imports}</pre></body></html>`;
      const res = await fetch('https://app-supervisor.trimtab-signal.workers.dev/apps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, html, css: '', js: '', creator: 'page-builder' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDeployUrl(`https://app-supervisor.trimtab-signal.workers.dev/apps/${data.id}`);
    } catch (e: any) {
      setDeployError(e.message || 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, maxHeight: '60vh', overflow: 'auto' }}>
      {/* Block palette */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Block Palette</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {COMPONENTS.filter(c => c.category !== 'layout').map(c => (
            <button
              key={c.id}
              onClick={() => addBlock(c.id)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', c.id);
              }}
              style={{
                padding: '5px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(240,242,245,0.5)', fontSize: 10,
                cursor: 'grab', textAlign: 'left',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(139,92,246,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Templates</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t.id)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.04)', color: 'rgba(240,242,245,0.6)', fontSize: 9, cursor: 'pointer' }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(52,211,153,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Block Presets</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p.id)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.15)', background: 'rgba(52,211,153,0.04)', color: 'rgba(240,242,245,0.6)', fontSize: 9, cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, minHeight: 100 }}>
        {/* Canvas column */}
        <div style={{ flex: selectedBlockId ? 1 : 'none', minWidth: selectedBlockId ? 0 : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Canvas ({blocks.length} block{blocks.length !== 1 ? 's' : ''})
            </span>
            <button onClick={() => setShowPreview(p => !p)} style={{
              padding: '2px 6px', borderRadius: 3, border: showPreview ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
              background: showPreview ? 'rgba(0,240,255,0.08)' : 'transparent', color: showPreview ? '#00f0ff' : 'rgba(240,242,245,0.3)',
              fontSize: 9, cursor: 'pointer',
            }}>
              {showPreview ? 'Preview' : 'List'}
            </button>
          </div>
          {blocks.length === 0 && (
            <div style={{
              padding: 16, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'rgba(240,242,245,0.3)', fontSize: 10,
            }}>
              Drop blocks here or click from the palette above
            </div>
          )}
          <div data-size-class={frameSizeClass ?? undefined} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {showPreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: 'rgba(240,242,245,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frame</span>
                {(['compact', 'regular', 'medium', 'expanded'] as SizeClass[]).map(sc => (
                  <button
                    key={sc}
                    onClick={() => setFrameSizeClass(sc)}
                    onDoubleClick={() => setFrameSizeClass(null)}
                    title={frameSizeClass === null ? 'Double-click to release to live size-class' : 'Click to pin this size-class'}
                    style={{
                      padding: '2px 6px', borderRadius: 3, cursor: 'pointer', fontSize: 9, fontFamily: 'var(--p31-font-mono, monospace)',
                      border: frameSizeClass === sc ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
                      background: frameSizeClass === sc ? 'rgba(0,240,255,0.1)' : 'transparent',
                      color: frameSizeClass === sc ? '#00f0ff' : 'rgba(240,242,245,0.4)',
                    }}
                  >
                    {sc}
                  </button>
                ))}
                {frameSizeClass && (
                  <span style={{ fontSize: 8, color: 'rgba(240,242,245,0.25)', marginLeft: 2 }}>pinned · dbl-click to release</span>
                )}
              </div>
            )}
            <EphemeralProvider ambientMode="soft">
            <AdaptiveLayout>
            {blocks.map((block, idx) => {
              const comp = COMPONENTS.find(c => c.id === block.compId);
              const isSelected = selectedBlockId === block.id;
              const hasProps = comp?.props && Object.keys(comp.props).length > 0;

              if (showPreview) {
                const previewBg = comp?.category === 'chrome' ? 'rgba(139,92,246,0.06)' : comp?.category === 'layout' ? 'rgba(251,191,36,0.06)' : 'rgba(0,240,255,0.06)';
                const previewBorder = comp?.category === 'chrome' ? 'rgba(139,92,246,0.15)' : comp?.category === 'layout' ? 'rgba(251,191,36,0.15)' : 'rgba(0,240,255,0.15)';
                const previewBadge = comp?.category === 'chrome' ? '#8b5cf6' : comp?.category === 'layout' ? '#fbbf24' : '#00f0ff';
                return (
                  <div key={block.id} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    <div
                      draggable
                      onDragStart={() => { dragItem.current = idx; }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragItem.current === null || dragItem.current === idx) return;
                        moveBlock(dragItem.current, idx);
                        dragItem.current = idx;
                      }}
                      onDragEnd={() => { dragItem.current = null; }}
                      onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                        border: isSelected ? `1px solid ${previewBadge}` : `1px solid ${previewBorder}`,
                        background: previewBg, display: 'flex', flexDirection: 'column', gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 8, color: previewBadge, fontFamily: 'var(--p31-font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{comp?.category}</span>
                        <span style={{ fontSize: 10, color: '#f0f2f5', fontWeight: 600 }}>{comp?.name}</span>
                      </div>
                      <div style={{
                        height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: comp?.category === 'chrome' ? 'rgba(139,92,246,0.04)' : comp?.category === 'layout' ? 'rgba(251,191,36,0.04)' : 'rgba(0,240,255,0.04)',
                        border: `1px dashed ${previewBorder}`, fontSize: 8, color: 'rgba(240,242,245,0.2)',
                      }}>
                        {comp?.category === 'chrome' ? '🔲' : comp?.category === 'layout' ? '⬛' : '▣'} Preview
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer', marginTop: 8 }}>✕</button>
                  </div>
                );
              }

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => { dragItem.current = idx; }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragItem.current === null || dragItem.current === idx) return;
                    moveBlock(dragItem.current, idx);
                    dragItem.current = idx;
                  }}
                  onDragEnd={() => { dragItem.current = null; }}
                  onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 6,
                    border: isSelected ? '1px solid #00f0ff' : hasProps ? '1px solid rgba(0,240,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                    background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    opacity: hasProps ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.2)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f0f2f5', fontSize: 11 }}>{comp?.name}</div>
                    <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)' }}>{comp?.description?.slice(0, 60)}{(comp?.description?.length || 0) > 60 ? '…' : ''}</div>
                  </div>
                  {hasProps && <span style={{ fontSize: 8, color: 'rgba(0,240,255,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{isSelected ? '▲' : '⚙'}</span>}
                  <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
                </div>
              );
            })}
            </AdaptiveLayout>
            </EphemeralProvider>
          </div>
        </div>

        {/* Prop editor column */}
        {selectedBlockId && (() => {
          const selBlock = blocks.find(b => b.id === selectedBlockId);
          const selComp = selBlock ? COMPONENTS.find(c => c.id === selBlock.compId) : null;
          if (!selBlock || !selComp) return null;
          return (
            <div style={{ width: 160, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 8 }}>
              <div style={{ fontSize: 9, color: 'rgba(0,240,255,0.5)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
                {selComp.name} Props
              </div>
              <PropEditor block={selBlock} comp={selComp} onUpdate={(key, value) => updateBlockProp(selectedBlockId, key, value)} />
            </div>
          );
        })()}
      </div>

      {/* Export */}
      {blocks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Export</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={copyImports} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.08)', color: 'rgba(52,211,153,0.7)', fontSize: 9, cursor: 'pointer' }}>
                Copy imports
              </button>
              <button onClick={copyExport} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)', color: 'rgba(99,102,241,0.7)', fontSize: 9, cursor: 'pointer' }}>
                Copy JSX
              </button>
              <button onClick={exportProject} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.7)', fontSize: 9, cursor: 'pointer' }}>
                📦 Project
              </button>
              <button onClick={deployPage} disabled={deploying} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.3)', background: deploying ? 'rgba(251,191,36,0.05)' : 'transparent', color: deploying ? 'rgba(251,191,36,0.4)' : '#fbbf24', fontSize: 9, cursor: deploying ? 'default' : 'pointer', fontWeight: 600 }}>
                {deploying ? '...' : '🚀 Deploy'}
              </button>
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(52,211,153,0.4)', marginBottom: 2 }}>Imports</div>
          <pre style={{
            padding: '6px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#34d399', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)',
            maxHeight: 60, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', marginBottom: 4,
          }}>
            {exportImports()}
          </pre>
          <div style={{ fontSize: 9, color: 'rgba(99,102,241,0.4)', marginBottom: 2 }}>JSX</div>
          <pre style={{
            padding: '6px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#818cf8', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)',
            maxHeight: 80, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {exportJSX()}
          </pre>
          {deployError && (
            <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: '#fb7185', fontSize: 9 }}>{deployError}</div>
          )}
          {deployUrl && (
            <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 4, background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', marginBottom: 4 }}>LIVE PREVIEW</div>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#00f0ff', fontFamily: 'var(--p31-font-mono, monospace)', textDecoration: 'underline' }}>
                {deployUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Save / Load bar */}
      {blocks.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Save / Load</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <input value={pageName} onChange={e => setPageName(e.target.value)} placeholder="Page name..." style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={() => { if (pageName.trim()) { saveCurrentPage(pageName.trim()); setPageName(''); refreshPages(); } }} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.08)', color: '#00f0ff', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>💾 Save</button>
            <button onClick={refreshPages} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(240,242,245,0.3)', fontSize: 9, cursor: 'pointer' }}>↻</button>
          </div>
          {savedPages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {savedPages.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ flex: 1, fontSize: 9, color: 'rgba(240,242,245,0.5)' }}>{p.name}</span>
                  <button onClick={() => { loadPageById(p.id); }} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(0,240,255,0.15)', background: 'transparent', color: '#00f0ff', fontSize: 8, cursor: 'pointer' }}>Load</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PageBuilder;
