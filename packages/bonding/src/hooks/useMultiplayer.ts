// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// useMultiplayer: polling + auto-push + event wiring
//
// WCD-08: Base polling + auto-push
// WCD-15: Connection events, room expired, breathing push
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  startPolling,
  stopPolling,
  pushState,
  onSyncEvent,
} from '../lib/gameSync';
import type { PlayerState } from '../lib/gameSync';
import {
  generateFormula,
  displayFormula,
  calculateStability,
} from '../engine/chemistry';

export function useMultiplayer(): void {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerId = useGameStore((s) => s.playerId);
  const seenPingIds = useRef(new Set<string>());

  // ── Polling: update remote players + detect new pings ──

  useEffect(() => {
    if (!roomCode || !playerId) return;

    startPolling((room) => {
      // Update remote players (exclude self)
      const others = room.players.filter((p) => p.id !== playerId);
      useGameStore.getState().updateRemotePlayers(others);

      // Detect new pings addressed to me
      for (const ping of room.pings) {
        if (ping.to === playerId && !seenPingIds.current.has(ping.id)) {
          seenPingIds.current.add(ping.id);
          useGameStore.getState().addIncomingPing(ping);
        }
      }
    });

    return () => stopPolling();
  }, [roomCode, playerId]);

  // ── Sync events: connection status + room expired ──

  useEffect(() => {
    if (!roomCode) return;

    const unsub = onSyncEvent((event) => {
      const store = useGameStore.getState();

      if (event.type === 'disconnected') {
        store.setConnectionStatus('disconnected');
        // Toast: connection lost
        const toast = {
          id: Math.random().toString(36).slice(2, 10),
          icon: '\u{1F534}',
          text: 'Connection lost. Playing offline.',
          duration: 4000,
          createdAt: Date.now(),
        };
        useGameStore.setState({
          toasts: [...useGameStore.getState().toasts, toast],
        });
        setTimeout(() => {
          useGameStore.setState({
            toasts: useGameStore.getState().toasts.filter(t => t.id !== toast.id),
          });
        }, toast.duration);
      } else if (event.type === 'reconnecting') {
        store.setConnectionStatus('reconnecting');
      } else if (event.type === 'reconnected') {
        store.setConnectionStatus('connected');
        // Toast: reconnected
        const toast = {
          id: Math.random().toString(36).slice(2, 10),
          icon: '\u{1F7E2}',
          text: 'Reconnected!',
          duration: 2000,
          createdAt: Date.now(),
        };
        useGameStore.setState({
          toasts: [...useGameStore.getState().toasts, toast],
        });
        setTimeout(() => {
          useGameStore.setState({
            toasts: useGameStore.getState().toasts.filter(t => t.id !== toast.id),
          });
        }, toast.duration);
      } else if (event.type === 'roomExpired') {
        store.setConnectionStatus('disconnected');
        const toast = {
          id: Math.random().toString(36).slice(2, 10),
          icon: '\u{23F3}',
          text: 'Room expired. Your molecule is saved locally.',
          duration: 5000,
          createdAt: Date.now(),
        };
        useGameStore.setState({
          toasts: [...useGameStore.getState().toasts, toast],
        });
        setTimeout(() => {
          useGameStore.setState({
            toasts: useGameStore.getState().toasts.filter(t => t.id !== toast.id),
          });
        }, toast.duration);
      }
    });

    return unsub;
  }, [roomCode]);

  // ── Auto-push: subscribe to state changes, push to relay ──

  useEffect(() => {
    if (!roomCode) return;

    // Track previous snapshot for diffing
    let prev = snapshotState();

    const unsub = useGameStore.subscribe(() => {
      const curr = snapshotState();
      if (
        curr.atoms !== prev.atoms ||
        curr.love !== prev.love ||
        curr.phase !== prev.phase ||
        curr.achievementCount !== prev.achievementCount ||
        curr.breathing !== prev.breathing
      ) {
        prev = curr;
        const state = useGameStore.getState();
        const formula = generateFormula(state.atoms);
        const ps: PlayerState = {
          formula,
          displayFormula: displayFormula(formula),
          atoms: state.atoms.length,
          love: state.loveTotal,
          stability: calculateStability(state.atoms),
          completed: state.gamePhase === 'complete',
          achievements: state.unlockedAchievements.map((a) => a.id),
          breathing: state.breathing,
          updatedAt: new Date().toISOString(),
        };
        void pushState(ps);
      }
    });

    return unsub;
  }, [roomCode]);
}

function snapshotState() {
  const s = useGameStore.getState();
  return {
    atoms: s.atoms.length,
    love: s.loveTotal,
    phase: s.gamePhase,
    achievementCount: s.unlockedAchievements.length,
    breathing: s.breathing,
  };
}
