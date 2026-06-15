import React, { useState } from 'react';
import { SecurityBadge } from '../components/SecurityBadge';
import type { VaultItem } from '@p31/core';

interface LawDashboardProps {
  items?: VaultItem[];
  onAddItem?: (text: string) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const LawDashboard: React.FC<LawDashboardProps> = ({
  items = [],
  onAddItem,
  onDeleteItem,
  loading = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onAddItem) {
      await onAddItem(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono p-6">
      <header className="border-b border-emerald-900/50 pb-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔺</span>
          <h1 className="text-xl uppercase tracking-widest font-bold">Law Facet — Sovereign Vault</h1>
        </div>
        <div className="text-xs text-emerald-500/70">ML-KEM-768 | LOCAL ONLY</div>
      </header>

      <main>
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter encrypted record..."
              className="flex-1 bg-black/50 border border-emerald-800 rounded px-4 py-2 text-emerald-300 placeholder:text-emerald-800 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700 px-6 py-2 rounded uppercase text-xs tracking-wider disabled:opacity-50"
            >
              Commit
            </button>
          </form>
        </div>

        <div className="border border-emerald-900/30 rounded overflow-hidden">
          <div className="bg-slate-900/50 px-4 py-2 border-b border-emerald-900/30 text-xs uppercase tracking-wider flex justify-between">
            <span>Timestamp</span>
            <span>Signature (SHA-256)</span>
            <span>Content</span>
            <span></span>
          </div>
          <div className="divide-y divide-emerald-900/20">
            {loading ? (
              <div className="p-4 text-center text-emerald-600 animate-pulse">Loading sovereign records...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-emerald-600/50">No records found. Add one above.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="px-4 py-2 flex items-center justify-between text-sm">
                  <span className="font-mono text-emerald-500 w-32">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span className="font-mono text-emerald-600 truncate flex-1 mx-4">
                    {item.signature.slice(0, 16)}...
                  </span>
                  <span className="text-emerald-300 truncate flex-1">{item.text}</span>
                  <button
                    onClick={() => onDeleteItem?.(item.id)}
                    className="text-red-400 hover:text-red-300 ml-4"
                    aria-label="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <SecurityBadge storageType="IndexedDB" encryptionStatus="active" signatureVerified />
    </div>
  );
};
