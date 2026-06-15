import React, { useState } from 'react';
import { SecurityBadge } from '../components/SecurityBadge';
import type { VaultItem } from '@p31/core';

interface KidDashboardProps {
  items?: VaultItem[];
  onAddItem?: (text: string) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const KidDashboard: React.FC<KidDashboardProps> = ({
  items = [],
  onAddItem,
  onDeleteItem,
  loading = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [showSecretBackpack, setShowSecretBackpack] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onAddItem) {
      await onAddItem(inputText.trim());
      setInputText('');
      setShowSecretBackpack(true);
      setTimeout(() => setShowSecretBackpack(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-pink-100 font-sans p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bounce">🧸</span>
          <h1 className="text-3xl font-bold text-pink-700 drop-shadow-md">Secret Backpack</h1>
        </div>
        <div className="text-sm bg-white/70 px-4 py-2 rounded-full shadow-sm">
          ⭐ {items.length} treasures
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a secret note..."
            className="flex-1 rounded-full px-6 py-4 text-lg border-2 border-pink-300 focus:outline-none focus:border-pink-500 shadow-sm bg-white/90"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition transform active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            Save ✨
          </button>
        </form>

        {showSecretBackpack && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-pink-800 px-6 py-3 rounded-full shadow-lg animate-bounce z-50">
            🎒 Added to your secret backpack!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-gray-500">Loading your treasures...</div>
          ) : items.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white/50 rounded-2xl">
              <span className="text-6xl">🎒</span>
              <p className="mt-4 text-gray-600">Your secret backpack is empty. Write your first secret!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition flex justify-between items-start gap-3"
              >
                <div className="flex-1">
                  <p className="text-gray-800 text-lg">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteItem?.(item.id)}
                  className="text-pink-400 hover:text-pink-600 text-xl transition"
                  aria-label="Delete secret"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <div className="mt-12 text-center">
        <SecurityBadge storageType="Secret Backpack (IndexedDB)" encryptionStatus="active" signatureVerified />
      </div>
    </div>
  );
};
