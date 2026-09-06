// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Genesis: initialization (Rev B — PATCHES 1+3)
//
// Call once at app startup, after player identity is known.
// Returns a cleanup function — call it on component unmount.
//
// PATCH 1: navigator.storage.persist() for IDB eviction guard.
// PATCH 3: Attaches visibilitychange/freeze lifecycle handlers.
//
// Wiring:
//   eventBus → economyStore  (LOVE persistence)
//   eventBus → telemetryStore (cryptographic event log)
// ═══════════════════════════════════════════════════════

import { eventBus, GameEventType } from './eventBus';
import { useEconomyStore, initLoveSync } from './economyStore';
import {
  telemetryInit,
  telemetryAttachLifecycleHandlers,
  telemetryCleanup,
  telemetryAddEvent,
  telemetryRecoverOrphans,
} from './telemetryStore';

export interface GenesisConfig {
  playerId: string;
  playerName: string;
  roomCode?: string | null;
  difficulty?: string | null;
}

// ── Relay URL (set by Vite env) ──
function getRelayUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    return env?.VITE_RELAY_URL ?? '';
  } catch {
    return '';
  }
}

export async function genesisInit(config: GenesisConfig): Promise<() => void> {
  const { playerId, playerName, roomCode = null, difficulty = null } = config;

  // Stable device ID persists across sessions — used as LOVE worker userId
  const stableDeviceId = (() => {
    const key = 'p31-device-id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  })();

  // ── PATCH 1: Request persistent IDB storage ──
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist();
    console.log('[genesis] navigator.storage.persist():', granted);
  }

  // ── Recover orphaned events from previous killed session ──
  await telemetryRecoverOrphans();

  // ── Hydrate economy from IDB ──
  await useEconomyStore.getState()._hydrate();

  // Wire LOVE cloud sync (no-op if VITE_LOVE_LEDGER_URL not set)
  const loveWorkerUrl = (() => {
    try {
      const env = (import.meta as unknown as { env?: Record<string, string> }).env;
      return env?.VITE_LOVE_LEDGER_URL ?? '';
    } catch { return ''; }
  })();
  initLoveSync({ workerUrl: loveWorkerUrl, userId: stableDeviceId });

  // ── Init telemetry session ──
  const sessionId = `${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const relayUrl = getRelayUrl();

  telemetryInit({
    sessionId,
    playerId,
    playerName,
    roomCode: roomCode ?? null,
    relayUrl,
  });

  // ── PATCH 3: Attach lifecycle handlers ──
  const detachLifecycle = telemetryAttachLifecycleHandlers();

  // ── Wire eventBus → economyStore ──
  const economy = useEconomyStore.getState();

  const unsubAtomPlaced = eventBus.on(GameEventType.ATOM_PLACED, () => {
    useEconomyStore.getState()._onAtomPlaced();
    void telemetryAddEvent('atom_placed', {});
  });

  const unsubAtomRejected = eventBus.on(GameEventType.ATOM_REJECTED, (p) => {
    void telemetryAddEvent('atom_rejected', { element: p.element, reason: p.reason });
  });

  const unsubMoleculeCompleted = eventBus.on(GameEventType.MOLECULE_COMPLETED, (p) => {
    useEconomyStore.getState()._onMoleculeCompleted();
    void telemetryAddEvent('molecule_completed', {
      formula: p.formula,
      displayName: p.displayName,
      atomCount: p.atomCount,
      difficulty: p.difficulty,
      buildTimeMs: p.buildTimeMs,
      stability: p.stability,
    });
  });

  const unsubAchievementUnlocked = eventBus.on(GameEventType.ACHIEVEMENT_UNLOCKED, (p) => {
    useEconomyStore.getState()._onAchievementUnlocked(p.loveReward);
    void telemetryAddEvent('achievement_unlocked', {
      achievementId: p.achievementId,
      achievementName: p.achievementName,
      loveReward: p.loveReward,
    });
  });

  const unsubPingSent = eventBus.on(GameEventType.PING_SENT, (p) => {
    useEconomyStore.getState().earnLove('ping_sent');
    void telemetryAddEvent('ping_sent', {
      reaction: p.reaction,
      targetPlayerId: p.targetPlayerId,
      moleculeId: p.moleculeId,
    });
  });

  const unsubPingReceived = eventBus.on(GameEventType.PING_RECEIVED, (p) => {
    useEconomyStore.getState().earnLove('ping_received');
    void telemetryAddEvent('ping_received', {
      reaction: p.reaction,
      fromPlayerId: p.fromPlayerId,
      moleculeId: p.moleculeId,
    });
  });

  const unsubDifficultyChanged = eventBus.on(GameEventType.DIFFICULTY_CHANGED, (p) => {
    void telemetryAddEvent('difficulty_changed', { from: p.from, to: p.to });
  });

  // WCD-11: Bug report filed — record in telemetry for engagement ledger
  const unsubBugReport = eventBus.on(GameEventType.BUG_REPORT, (p) => {
    void telemetryAddEvent('bug_report', {
      reportId: p.reportId,
      testerName: p.testerName,
      descriptionLength: p.descriptionLength,
    });
  });

  // M12: Broadcast economy state to parent frame (Spaceship Earth)
  const unsubLove = useEconomyStore.subscribe((state, prev) => {
    if (state.totalLove === prev.totalLove) return;
    if (window.parent === window) return; // standalone — no-op
    try {
      window.parent.postMessage({
        type: 'P31_BONDING_STATE',
        payload: { sessionId, totalLove: state.totalLove, ts: Date.now() },
      }, '*');
    } catch { /* swallow */ }
  });

  // Log genesis block opening event
  void telemetryAddEvent('session_started', {
    playerId,
    playerName,
    roomCode,
    difficulty,
    sessionId,
  });

  // Keep a ref to economy so it's not garbage-collected (satisfies TS noUnused)
  void economy;

  // ── Return cleanup ──
  return () => {
    unsubAtomPlaced();
    unsubAtomRejected();
    unsubMoleculeCompleted();
    unsubAchievementUnlocked();
    unsubPingSent();
    unsubPingReceived();
    unsubDifficultyChanged();
    unsubBugReport();
    unsubLove();
    detachLifecycle();
    telemetryCleanup();
  };
}
