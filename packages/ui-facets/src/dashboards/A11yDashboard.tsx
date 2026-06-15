import React, { useState } from 'react';
import { SecurityBadge } from '../components/SecurityBadge';
import type { VaultItem } from '@p31/core';

interface A11yDashboardProps {
  items?: VaultItem[];
  onAddItem?: (text: string) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const A11yDashboard: React.FC<A11yDashboardProps> = ({
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
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <header className="border-b-2 border-white pb-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Accessible Vault</h1>
        <p className="text-xl text-gray-300 mt-2">Your data, stored locally and encrypted</p>
      </header>

      <main className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-12">
          <label htmlFor="a11y-input" className="block text-lg font-semibold mb-2">
            Add new record
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              id="a11y-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your secure note..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-lg focus:outline-none focus:border-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-white text-black font-bold px-6 py-3 rounded hover:bg-gray-200 transition disabled:opacity-50"
            >
              Save Record
            </button>
          </div>
        </form>

        <section aria-label="Stored records">
          <h2 className="text-2xl font-bold mb-4">Your Records</h2>
          {loading ? (
            <div className="text-center py-12" aria-live="polite">Loading records...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No records yet. Add one above.</div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="bg-gray-900 rounded p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-lg break-words">{item.text}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                        Signature: {item.signature.slice(0, 16)}...
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteItem?.(item.id)}
                      className="text-red-400 hover:text-red-300 text-xl px-2"
                      aria-label="Delete record"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mt-16 pt-8 border-t border-gray-800">
        <SecurityBadge storageType="IndexedDB" encryptionStatus="active" signatureVerified />
      </footer>
    </div>
  );
};
