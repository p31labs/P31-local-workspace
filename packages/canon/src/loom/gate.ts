/**
 * @p31/canon — loom/gate.ts
 *
 * The Loom's integrity gate. Sits between the append API and the log:
 *
 *   - assigns `seq` and `ts` (the caller never does)
 *   - enforces writer-per-kind (focus/revise/approve/reject = human;
 *     traverse/propose/review/presence = agent)
 *   - rejects duplicate proposal ids and orphan approvals/revises/rejects/reviews
 *   - rejects a review on a stale revision — the gate's job, not the reducer's,
 *     because a review pinning a version the proposal no longer has is a
 *     structural error, not a fold concern
 *   - proves the reducer is deterministic (double replay + canonical compare)
 *   - reconstructs state at any seq for the canvas scrubber
 *
 * It is the contract both parallel paths build against: if an event is in the
 * log, it is guaranteed to replay. The agent appends through this; it never
 * writes registry.json, contracts, or CSS.
 */
import type { LoomEvent, LoomState } from './events.ts';
import { initialState, reduce as defaultReduce } from './events.ts';

export type Reducer = (state: LoomState, event: LoomEvent) => LoomState;

/**
 * Normalize a legacy event for replay through the (now scope-strict) gate.
 * Old rows predate the scope field: they are `shared` by default but may carry
 * a humanId. The gate rejects shared-with-humanId (a family record carries the
 * family, not an individual) — so on replay we strip the humanId from events
 * that have no explicit scope. Events that explicitly declare `personal` keep
 * their humanId. The stored `data` (part of the hash chain) is never mutated;
 * only the in-memory replay is normalized.
 */
export function normalizeLegacyScope(input: LoomEventInput | LoomEvent): LoomEventInput {
  const e = input as Record<string, unknown>;
  if (e.scope === 'personal') return input as LoomEventInput;
  // No scope (or an explicit non-personal scope): drop the humanId.
  const { humanId: _humanId, ...rest } = input as LoomEventInput & { humanId?: string };
  return rest as LoomEventInput;
}

/** An event before the gate stamps it with seq + ts. `statedBy` is the
 *  writer's code name (a handle, never a raw id) — how a shared family event
 *  names its author without exposing a humanId. */
export type LoomEventInput =
  | { writer: 'human'; kind: 'focus'; node: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'agent'; kind: 'traverse'; from: string; to: string; reason: string }
  | { writer: 'agent'; kind: 'propose'; id: string; node: string; body: unknown; author?: string; parentAgent?: string }
  | { writer: 'human'; kind: 'revise'; proposal: string; body: unknown; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'human'; kind: 'approve'; proposal: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'human'; kind: 'reject'; proposal: string; reason: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'agent'; kind: 'review'; agent: string; proposalId: string; decision: 'approve' | 'amend' | 'reject'; reason?: string; revision: number; parentAgent?: string }
  | { writer: 'agent'; kind: 'presence'; node: string; attention: number }
  | { writer: 'human'; kind: 'view.save'; label: string; from: number; to: number; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'human'; kind: 'instrument.zone.place'; node: string; position: [number, number, number]; timbre: string; name?: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'human'; kind: 'instrument.zone.clear'; node: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string }
  | { writer: 'human'; kind: 'instrument.zone.name'; node: string; name: string; scope?: 'personal' | 'shared' | 'session'; statedBy?: string; humanId?: string };

const HUMAN_KINDS = new Set(['focus', 'revise', 'approve', 'reject', 'view.save', 'instrument.zone.place', 'instrument.zone.clear', 'instrument.zone.name']);
const AGENT_KINDS = new Set(['traverse', 'propose', 'review', 'presence']);

export interface GateResult {
  valid: boolean;
  error?: string;
}

/** Deterministic serialization of LoomState — the hashing surface for parity. */
export function canonicalize(state: LoomState): string {
  const proposals = [...state.proposals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, { ...v }]);
  return JSON.stringify({
    focused: state.focused,
    agentCursor: state.agentCursor,
    agentAttention: state.agentAttention,
    agentPath: state.agentPath,
    proposals,
    saves: state.saves,
  });
}

export class ReplayGate {
  private log: LoomEvent[] = [];
  private proposalIds = new Set<string>();
  /** id -> current revision (0 after propose, +1 per revise). Rebuilt on
   *  rehydrate so a post-reload review is checked against the right revision. */
  private proposalRevisions = new Map<string, number>();
  private seq = 0;

