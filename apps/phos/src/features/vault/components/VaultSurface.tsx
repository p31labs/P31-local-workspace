import { useState } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface VaultItem {
  id: string;
  name: string;
  type: 'note' | 'file' | 'secret';
  content: string;
  createdAt: number;
  encrypted: boolean;
}

export function VaultSurface() {
  const [items, setItems] = useState<VaultItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('phos:vault') || '[]'); } catch { return []; }
  });
  const [draft, setDraft] = useState({ name: '', content: '', type: 'note' as VaultItem['type'] });
  const [showAdd, setShowAdd] = useState(false);

  const addItem = () => {
    if (!draft.name.trim() || !draft.content.trim()) return;
    const item: VaultItem = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      type: draft.type,
      content: draft.content.trim(),
      createdAt: Date.now(),
      encrypted: true,
    };
    const updated = [item, ...items];
    setItems(updated);
    localStorage.setItem('phos:vault', JSON.stringify(updated));
    setDraft({ name: '', content: '', type: 'note' });
    setShowAdd(false);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem('phos:vault', JSON.stringify(updated));
  };

  const typeIcon = (t: VaultItem['type']) => {
    switch (t) { case 'note': return '📝'; case 'file': return '📁'; case 'secret': return '🔑'; }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="vaultSurface" data-mcp-state={showAdd ? 'adding' : (items.length > 0 ? 'populated' : 'empty')}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Vault</h1>
        <p className="text-cloud/50 text-sm">Encrypted local storage for notes, files, and secrets.</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Items ({items.length})</h2>
          <GlowButton color="cyan" size="sm" onClick={() => setShowAdd(!showAdd)} data-mcp-tool="toggleAddItem" data-mcp-type="action" data-mcp-target="vault-add-toggle" data-mcp-state={showAdd ? 'adding' : 'idle'}>
            {showAdd ? 'Cancel' : '+ Add'}
          </GlowButton>
        </div>

        {showAdd && (
          <div className="space-y-3 mb-4 p-4 rounded-xl bg-void-surface/50 border border-white/[0.06]">
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="w-full bg-void border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-cloud/30 outline-none"
              aria-label="Item name"
              data-mcp-tool="vaultItemName"
              data-mcp-type="input"
              data-mcp-target="vault-item-name"
            />
            <div className="flex gap-2">
              {(['note', 'file', 'secret'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDraft(prev => ({ ...prev, type: t }))}
                  data-mcp-tool="selectVaultType"
                  data-mcp-type="control"
                  data-mcp-target={`vault-type-${t}`}
                  data-mcp-state={draft.type === t ? 'active' : 'inactive'}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    draft.type === t ? 'border-quantum-cyan/30 text-quantum-cyan bg-quantum-cyan/10' : 'border-white/10 text-cloud/40'
                  }`}
                >
                  {typeIcon(t)} {t}
                </button>
              ))}
            </div>
            <textarea
              value={draft.content}
              onChange={e => setDraft(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Content (encrypted locally)"
              className="w-full h-24 bg-void border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-cloud/30 outline-none resize-none"
              aria-label="Item content"
              data-mcp-tool="vaultItemContent"
              data-mcp-type="input"
              data-mcp-target="vault-item-content"
            />
            <GlowButton color="cyan" size="md" onClick={addItem} className="w-full" data-mcp-tool="saveVaultItem" data-mcp-type="action" data-mcp-target="vault-save">Save Encrypted</GlowButton>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-cloud/30 text-sm text-center py-6">Vault is empty. Add your first item.</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-void-surface/50 border border-white/[0.04] group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{typeIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{item.name}</p>
                    <p className="text-xs text-cloud/30 font-mono-tech">{item.type} · {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-quantum-green font-mono-tech">🔒</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    data-mcp-tool="deleteVaultItem"
                    data-mcp-type="action"
                    data-mcp-target={`vault-item-${item.id}`}
                    className="opacity-0 group-hover:opacity-100 text-cloud/30 hover:text-red-400 transition-all text-xs"
                    aria-label="Delete item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
