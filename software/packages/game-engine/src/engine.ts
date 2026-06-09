/**
 * @module game-engine/engine
 * @description The GameEngine orchestrates all game subsystems.
 */

import type {
  PlayerProgress,
  Structure,
  PlacedPiece,
  PrimitiveType,
  Vec3,
  Challenge,
  GameEventMap,
  GameSnapshot,
  Badge,
} from "./types.js";
import {
  createPlayer,
  addXp,
  updateStreak,
  isQuestComplete,
  xpToTier,
} from "./player.js";
import {
  createGenesisDome,
  createStructure,
  placePiece,
  undoLastPiece,
} from "./structures.js";
import {
  canAttempt,
  isChallengeComplete,
  freshChallenge,
  availableChallenges,
} from "./challenges.js";

type Listener<T> = (data: T) => void;

class GameEmitter {
  private _listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(fn as Listener<unknown>);
  }

  off<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): void {
    this._listeners.get(event)?.delete(fn as Listener<unknown>);
  }

  protected emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    this._listeners.get(event)?.forEach(fn => (fn as Listener<GameEventMap[K]>)(data));
  }
}

export interface LedgerAdapter {
  blockPlaced(meta?: Record<string, unknown>): void;
  challengeComplete(challengeId: string, love: number): void;
}

export interface GameEngineConfig {
  readonly domeName: string;
  readonly domeColor: string;
  readonly ledger?: LedgerAdapter;
  readonly today?: string;
}

const DEFAULT_CONFIG: GameEngineConfig = {
  domeName: "My Dome",
  domeColor: "#4ade80",
};

export class GameEngine extends GameEmitter {
  private _player: PlayerProgress;
  private _structures: Structure[] = [];
  private _activeChallenge: Challenge | null = null;
  private _config: GameEngineConfig;

  constructor(
    nodeId: string,
    config?: Partial<GameEngineConfig>
  ) {
    super();
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._player = createPlayer(nodeId, this._config.domeName);

    const dome = createGenesisDome(nodeId, this._config.domeName, this._config.domeColor);
    this._structures.push(dome);
    this._player = {
      ...this._player,
      structureIds: [dome.id],
      totalPiecesPlaced: 1,
    };
  }

  get player(): PlayerProgress { return this._player; }
  get structures(): readonly Structure[] { return this._structures; }
  get activeChallenge(): Challenge | null { return this._activeChallenge; }

  get dome(): Structure {
    return this._structures[0];
  }

  get availableChallenges(): readonly Challenge[] {
    return availableChallenges(this._player);
  }

  place(
    structureId: string,
    type: PrimitiveType,
    position: Vec3,
    rotation?: Vec3,
    scale?: number,
    color?: string
  ): PlacedPiece | null {
    const idx = this._structures.findIndex(s => s.id === structureId);
    if (idx === -1) return null;

    const result = placePiece(this._structures[idx], type, position, rotation, scale, color);
    this._structures[idx] = result.structure;

    this._player = {
      ...this._player,
      totalPiecesPlaced: this._player.totalPiecesPlaced + 1,
    };

    const today = this._today();
    const streakResult = updateStreak(
      this._player.lastBuildDate,
      this._player.buildStreak,
      this._player.longestStreak,
      today
    );
    const oldStreak = this._player.buildStreak;
    this._player = {
      ...this._player,
      buildStreak: streakResult.streak,
      longestStreak: streakResult.longest,
      lastBuildDate: today,
    };

    this.emit("PIECE_PLACED", {
      structureId,
      piece: result.piece,
      rigidity: result.structure.rigidity,
    });

    if (streakResult.streak !== oldStreak || streakResult.isNew) {
      this.emit("STREAK_UPDATED", {
        streak: streakResult.streak,
        isNew: streakResult.isNew,
      });
    }

    if (result.structure.rigidity.isRigid && result.structure.pieces.length > 1) {
      this.emit("STRUCTURE_RIGID", {
        structureId,
        coherence: result.structure.rigidity.coherence,
      });
    }

    this._config.ledger?.blockPlaced({
      structureId,
      pieceId: result.piece.id,
      pieceType: type,
      coherence: result.structure.rigidity.coherence,
    });

    this._awardXp(5, "piece_placed");

    this._updateObjectives("place_pieces", 1, type);
    this._updateObjectives("achieve_coherence", result.structure.rigidity.coherence);
    this._updateObjectives("build_structure", result.structure.rigidity.vertices);

    this._updateQuests("place_pieces", 1);
    if (result.structure.rigidity.isRigid) {
      this._updateQuests("achieve_coherence", result.structure.rigidity.coherence);
    }
    this._updateQuests("custom", 1);

    return result.piece;
  }

