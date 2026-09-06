import { useState, useEffect } from 'react';
import { listTetras, createTetra, deleteTetra, makeTetraId } from '../lib/nonprofitKit';
import { ExportBar } from '../components/ExportBar';

export function GrantPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [deadline, setDeadline] = useState('');

  const refresh = async () => setItems(await listTetras('GRANT_PORTAL'));
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!label.trim()) return;
    const id = makeTetraId('grant');
    await createTetra({ schema: 'p31.tetra/v1', id, metadata: { timestamp: new Date().toISOString(), source: 'tetra-ops', version: '1.0', scale: 'hub', class: 'GRANT_PORTAL', label: label.trim(), deadline: deadline }, vertices: [{ id: `${id}_v0`, label: label.trim(), val: 1, color: '#00f0ff' }, { id: `${id}_v1`, label: 'Application', val: 0, color: '#fbbf24' }, { id: `${id}_v2`, label: 'Review', val: 0, color: '#a78bfa' }, { id: `${id}_v3`, label: 'Award', val: 0, color: '#34d399' }], edges: [{ source: `${id}_v0`, target: `${id}_v1`, weight: 1, relation: 'submits' }, { source: `${id}_v1`, target: `${id}_v2`, weight: 0.8, relation: 'evaluated' }, { source: `${id}_v2`, target: `${id}_v3`, weight: 0.6, relation: 'results' }, { source: `${id}_v0`, target: `${id}_v3`, weight: 0.9, relation: 'receives' }, { source: `${id}_v1`, target: `${id}_v3`, weight: 0.5, relation: 'hopes' }, { source: `${id}_v2`, target: `${id}_v0`, weight: 0.3, relation: 'feedback' }] });
    setLabel(''); setDeadline(''); refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="grantPanel" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grant Tracker</div>
        <ExportBar items={items} prefix="grants" />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Grant name..." data-mcp-tool="grantLabel" data-mcp-type="input" data-mcp-target="grant-label" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="Deadline..." data-mcp-tool="grantDeadline" data-mcp-type="input" data-mcp-target="grant-deadline" style={{ width: 80, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <button onClick={add} data-mcp-tool="addGrant" data-mcp-type="action" data-mcp-target="grant-add" style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflow: 'auto' }}>
        {items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#00f0ff', fontWeight: 600 }}>{item.label || item.id}</span>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{item.created_at?.slice(0, 10)}</span>
            <button onClick={async () => { await deleteTetra(item.id); refresh(); }} data-mcp-tool="deleteGrant" data-mcp-type="action" data-mcp-target={`grant-${item.id}`} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GrantPanel;
