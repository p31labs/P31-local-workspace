import { useState, useEffect } from 'react';
import { listTetras, createTetra, deleteTetra, makeTetraId } from '../lib/nonprofitKit';
import { ExportBar } from '../components/ExportBar';

function VolunteerPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const refresh = async () => setItems(await listTetras('VOLUNTEER_NET'));
  useEffect(() => { refresh(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    const id = makeTetraId('vol');
    await createTetra({ schema: 'p31.tetra/v1', id, metadata: { timestamp: new Date().toISOString(), source: 'tetra-ops', version: '1.0', scale: 'personal', class: 'VOLUNTEER_NET', label: name.trim(), hours: parseInt(hours) || 0 }, vertices: [{ id: `${id}_v0`, label: name.trim(), val: 1, color: '#00f0ff' }, { id: `${id}_v1`, label: 'Hours', val: parseInt(hours) / 40 || 0, color: '#fbbf24' }, { id: `${id}_v2`, label: 'Skills', val: 0.5, color: '#a78bfa' }, { id: `${id}_v3`, label: 'Impact', val: 0, color: '#34d399' }], edges: [{ source: `${id}_v0`, target: `${id}_v1`, weight: 1, relation: 'logged' }, { source: `${id}_v0`, target: `${id}_v2`, weight: 0.6, relation: 'offers' }, { source: `${id}_v1`, target: `${id}_v3`, weight: 0.8, relation: 'drives' }, { source: `${id}_v2`, target: `${id}_v3`, weight: 0.7, relation: 'amplifies' }, { source: `${id}_v0`, target: `${id}_v3`, weight: 0.5, relation: 'contributes' }, { source: `${id}_v1`, target: `${id}_v2`, weight: 0.4, relation: 'validates' }] });
    setName(''); setHours(''); refresh();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="volunteerPanel" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Volunteers</div>
        <ExportBar items={items} prefix="volunteers" />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name..." data-mcp-tool="volunteerName" data-mcp-type="input" data-mcp-target="volunteer-name" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <input value={hours} onChange={e => setHours(e.target.value)} placeholder="Hours" data-mcp-tool="volunteerHours" data-mcp-type="input" data-mcp-target="volunteer-hours" style={{ width: 55, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <button onClick={add} data-mcp-tool="addVolunteer" data-mcp-type="action" data-mcp-target="volunteer-add" style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflow: 'auto' }}>
        {items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#00f0ff', fontWeight: 600 }}>{item.label || item.id}</span>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{item.created_at?.slice(0, 10)}</span>
            <button onClick={async () => { await deleteTetra(item.id); refresh(); }} data-mcp-tool="deleteVolunteer" data-mcp-type="action" data-mcp-target={`volunteer-${item.id}`} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VolunteerPanel;