  undo(structureId: string): PlacedPiece | null {
    const idx = this._structures.findIndex(s => s.id === structureId);
    if (idx === -1) return null;

    const result = undoLastPiece(this._structures[idx]);
    if (!result) return null;

    this._structures[idx] = result.structure;
    this._player = {
      ...this._player,
      totalPiecesPlaced: Math.max(0, this._player.totalPiecesPlaced - 1),
    };

    return result.removed;
  }

  newStructure(name: string, color?: string): Structure {
    const structure = createStructure(name, this._player.nodeId, color);
    this._structures.push(structure);
    this._player = {
      ...this._player,
      structureIds: [...this._player.structureIds, structure.id],
    };
    return structure;
  }

  startChallenge(challengeId: string): boolean {
    const challenge = freshChallenge(challengeId);
    if (!challenge) return false;
    if (!canAttempt(challenge, this._player)) return false;

    this._activeChallenge = challenge;
    return true;
  }

  completeActiveChallenge(): boolean {
    if (!this._activeChallenge) return false;

    for (const obj of this._activeChallenge.objectives) {
      obj.current = obj.target;
    }

    return this._checkChallengeCompletion();
  }

  bondFormed(_peerId: string): void {
    this._updateObjectives("form_bond", 1);
    this._updateQuests("form_bond", 1);
  }

  loveEarned(amount: number): void {
    this._updateQuests("earn_love", amount);
  }

  export(): GameSnapshot {
    return {
      version: 1,
      player: this._player,
      structures: [...this._structures],
      activeChallenge: this._activeChallenge?.id ?? null,
      snapshotAt: new Date().toISOString(),
    };
  }

  import(snapshot: GameSnapshot): void {
    if (snapshot.version !== 1) {
      throw new Error(`Unsupported game snapshot version: ${snapshot.version}`);
    }
    this._player = snapshot.player;
    this._structures = [...snapshot.structures];
    if (snapshot.activeChallenge) {
      this._activeChallenge = freshChallenge(snapshot.activeChallenge) ?? null;
    }
  }

  private _today(): string {
    return this._config.today ?? new Date().toISOString().split("T")[0];
  }

  private _awardXp(amount: number, source: string): void {
    const result = addXp(this._player, amount);
    this._player = result.player;

    this.emit("XP_EARNED", {
      amount,
      source,
      totalXp: result.player.xp,
    });

    if (result.leveledUp) {
      this.emit("LEVEL_UP", {
        level: result.player.level,
        xp: result.player.xp,
      });
    }

    if (result.tierPromoted) {
      this.emit("TIER_PROMOTED", {
        previousTier: xpToTier(this._player.xp - amount),
        newTier: result.newTier,
        xp: result.player.xp,
      });
      this._updateObjectives("reach_tier", 1);
    }
  }

  private _updateObjectives(type: string, value: number, _subtype?: string): void {
    if (!this._activeChallenge) return;

    for (const obj of this._activeChallenge.objectives) {
      if (obj.type === type) {
        if (type === "achieve_coherence") {
          obj.current = Math.max(obj.current, value);
        } else if (type === "build_structure") {
          obj.current = Math.max(obj.current, value);
        } else if (type === "place_pieces") {
          obj.current += value;
        } else {
          obj.current += value;
        }
      }
    }

    this._checkChallengeCompletion();
  }

  private _checkChallengeCompletion(): boolean {
    if (!this._activeChallenge) return false;
    if (!isChallengeComplete(this._activeChallenge)) return false;

    const challenge = this._activeChallenge;

    this._awardXp(challenge.rewardXp, `challenge:${challenge.id}`);

    this._player = {
      ...this._player,
      completedChallenges: [...this._player.completedChallenges, challenge.id],
    };

    if (challenge.rewardBadge) {
      const badge: Badge = {
        id: challenge.rewardBadge,
        name: challenge.title,
        description: challenge.fullerPrinciple,
        earnedAt: new Date().toISOString(),
      };
      this._player = {
        ...this._player,
        badges: [...this._player.badges, badge],
      };
    }

    this._config.ledger?.challengeComplete(challenge.id, challenge.rewardLove);

    this.emit("CHALLENGE_COMPLETE", {
      challenge,
      rewardLove: challenge.rewardLove,
      rewardXp: challenge.rewardXp,
    });

    this._activeChallenge = null;
    return true;
  }

  private _updateQuests(type: string, value: number): void {
    const updatedQuests = this._player.dailyQuests.map(q => {
      if (q.completed) return q;
      if (q.objective.type !== type) return q;

      const updated = {
        ...q,
        objective: {
          ...q.objective,
          current: type === "achieve_coherence"
            ? Math.max(q.objective.current, value)
            : q.objective.current + value,
        },
      };

      if (!q.completed && isQuestComplete(updated)) {
        updated.completed = true;
        this._awardXp(q.rewardXp, `quest:${q.id}`);
        this.emit("QUEST_COMPLETE", { quest: updated });
      }

      return updated;
    });

    this._player = { ...this._player, dailyQuests: updatedQuests };
  }
}
