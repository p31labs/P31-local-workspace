import { useEffect, useRef, useState } from 'react';

const BOOT_LOG = [
  'P31 TETRA God‑View initialized.',
  'K₄ topology verified: 4V · 6E · β₂ = 1.',
  'tetra-hub bound: k4-cage · k4-personal · k4-hubs.',
  'Click a vertex to inspect. 863 Hz.',
];

export function Footer() {
  const [logs, setLogs] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    BOOT_LOG.forEach((l, i) => setTimeout(() => setLogs((p) => [...p, l]), i * 220));
  }, []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  return (
    <footer className="tetra-foot glass-strong ui-chrome" style={{ borderRadius: 0, borderTop: '1px solid var(--p31-glass-border)', display: 'grid', gridTemplateColumns: '1fr 190px', overflow: 'hidden' }}>
      <div style={{ padding: '9px var(--p31-spacing-md)', display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="fa-solid fa-terminal" style={{ fontSize: 9, color: 'var(--p31-accent)' }} />
          <span className="tetra-label" style={{ padding: 0 }}>Event Stream</span>
          <button onClick={() => setLogs([])} style={{ marginLeft: 'auto', fontFamily: 'var(--p31-font-mono)', fontSize: 9, color: 'var(--p31-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>clear</button>
        </div>
        <div ref={termRef} className="tetra-terminal" aria-live="polite">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: '9px var(--p31-spacing-md)', borderLeft: '1px solid var(--p31-glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="tetra-label">Canonical Tokens</div>
        {[
          { c: 'var(--p31-accent-gold)', l: 'gold · V1' },
          { c: 'var(--p31-accent)', l: 'cyan · V2' },
          { c: 'var(--p31-accent-violet)', l: 'violet · V3' },
          { c: 'var(--p31-accent-green)', l: 'green · V4' },
          { c: 'var(--p31-void)', l: 'void · base' },
        ].map((t) => (
          <div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, background: t.c, display: 'inline-block', flexShrink: 0, boxShadow: t.c.startsWith('var(--p31-void)') ? 'none' : `0 0 5px ${t.c}`, border: '1px solid var(--p31-glass-border)' }} />
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--p31-text-tertiary)' }}>{t.l}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
