// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// DiscoveryModal: naming modal for novel molecules
//
// Shows when a player completes a formula not in the
// known database. Input validated by validateDiscoveryName().
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { validateDiscoveryName } from '../engine/discovery';
import { FormulaDisplay } from './FormulaDisplay';

export function DiscoveryModal() {
  const pendingDiscovery = useGameStore((s) => s.pendingDiscovery);
  const nameDiscovery = useGameStore((s) => s.nameDiscovery);
  const dismissDiscovery = useGameStore((s) => s.dismissDiscovery);

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!pendingDiscovery) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name for your discovery');
      return;
    }
    const result = validateDiscoveryName(trimmed);
    if (!result.valid) {
      setError(result.reason ?? 'Invalid name');
      return;
    }
    nameDiscovery(trimmed);
    setName('');
    setError('');
  };

  const handleDismiss = () => {
    dismissDiscovery();
    setName('');
    setError('');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-auto">
      <div className="complete-enter bg-white/[0.07] backdrop-blur-[20px] p-8 rounded-3xl border border-white/[0.15] text-center max-w-sm w-full mx-6">
        {/* Icon */}
        <p className="text-4xl mb-3">{'\u{1F52C}'}</p>

        {/* Title */}
        <h2 className="text-xl font-bold mb-1 discovery-shimmer">
          NEW DISCOVERY!
        </h2>

        {/* WCD-32: Formula via FormulaDisplay for universal <sub> rendering */}
        <p className="text-3xl font-black text-white mb-2">
          <FormulaDisplay formula={pendingDiscovery.displayFormula} />
        </p>
        <p className="text-sm text-white/40 mb-5">
          This molecule has never been catalogued. Name it!
        </p>

        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="Name your discovery..."
          maxLength={30}
          autoFocus
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-lg placeholder:text-white/20 outline-none focus:border-white/40 transition-colors"
          style={{ minHeight: 48 }}
        />

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-4 px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer font-medium text-sm"
          style={{ minHeight: 48 }}
        >
          Name My Discovery
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-3 text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer"
        >
          Skip naming
        </button>
      </div>
    </div>
  );
}
