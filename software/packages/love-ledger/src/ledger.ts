/**
 * @module love-ledger/ledger
 * @description The LedgerEngine listens to Node Zero protocol events and
 * translates them into LOVE transactions.
 *
 * It does not import @p31/node-zero directly. Instead, it accepts events
 * through a simple `ingest(eventType, payload)` method. This keeps the
 * ledger decoupled from the protocol — any event source can drive it.
 *
 * Wiring to a live NodeZero instance is one line:
 *   `node.on("*", (event) => ledger.ingest(event.type, event));`
 *
 * The ledger maintains:
 * - An append-only transaction log
 * - A two-pool wallet (computed from the log)
 * - Vesting status for founding nodes
 * - Event emission for UI updates
 *
 * All state is reconstructible from the transaction log. The wallet is
 * never stored — it's always derived.
 */

import type {
  TransactionType,
  LoveTransaction,
  LoveWallet,
  LedgerConfig,
  LedgerSnapshot,
  LedgerEventMap,
  SpendType,
  LoveSpend,
} from "./types.js";
import { LOVE_AMOUNTS, DEFAULT_LEDGER_CONFIG } from "./types.js";
import { computeWallet, careRatio, bondStrength, lovePerDay } from "./wallet.js";
import { computeAllVesting } from "./vesting.js";
import type { VestingStatus } from "./vesting.js";

// ─── Simple typed event emitter ─────────────────────────────────────

type Listener<T> = (data: T) => void;

class LedgerEmitter {
  private _listeners = new Map<string, Set<Listener<any>>>();

  on<K extends keyof LedgerEventMap>(event: K, fn: Listener<LedgerEventMap[K]>): void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(fn);
  }

  off<K extends keyof LedgerEventMap>(event: K, fn: Listener<LedgerEventMap[K]>): void {
    this._listeners.get(event)?.delete(fn);
  }

  protected emit<K extends keyof LedgerEventMap>(event: K, data: LedgerEventMap[K]): void {
    this._listeners.get(event)?.forEach(fn => fn(data));
  }
}

// ─── Node Zero Event → LOVE Transaction Mapping ────────────────────

function eventToTransaction(eventType: string): TransactionType | null {
  switch (eventType) {
    case "BOND_FORMED":           return "TETRAHEDRON_BOND";
    case "VAULT_LAYER_CREATED":   return "ARTIFACT_CREATED";
    case "REMOTE_STATE_RECEIVED": return "CARE_RECEIVED";
    case "TRANSMIT_COMPLETE":     return "CARE_GIVEN";
    case "PEER_DISCOVERED":       return "PING";
    case "COHERENCE_CHANGED":     return null;
    case "STATE_CHANGED":         return null;
    case "BOND_TRUST_CHANGED":    return null;
    case "CARE_SCORE_UPDATED":    return null;
    default:                      return null;
  }
}

// ─── LedgerEngine ───────────────────────────────────────────────────

export class LedgerEngine extends LedgerEmitter {
  private _transactions: LoveTransaction[] = [];
  private _spends: LoveSpend[] = [];
  private _nextId = 1;
  private _nextSpendId = 1;
  private _owner: string;
  private _careScore = 0.5;
  private _config: LedgerConfig;

  private _lastCoherenceGift = 0;
  private _lastVoltageCalmed = 0;
  private _coherenceAbove = false;
  private _voltageBelow = false;

  constructor(owner: string, config?: Partial<LedgerConfig>) {
    super();
    this._owner = owner;
    this._config = { ...DEFAULT_LEDGER_CONFIG, ...config };
  }

  get owner(): string { return this._owner; }
  get transactions(): readonly LoveTransaction[] { return this._transactions; }
  get wallet(): LoveWallet { return computeWallet(this._transactions, this._careScore, this._config, this.totalSpent); }
  get careRatio(): number { return careRatio(this._transactions); }
  get lovePerDay(): number { return lovePerDay(this._transactions); }

  get vesting(): readonly VestingStatus[] {
    return computeAllVesting(
      this.wallet.sovereigntyPool,
      this._config.vestingSchedule,
      this._config.foundingNodes
    );
  }

  bondStrength(peerId: string): number {
    return bondStrength(this._transactions, peerId);
  }

  // ── Event Ingestion ─────────────────────────────────────────────

  ingest(eventType: string, payload: Record<string, any> = {}): LoveTransaction | null {
    const now = new Date().toISOString();
    const counterparty = payload.peerId || payload.bond?.peerId || undefined;

    const txType = eventToTransaction(eventType);
    if (txType) {
      return this._record(txType, LOVE_AMOUNTS[txType], counterparty, eventType, now, payload);
    }

    if (eventType === "COHERENCE_CHANGED") {
      return this._handleCoherence(payload, now);
    }

    if (eventType === "STATE_CHANGED") {
      return this._handleStateChange(payload, now);
    }

    if (eventType === "BOND_TRUST_CHANGED") {
      return this._handleTrustChange(payload, now, counterparty);
    }

    if (eventType === "CARE_SCORE_UPDATED") {
      this._handleCareScoreUpdate(payload);
      return null;
    }

    return null;
  }

  donate(amount: number, meta?: Record<string, unknown>): LoveTransaction {
    return this._record(
      "DONATION", amount, undefined, "EXTERNAL_DONATION",
      new Date().toISOString(), meta || {}
    );
  }

  blockPlaced(meta?: Record<string, unknown>): LoveTransaction {
    return this._record(
      "BLOCK_PLACED", LOVE_AMOUNTS.BLOCK_PLACED, undefined,
      "GAME_ENGINE", new Date().toISOString(), meta || {}
    );
  }

  // ── Spending ──────────────────────────────────────────────────

