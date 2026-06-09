/**
 * WCD-12 → WCD-22: RoomModal — Multiplayer room create/join overlay.
 *
 * Glassmorphism modal at z-[100] (fixed, escapes stacking contexts).
 * If not in room: name input + 4-char room code + Amber Join button.
 * If in room: room code display + player count + Leave button.
 * Click outside modal or tap X to close.
 *
 * WCD-22: Amber (#FFD700) Join button, player count status,
 *         4-char monospace room code input.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { createRoom, joinRoom, startPolling } from '../../lib/gameSync';
import type { Room } from '../../lib/gameSync';
import { GlassPanel } from './GlassPanel';

interface RoomModalProps {
  onClose: () => void;
}

export function RoomModal({ onClose }: RoomModalProps) {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const gameMode = useGameStore((s) => s.gameMode);
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const setMultiplayer = useGameStore((s) => s.setMultiplayer);
  const leaveMultiplayer = useGameStore((s) => s.leaveMultiplayer);
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  const [code, setCode] = useState('');
  const [name, setName] = useState(playerName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const ensureName = (): string => {
    const n = name.trim() || 'Player';
    if (!playerName) setPlayerName(n);
    return n;
  };

  const handleCreate = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const n = ensureName();
      const result = await createRoom(n, '#22c55e', gameMode ?? 'seed');
      setMultiplayer(result.code, result.playerId);
      startPolling((room: Room) => {
        useGameStore.getState().updateRemotePlayers(
          room.players.filter((p) => p.id !== result.playerId),
        );
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }, [name, gameMode, setMultiplayer, onClose]);

  const handleJoin = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Room code must be at least 4 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const n = ensureName();
      const result = await joinRoom(trimmed, n, '#06b6d4', gameMode ?? 'seed');
      setMultiplayer(trimmed, result.playerId);
      startPolling((room: Room) => {
        useGameStore.getState().updateRemotePlayers(
          room.players.filter((p) => p.id !== result.playerId),
        );
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }, [code, name, gameMode, setMultiplayer, onClose]);

  const handleLeave = useCallback(() => {
    leaveMultiplayer();
    onClose();
  }, [leaveMultiplayer, onClose]);

  // ── WCD-22: In-room state: code + player count + leave ──
  if (roomCode) {
    const playerCount = 1 + remotePlayers.length; // self + remotes
    const statusText = connectionStatus === 'reconnecting'
      ? 'Reconnecting...'
      : `Online: ${playerCount} Player${playerCount !== 1 ? 's' : ''}`;
    const statusColor = connectionStatus === 'reconnecting'
      ? 'text-[#FFD700]'
      : 'text-[#00FF88]';

    return (
      <div
        ref={backdropRef}
        onClick={handleBackdrop}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto"
      >
        <GlassPanel className="w-[320px] p-6 flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <span className={`font-mono text-xs tracking-wider uppercase ${statusColor}`}>
              {statusText}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="bg-white/[0.06] rounded-xl px-6 py-3 font-mono text-2xl text-[#00FF88] tracking-[0.2em] text-center select-all">
            {roomCode}
          </div>

          <p className="text-xs text-white/30 text-center">Share this code with your partner</p>

          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/15 transition-all text-sm font-medium"
          >
            Leave Room
          </button>
        </GlassPanel>
      </div>
    );
  }

  // ── WCD-22: Not in room: name + create/join with Amber accent ──
  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto"
    >
      <GlassPanel className="w-[320px] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-white/40 tracking-wider uppercase">Multiplayer</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Player name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={16}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder:text-white/20 font-mono text-sm outline-none focus:border-white/20 transition-colors"
        />

        {/* Create new room */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88]/80 hover:bg-[#00FF88]/15 transition-all text-sm font-medium disabled:opacity-30"
        >
          {loading ? 'Creating...' : 'Start Room'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-white/20 uppercase tracking-wider">or join</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* WCD-22: 4-char monospace room code + Amber Join button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="CODE"
            maxLength={4}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder:text-white/20 font-mono text-lg tracking-[0.25em] uppercase text-center outline-none focus:border-[#FFD700]/30 transition-colors"
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
          />
          <button
            onClick={handleJoin}
            disabled={loading || code.trim().length < 4}
            className="px-5 py-2.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] hover:bg-[#FFD700]/20 transition-all text-sm font-bold disabled:opacity-30"
          >
            {loading ? '...' : 'Join'}
          </button>
        </div>

        {/* Status */}
        {loading && (
          <p className="text-xs text-[#FFD700]/60 text-center font-mono">Connecting...</p>
        )}

        {/* Error display */}
        {error && (
          <p className="text-xs text-red-400/80 text-center">{error}</p>
        )}
      </GlassPanel>
    </div>
  );
}
