// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// WCD-11: In-game bug report — zero-friction tester feedback.
//
// Tap bug icon → overlay → describe bug → submit → done.
// Auto-captures device + game context. Emits BUG_REPORT
// event to Genesis Block for engagement ledger.
// ═══════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEconomyStore } from '../genesis/economyStore';
import { eventBus, GameEventType } from '../genesis/eventBus';

// ── Relay URL (mirrors genesis.ts pattern) ──

function getRelayUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    return env?.VITE_RELAY_URL ?? '';
  } catch {
    return '';
  }
}

// ── Types ──

interface BugReportPayload {
  description: string;
  testerName: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  touchSupport: boolean;
  platform: string;
  currentMode: string;
  moleculesBuilt: string[];
  atomsOnCanvas: number;
  loveBalance: number;
  achievementsUnlocked: string[];
  sessionDuration: number;
  isMultiplayer: boolean;
  roomCode: string | null;
  timestamp: string;
  url: string;
}

// ── Component ──

interface BugReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReport({ isOpen, onClose }: BugReportProps) {
  const [description, setDescription] = useState('');
  const [testerName, setTesterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionStart = useRef(Date.now());

  // Pre-fill name from lobby
  const playerName = useGameStore((s) => s.playerName);
  useEffect(() => {
    if (playerName) setTesterName(playerName);
  }, [playerName]);

  // Auto-focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when opened fresh
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Please describe what went wrong.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Gather game context from stores
    const atoms = useGameStore.getState().atoms;
    const gameMode = useGameStore.getState().gameMode;
    const completedMolecules = useGameStore.getState().completedMolecules;
    const unlockedAchievements = useGameStore.getState().unlockedAchievements;
    const roomCode = useGameStore.getState().roomCode;
    const totalLove = useEconomyStore.getState().totalLove;

    const payload: BugReportPayload = {
      description: trimmed,
      testerName: testerName.trim() || 'Anonymous',
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      platform: navigator.platform,
      currentMode: gameMode ?? 'none',
      moleculesBuilt: completedMolecules.map((m) => m.formula),
      atomsOnCanvas: atoms.length,
      loveBalance: totalLove,
      achievementsUnlocked: unlockedAchievements.map((a) => a.id),
      sessionDuration: Math.round((Date.now() - sessionStart.current) / 1000),
      isMultiplayer: roomCode !== null,
      roomCode,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      const relayUrl = getRelayUrl();
      if (!relayUrl) throw new Error('No relay URL configured');

      const res = await fetch(`${relayUrl}/bug-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { id?: string };

      // Emit to Genesis Block
      if (data.id) {
        eventBus.emit(GameEventType.BUG_REPORT, {
          reportId: data.id,
          testerName: payload.testerName,
          descriptionLength: trimmed.length,
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setDescription('');
        setSubmitted(false);
      }, 1500);
    } catch {
      setError("Couldn't send. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 60, background: 'rgba(0, 0, 0, 0.2)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative rounded-2xl p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          width: 'min(90vw, 400px)',
          color: '#e0e0e0',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold font-mono">
            Report a Bug
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            style={{ minHeight: 32 }}
          >
            {'\u2715'}
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">{'\u{1F9EA}'}</p>
            <p className="text-sm text-white/60 font-mono">Thanks!</p>
          </div>
        ) : (
          <>
            {/* Description */}
            <label className="block text-xs text-white/40 mb-1.5 font-mono">
              What went wrong?
            </label>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The atoms wouldn't drag..."
              rows={3}
              className="w-full rounded-lg px-3 py-3 mb-3 text-sm font-mono"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e0e0e0',
                fontSize: '16px',
                resize: 'vertical',
                minHeight: 80,
                outline: 'none',
              }}
            />

            {/* Name */}
            <label className="block text-xs text-white/40 mb-1.5 font-mono">
              Your name (optional)
            </label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              placeholder="Anonymous"
              className="w-full rounded-lg px-3 py-2 mb-4 text-sm font-mono"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e0e0e0',
                fontSize: '16px',
                outline: 'none',
                minHeight: 44,
              }}
            />

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 mb-3 font-mono">{error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl font-semibold transition-all active:scale-[0.98]"
              style={{
                padding: '14px',
                background: submitting ? '#3a8a50' : '#4ade80',
                color: '#0a0a0a',
                border: 'none',
                fontSize: '16px',
                fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                minHeight: 48,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>

            {/* Privacy note */}
            <p className="text-[10px] text-white/20 text-center mt-3 font-mono">
              Device info will be included automatically
            </p>
          </>
        )}
      </div>
    </div>
  );
}
