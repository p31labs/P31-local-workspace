import { useState, useEffect } from 'react';
import { listTetras, createTetra, deleteTetra, makeTetraId } from '../lib/nonprofitKit';
import { ExportBar } from '../components/ExportBar';

function CampaignPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const refresh = async () => setItems(await listTetras('CAMPAIGN_HUB'));
  useEffect(() => { refresh(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    const id = makeTetraId('camp');
    await createTetra({ schema: 'p31.tetra/v1', id, metadata: { timestamp: new Date().toISOString(), source: 'tetra-ops', version: '1.0', scale: 'hub', class: 'CAMPAIGN_HUB', label: name.trim(), goal: parseInt(goal) || 1000 }, vertices: [{ id: `${id}_v0`, label: name.trim(), val: 1, color: '#a78bfa' }, { id: `${id}_v1`, label: 'Raised', val: 0, color: '#34d399' }, { id: `${id}_v2`, label: 'Donors', val: 0, color: '#fbbf24' }, { id: `${id}_v3`, label: 'Goal', val: parseInt(goal) / 10000 || 0.1, color: '#00f0ff' }], edges: [{ source: `${id}_v0`, target: `${id}_v1`, weight: 1, relation: 'tracks' }, { source: `${id}_v2`, target: `${id}_v1`, weight: 1, relation: 'funds' }, { source: `${id}_v0`, target: `${id}_v3`, weight: 0.9, relation: 'targets' }, { source: `${id}_v1`, target: `${id}_v3`, weight: 0.7, relation: 'approaches' }, { source: `${id}_v0`, target: `${id}_v2`, weight: 0.5, relation: 'recruits' }, { source: `${id}_v2`, target: `${id}_v3`, weight: 0.3, relation: 'inspires' }] });
    setName(''); setGoal(''); refresh();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="campaignPanel" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campaigns</div>
        <ExportBar items={items} prefix="campaigns" />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name..." data-mcp-tool="campaignName" data-mcp-type="input" data-mcp-target="campaign-name" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="$ Goal" data-mcp-tool="campaignGoal" data-mcp-type="input" data-mcp-target="campaign-goal" style={{ width: 65, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <button onClick={add} data-mcp-tool="addCampaign" data-mcp-type="action" data-mcp-target="campaign-add" style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflow: 'auto' }}>
        {items.map((item: any) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{item.label || item.id}</span>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{item.created_at?.slice(0, 10)}</span>
            <button onClick={async () => { await deleteTetra(item.id); refresh(); }} data-mcp-tool="deleteCampaign" data-mcp-type="action" data-mcp-target={`campaign-${item.id}`} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CampaignPanel;