  /** Validate, stamp with seq + ts, append. seq is assigned by the gate. */
  append(input: LoomEventInput): GateResult {
    const expected = HUMAN_KINDS.has(input.kind) ? 'human' : 'agent';
    if (!HUMAN_KINDS.has(input.kind) && !AGENT_KINDS.has(input.kind)) {
      return { valid: false, error: `unknown kind: ${(input as { kind: string }).kind}` };
    }
    if (input.writer !== expected) {
      return { valid: false, error: `kind '${input.kind}' requires writer='${expected}', got '${input.writer}'` };
    }
    // Scope shape check — structural, never authorization. A `personal` event
    // must name its owner (a scope nobody can enforce is a leak); a `shared`
    // event must NOT carry a humanId (a family record carries the family, not
    // an individual — identity is surfaced via code names, never raw ids).
    // Agent events are always `shared`: the agent is co-present by definition,
    // and the writer-per-kind rule already isolates it from human personal
    // state. `session` is reserved — allowed by the type, no writers yet.
    // The scope DEFAULTS to 'shared' when absent — so a new event that carries
    // a humanId without declaring 'personal' is rejected (the App must opt
    // into personal explicitly). Legacy rows are tolerated by the adapters
    // (they strip humanId from shared events on replay / at the read path).
    const scope = 'scope' in input && input.scope ? input.scope : 'shared';
    if (scope === 'personal') {
      const maybe = input as LoomEventInput & { humanId?: string };
      if (!maybe.humanId || maybe.humanId.trim().length === 0) {
        return { valid: false, error: `kind '${input.kind}' is 'personal' but carries no humanId` };
      }
    } else if (scope === 'shared' && (input as LoomEventInput & { humanId?: string }).humanId) {
      return { valid: false, error: `kind '${input.kind}' is 'shared' but carries a humanId` };
    }
    if (input.kind === 'propose' && this.proposalIds.has(input.id)) {
      return { valid: false, error: `duplicate proposal id: ${input.id}` };
    }
    if (
      (input.kind === 'revise' || input.kind === 'approve' || input.kind === 'reject') &&
      !this.proposalIds.has(input.proposal)
    ) {
      return { valid: false, error: `unknown proposal: ${input.proposal}` };
    }

    // Review validation. Reviews are advisory records: they do not change
    // proposal status. The human's approve/reject events are the sole
    // authoritative status transition. Higher-level semantics (self-review
    // policy, quorum) are deliberately out of scope for the gate — the schema
    // enforces structure, not policy. Self-review currently records; a future
    // policy may forbid it at a higher layer.
    if (input.kind === 'review') {
      if (typeof input.agent !== 'string' || input.agent.trim().length === 0) {
        return { valid: false, error: 'review.agent must be a non-empty string' };
      }
      if (!this.proposalIds.has(input.proposalId)) {
        return { valid: false, error: `review references unknown proposal: ${input.proposalId}` };
      }
      const currentRev = this.proposalRevisions.get(input.proposalId) ?? 0;
      if (input.revision !== currentRev) {
        return {
          valid: false,
          error: `review revision ${input.revision} does not match current revision ${currentRev} for proposal ${input.proposalId}`,
        };
      }
      if (input.decision !== 'approve' && (!input.reason || input.reason.trim().length === 0)) {
        return { valid: false, error: `review with decision '${input.decision}' requires a non-empty reason` };
      }
    }

    // view.save validation. A saved read is a canonical event: it names a
    // window of the log. The label is the human's name for the read; the
    // window must be non-empty, ordered, and within the log the gate has seen
    // so far. `to` is inclusive and must reference an event that exists.
    if (input.kind === 'view.save') {
      if (typeof input.label !== 'string' || input.label.trim().length === 0) {
        return { valid: false, error: 'view.save requires a non-empty label' };
      }
      if (!Number.isInteger(input.from) || !Number.isInteger(input.to)) {
        return { valid: false, error: 'view.save from/to must be integers' };
      }
      if (input.from < 0 || input.to < input.from) {
        return { valid: false, error: `view.save requires 0 <= from <= to (got ${input.from}..${input.to})` };
      }
      if (input.to >= this.seq) {
        return { valid: false, error: `view.save.to ${input.to} is beyond the log head (${this.seq - 1})` };
      }
    }

    const seq = this.seq;
    const event = { ...input, seq, ts: new Date().toISOString() } as LoomEvent;
    if (input.kind === 'propose') {
      this.proposalIds.add(input.id);
      this.proposalRevisions.set(input.id, 0);
    } else if (input.kind === 'revise') {
      this.proposalRevisions.set(input.proposal, (this.proposalRevisions.get(input.proposal) ?? 0) + 1);
    }
    this.log.push(event);
    this.seq = seq + 1;
    return { valid: true };
  }

  /** Replay the whole log twice and compare canonical state. Determinism proof. */
  verify(reducer: Reducer = defaultReduce, seed: LoomState = initialState()): GateResult {
    const a = this.fold(reducer, seed);
    const b = this.fold(reducer, seed);
    if (canonicalize(a) !== canonicalize(b)) {
      return { valid: false, error: 'reducer is nondeterministic (two folds diverged)' };
    }
    return { valid: true };
  }

  private fold(reducer: Reducer, seed: LoomState): LoomState {
    let s = seed;
    for (const e of this.log) s = reducer(s, e);
    return s;
  }

  /** State after folding events with seq <= until. For the canvas scrubber. */
  stateAt(seq: number, reducer: Reducer = defaultReduce, seed: LoomState = initialState()): LoomState {
    let s = seed;
    for (const e of this.log) {
      if (e.seq > seq) break;
      s = reducer(s, e);
    }
    return s;
  }

  toJSONL(): string {
    return this.log.map((e) => JSON.stringify(e)).join('\n');
  }

  fromJSONL(text: string): GateResult {
    this.log = [];
    this.proposalIds = new Set();
    this.proposalRevisions = new Map();
    this.seq = 0;
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let parsed: LoomEvent;
      try {
        parsed = JSON.parse(line) as LoomEvent;
      } catch {
        return { valid: false, error: `corrupt line: ${line.slice(0, 48)}` };
      }
      const { seq, ts, ...rest } = parsed as LoomEvent & { seq: number; ts: string };
      const r = this.append(normalizeLegacyScope(rest as LoomEventInput));
      if (!r.valid) return r;
      const last = this.log[this.log.length - 1];
      last.seq = seq;
      last.ts = ts;
      this.seq = Math.max(this.seq, seq + 1);
    }
    return { valid: true };
  }

  getLog(): readonly LoomEvent[] {
    return this.log;
  }

  getLogLength(): number {
    return this.log.length;
  }
}
