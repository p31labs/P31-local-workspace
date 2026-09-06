import { useState, useEffect } from 'react';
import { listTetras, createTetra, deleteTetra, makeTetraId } from '../lib/nonprofitKit';
import { ExportBar } from '../components/ExportBar';

function LedgerPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const refresh = async () => setItems(await listTetras('LEDGER_NODE'));
  useEffect(() => { refresh(); }, []);
  const add = async () => {
    if (!desc.trim()) return;
    const id = makeTetraId('ledger');
    const amt = parseInt(amount) || 0;
    await createTetra({ schema: 'p31.tetra/v1', id, metadata: { timestamp: new Date().toISOString(), source: 'tetra-ops', version: '1.0', scale: 'hub', class: 'LEDGER_NODE', label: desc.trim(), amount: amt, type: amt >= 0 ? 'income' : 'expense' }, vertices: [{ id: `${id}_v0`, label: desc.trim(), val: 1, color: amt >= 0 ? '#34d399' : '#fb7185' }, { id: `${id}_v1`, label: 'Debit', val: amt >= 0 ? amt / 10000 : 0, color: '#fbbf24' }, { id: `${id}_v2`, label: 'Credit', val: amt < 0 ? Math.abs(amt) / 10000 : 0, color: '#00f0ff' }, { id: `${id}_v3`, label: 'Balance', val: 0.5, color: '#a78bfa' }], edges: [{ source: `${id}_v0`, target: `${id}_v1`, weight: 1, relation: 'charges' }, { source: `${id}_v2`, target: `${id}_v0`, weight: 1, relation: 'credits' }, { source: `${id}_v1`, target: `${id}_v3`, weight: 0.8, relation: 'affects' }, { source: `${id}_v2`, target: `${id}_v3`, weight: 0.8, relation: 'affects' }, { source: `${id}_v0`, target: `${id}_v3`, weight: 0.6, relation: 'impacts' }, { source: `${id}_v1`, target: `${id}_v2`, weight: 0.5, relation: 'balances' }] });
    setDesc(''); setAmount(''); refresh();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="ledgerPanel" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ledger</div>
        <ExportBar items={items} prefix="ledger" />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description..." data-mcp-tool="ledgerDesc" data-mcp-type="input" data-mcp-target="ledger-desc" style={{ flex: 1, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="+/-$" data-mcp-tool="ledgerAmount" data-mcp-type="input" data-mcp-target="ledger-amount" style={{ width: 60, padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5', fontSize: 10, outline: 'none' }} />
        <button onClick={add} data-mcp-tool="addLedgerEntry" data-mcp-type="action" data-mcp-target="ledger-add" style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflow: 'auto' }}>
        {items.map((item: any) => {
          const isIncome = item.type === 'income';
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: isIncome ? '#34d399' : '#fb7185', fontWeight: 600 }}>{item.label || item.id}</span>
              <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: isIncome ? '#34d399' : '#fb7185' }}>{isIncome ? '+' : '-'}${Math.abs(item.amount || 0)}</span>
              <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{item.created_at?.slice(0, 10)}</span>
              <button onClick={async () => { await deleteTetra(item.id); refresh(); }} data-mcp-tool="deleteLedgerEntry" data-mcp-type="action" data-mcp-target={`ledger-entry-${item.id}`} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(251,113,133,0.2)', background: 'transparent', color: '#fb7185', fontSize: 9, cursor: 'pointer' }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LedgerPanel;
