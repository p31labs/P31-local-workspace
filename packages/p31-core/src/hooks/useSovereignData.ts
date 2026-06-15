import { useState, useEffect, useCallback } from 'react';
import { get, set, del, keys } from 'idb-keyval';

export interface VaultItem {
  id: string;
  text: string;
  timestamp: number;
  signature: string;
}

function createSignature(text: string, timestamp: number): string {
  const msg = `${text}:${timestamp}:p31-sovereign-vault`;
  let hash = 0;
  for (let i = 0; i < msg.length; i++) {
    const char = msg.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sim-${Math.abs(hash).toString(16).padStart(12, '0')}`;
}

export function useSovereignData() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const allKeys = await keys();
      const vaultKeys = allKeys.filter((k: IDBValidKey) => String(k).startsWith('vault-'));
      const loaded: VaultItem[] = [];
      for (const k of vaultKeys) {
        const item = await get(k);
        if (item) loaded.push(item as VaultItem);
      }
      loaded.sort((a, b) => b.timestamp - a.timestamp);
      setItems(loaded);
    } catch (e) {
      console.error('Failed to load sovereign data:', e);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(async (text: string) => {
    const id = `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = Date.now();
    const signature = createSignature(text, timestamp);
    const item: VaultItem = { id, text, timestamp, signature };
    setItems((prev: VaultItem[]) => [{ ...item }, ...prev]);
    try {
      await set(id, item);
    } catch (e) {
      console.error('Failed to persist sovereign data:', e);
      setItems((prev: VaultItem[]) => prev.filter((i: VaultItem) => i.id !== id));
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev: VaultItem[]) => prev.filter((i: VaultItem) => i.id !== id));
    try {
      await del(id);
    } catch (e) {
      console.error('Failed to delete sovereign data:', e);
      loadItems();
    }
  }, []);

  return { items, addItem, deleteItem, loading, reload: loadItems };
}
