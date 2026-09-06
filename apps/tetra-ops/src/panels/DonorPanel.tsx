import { useState, useEffect } from 'react';
import { listTetras, createTetra, deleteTetra, makeTetraId } from '../lib/nonprofitKit';
import { ExportBar } from '../components/ExportBar';

export function DonorPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [contact, setContact] = useState('');

  const refresh = async () => setItems(await listTetras('DONOR_CAGE'));
  useEffect(() => { refresh(); }, []);

  const add = async () => {
    if (!label.trim()) return;
    const id = makeTetraId('donor');
    await createTetra({ schema: 'p31.tetra/v1', id, metadata: { timestamp: new Date().toISOString(), source: 'tetra-ops', version: '1.0', scale: 'personal', class: 'DONOR_CAGE', label: label.trim(), contact: contact.trim() }, vertices: [{ id: `${id}_v0`, label: label.trim(), val: 1, color: '#fbbf24' }, { id: `${id}_v1`, label: 'Donations', val: 0, color: '#34d399' }, { id: `${id}_v2`, label: 'Communications', val: 0, color: '#00f0ff' }, { id: `${id}_v3`, label: 'Receipts', val: 0, color: '#a78bfa' }], edges: [{ source: `${id}_v0`, target: `${id}_v1`, weight: 0.8, relation: 'gave' }, { source: `${id}_v0`, target: `${id}_v2`, weight: 0.5, relation: 'contacted' }, { source: `${id}_v1`, target: `${id}_v3`, weight: 1, relation: 'generated' }, { source: `${id}_v0`, target: `${id}_v3`, weight: 0.7, relation: 'received' }, { source: `${id}_v1`, target: `${id}_v2`, weight: 0.3, relation: 'thanked' }, { source: `${id}_v2`, target: `${id}_v3`, weight: 0.4, relation: 'prompted' }] });
    setLabel(''); setContact(''); refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="donorPanel" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Donor CRM</div>
        <ExportBar items={items} prefix="donors" />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Donor name..." data-mcp-tool="donorLabel" data-mcp-type="input" data-mcp-target="donor-label" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Email..." data-mcp-tool="donorContact" data-mcp-type="input" data-mcp-target="donor-contact" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <button onClick={add} data-mcp-tool="addDonor" data-mcp-type="action" data-mcp-target="donor-add" style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflow: 'auto' }}>
        {items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{item.label || item.id}</span>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{item.created_at?.slice(0, 10)}</span>
            <button onClick={async () => { await deleteTetra(item.id); refresh(); }} data-mcp-tool="deleteDonor" data-mcp-type="action" data-mcp-target={`donor-${item.id}`} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <div style={{ textAlign: 'center', padding: 12, color: 'rgba(240,242,245,0.3)', fontSize: 10 }}>No donors yet</div>}
      </div>
    </div>
  );
}

export default DonorPanel;
