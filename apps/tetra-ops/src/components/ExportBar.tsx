/**
 * @file ExportBar — Shared export (CSV/JSON) + import bar for nonprofit panels.
 */

import { useRef } from 'react';
import { exportTetrasAsCSV, exportTetrasAsJSON, downloadBlob, importTetrasFromJSON } from '../lib/nonprofitKit';

export function ExportBar({ items, prefix }: { items: any[]; prefix: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const count = await importTetrasFromJSON(text);
    if (count > 0) {
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button onClick={() => downloadBlob(exportTetrasAsCSV(items), `${prefix}-export.csv`)} style={{
        padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
        color: 'rgba(240,242,245,0.4)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--p31-font-mono, monospace)',
      }}>
        CSV
      </button>
      <button onClick={() => downloadBlob(exportTetrasAsJSON(items), `${prefix}-export.json`, 'application/json')} style={{
        padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
        color: 'rgba(240,242,245,0.4)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--p31-font-mono, monospace)',
      }}>
        JSON
      </button>
      <button onClick={() => fileRef.current?.click()} style={{
        padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(0,240,255,0.15)', background: 'transparent',
        color: 'rgba(0,240,255,0.5)', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--p31-font-mono, monospace)',
      }}>
        Import
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
    </div>
  );
}

export default ExportBar;
