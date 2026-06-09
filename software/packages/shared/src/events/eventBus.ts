// ═══════════════════════════════════════════════════════
// @p31/shared — Genesis: event bus
//
// Typed pub/sub. Zero dependencies. Zero React coupling.
// Fired by game actions; consumed by economyStore and
// telemetryStore via subscriptions wired in genesis.ts.
//
// Errors in handlers are swallowed — listeners must never
// break game flow.
//
// Promoted from bonding/src/genesis/eventBus.ts (WCD-M02).
// Changed: const enum → enum (required for isolatedModules
// + esbuild cross-package compatibility).
// ═══════════════════════════════════════════════════════

export enum GameEventType {
  ATOM_PLACED         = 'ATOM_PLACED',
  ATOM_REJECTED       = 'ATOM_REJECTED',
  MOLECULE_COMPLETED  = 'MOLECULE_COMPLETED',
  PING_SENT           = 'PING_SENT',
  PING_RECEIVED       = 'PING_RECEIVED',
  DIFFICULTY_CHANGED  = 'DIFFICULTY_CHANGED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  QUEST_STEP_COMPLETED = 'QUEST_STEP_COMPLETED',
  QUEST_CHAIN_COMPLETED = 'QUEST_CHAIN_COMPLETED',
  NAV_SELECT          = 'NAV_SELECT',
  BUG_REPORT          = 'BUG_REPORT',
  K4_DETECTED         = 'K4_DETECTED',
}

export interface GameEventMap {
  [GameEventType.ATOM_PLACED]: {
    element: string;
    moleculeId: string;
    position: { x: number; y: number; z: number };
    bondSiteIndex: number;
  };
  [GameEventType.ATOM_REJECTED]: {
    element: string;
    reason: string;
  };
  [GameEventType.MOLECULE_COMPLETED]: {
    moleculeId: string;
    formula: string;
    displayName: string;
    atomCount: number;
    difficulty: string;
    buildTimeMs: number;
    stability: number;
  };
  [GameEventType.PING_SENT]: {
    reaction: string;
    targetPlayerId: string;
    moleculeId: string;
  };
  [GameEventType.PING_RECEIVED]: {
    reaction: string;
    fromPlayerId: string;
    moleculeId: string;
  };
  [GameEventType.DIFFICULTY_CHANGED]: {
    from: string | null;
    to: string | null;
  };
  [GameEventType.ACHIEVEMENT_UNLOCKED]: {
    achievementId: string;
    achievementName: string;
    loveReward: number;
  };
  [GameEventType.QUEST_STEP_COMPLETED]: {
    questId: string;
    formula: string;
    stepIndex: number;
  };
  [GameEventType.QUEST_CHAIN_COMPLETED]: {
    questId: string;
    totalSteps: number;
    bonusLove: number;
  };
  [GameEventType.NAV_SELECT]: {
    pod: string;
    label: string;
    href: string;
    vertexId: string;
  };
  [GameEventType.BUG_REPORT]: {
    reportId: string;
    testerName: string;
    descriptionLength: number;
  };
  [GameEventType.K4_DETECTED]: {
    atomCount: number;
    bondCount: number;
    formula: string;
  };
}

type EventHandler<T extends GameEventType> = (payload: GameEventMap[T]) => void;

class EventBus {
  private listeners = new Map<GameEventType, Set<EventHandler<GameEventType>>>();

  on<T extends GameEventType>(type: T, handler: EventHandler<T>): () => void {
    let bucket = this.listeners.get(type);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(type, bucket);
    }
    bucket.add(handler as EventHandler<GameEventType>);
    return () => {
      this.listeners.get(type)?.delete(handler as EventHandler<GameEventType>);
    };
  }

  emit<T extends GameEventType>(type: T, payload: GameEventMap[T]): void {
    this.listeners.get(type)?.forEach((handler) => {
      try {
        (handler as EventHandler<T>)(payload);
      } catch (err) {
        console.warn('[EventBus] Listener error swallowed:', err);
      }
    });
  }
}

export const eventBus = new EventBus();