  get spends(): readonly LoveSpend[] { return this._spends; }

  get totalSpent(): number {
    return this._spends.reduce((sum, s) => sum + s.amount, 0);
  }

  spend(type: SpendType, amount: number, meta?: Record<string, unknown>): LoveSpend | null {
    const w = this.wallet;
    if (amount <= 0 || amount > w.availableBalance) return null;

    const s: LoveSpend = {
      id: this._nextSpendId++,
      type,
      amount,
      owner: this._owner,
      recipient: meta?.recipient as string | undefined,
      timestamp: new Date().toISOString(),
      meta,
    };
    this._spends.push(s);
    this.emit("LOVE_SPENT", s);

    const updated = this.wallet;
    this.emit("POOL_REBALANCED", {
      careScore: this._careScore,
      availableBalance: updated.availableBalance,
      frozenBalance: updated.frozenBalance,
    });

    return s;
  }

  // ── Snapshot / Restore ──────────────────────────────────────────

  export(): LedgerSnapshot {
    return {
      version: 1,
      owner: this._owner,
      transactions: [...this._transactions],
      spends: [...this._spends],
      wallet: this.wallet,
      snapshotAt: new Date().toISOString(),
    };
  }

  import(snapshot: LedgerSnapshot): void {
    if (snapshot.version !== 1) {
      throw new Error(`Unsupported ledger snapshot version: ${snapshot.version}`);
    }
    if (snapshot.owner !== this._owner) {
      throw new Error(`Snapshot owner ${snapshot.owner} does not match ledger owner ${this._owner}`);
    }
    this._transactions = [...snapshot.transactions];
    this._nextId = this._transactions.length > 0
      ? Math.max(...this._transactions.map(tx => tx.id)) + 1
      : 1;
    this._spends = snapshot.spends ? [...snapshot.spends] : [];
    this._nextSpendId = this._spends.length > 0
      ? Math.max(...this._spends.map(s => s.id)) + 1
      : 1;
    this._careScore = snapshot.wallet.careScore;

    this.emit("LEDGER_RESTORED", {
      transactionCount: this._transactions.length,
      totalEarned: this.wallet.totalEarned,
    });
  }

  // ── Internal ────────────────────────────────────────────────────

  private _record(
    type: TransactionType,
    amount: number,
    counterparty: string | undefined,
    trigger: string,
    timestamp: string,
    payload: Record<string, any>
  ): LoveTransaction {
    const tx: LoveTransaction = {
      id: this._nextId++,
      type,
      amount,
      owner: this._owner,
      counterparty,
      trigger,
      timestamp,
      meta: Object.keys(payload).length > 0 ? { ...payload } : undefined,
    };
    this._transactions.push(tx);
    this.emit("LOVE_EARNED", tx);
    return tx;
  }

  private _handleCoherence(payload: Record<string, any>, now: string): LoveTransaction | null {
    const qValue = payload.qValue ?? payload.coherence ?? 0;
    const wasAbove = this._coherenceAbove;
    this._coherenceAbove = qValue >= this._config.coherenceGiftThreshold;

    if (this._coherenceAbove && !wasAbove) {
      const elapsed = Date.now() - this._lastCoherenceGift;
      if (elapsed > this._config.coherenceGiftCooldownMs) {
        this._lastCoherenceGift = Date.now();
        return this._record(
          "COHERENCE_GIFT", LOVE_AMOUNTS.COHERENCE_GIFT, undefined,
          "COHERENCE_CHANGED", now, payload
        );
      }
    }
    return null;
  }

  private _handleStateChange(payload: Record<string, any>, now: string): LoveTransaction | null {
    const state = payload.state || payload;
    const u = state.urgency ?? 0;
    const v = state.valence ?? 0;
    const c = state.cognitive ?? 0;
    const q = state.coherence ?? 0.5;
    const voltage = Math.max(0, Math.min(1, (u + Math.abs(v) * 0.5 + c + (1 - q) * 0.3) / 2.8));

    const wasBelow = this._voltageBelow;
    this._voltageBelow = voltage < this._config.voltageCalmThreshold;

    if (this._voltageBelow && !wasBelow) {
      const elapsed = Date.now() - this._lastVoltageCalmed;
      if (elapsed > this._config.voltageCalmCooldownMs) {
        this._lastVoltageCalmed = Date.now();
        return this._record(
          "VOLTAGE_CALMED", LOVE_AMOUNTS.VOLTAGE_CALMED, undefined,
          "STATE_CHANGED", now, { voltage }
        );
      }
    }
    return null;
  }

  private _handleTrustChange(
    payload: Record<string, any>,
    now: string,
    counterparty?: string
  ): LoveTransaction | null {
    const prev = payload.previousTier;
    const curr = payload.currentTier;

    const tierOrder = ["GHOST", "STRUT", "COHERENT", "RESONANT"];
    const prevIdx = tierOrder.indexOf(prev);
    const currIdx = tierOrder.indexOf(curr);

    if (currIdx > prevIdx) {
      return this._record(
        "MILESTONE_REACHED", LOVE_AMOUNTS.MILESTONE_REACHED, counterparty,
        "BOND_TRUST_CHANGED", now, { from: prev, to: curr }
      );
    }
    return null;
  }

  private _handleCareScoreUpdate(payload: Record<string, any>): void {
    const score = payload.score ?? payload.careScore ?? this._careScore;
    const prevScore = this._careScore;
    this._careScore = Math.max(0, Math.min(1, score));

    if (Math.abs(this._careScore - prevScore) > 0.001) {
      const w = this.wallet;
      this.emit("POOL_REBALANCED", {
        careScore: this._careScore,
        availableBalance: w.availableBalance,
        frozenBalance: w.frozenBalance,
      });
    }
  }
}
