/**
 * @p31/canon — loom/events.ts
 *
 * THE frozen interface for The Loom. Shared substrate — owned by NEITHER path:
 *
 *   Path α (substrate)  owns apps/loom/**           (canvas + timeline)
 *   Path β (presence)   owns canon-mcp + demo agent (loom.* tools)
 *
 * Both paths import this and `jsonl.ts`; nothing else is shared. Do not fork
 * the paths against a different shape.
 *
 * Rules:
 *   - One writer per event kind. `focus`/`revise`/`approve`/`reject` are human;
 *     `traverse`/`propose`/`review`/`presence` are agent. The type encodes this.
 *   - The reducer is pure and O(1) (it clones the proposal map only on mutation).
 *     State does NOT hold the event log — the log is the log; the scrubber reads
 *     it directly.
 *   - `replay(events, N)` folds events with seq <= N.
 *
 * The agent only ever APPENDS events. It never writes registry.json, contracts,
 * or CSS — acceptance is a human `approve` event that a human lands as a normal
 * patch through the existing validators (validate-contracts, validate-registry,
 * verify:parity).
 *
 * SEQ / CONCURRENCY: one writer per session owns the log. Agent events come from
 * the MCP server; human focus events come from the Vite dev middleware. They use
 * non-overlapping seq ranges (agent: 1e9+, human: 1e9-) OR a single coordinating
 * process. `readEvents` sorts by seq regardless, so an out-of-order append is
 * tolerated on read but MUST NOT be relied on.
 */

export type Writer = 'human' | 'agent';

/** The visibility scope of an event.
 *  - `personal` — a specific human's private record. MUST carry a humanId
 *    (the gate enforces it); readable only by that humanId at the read path.
 *  - `shared` — the family's co-presence record. MUST NOT carry a humanId
 *    (the gate enforces it); readable by every household member.
 *  - `session` — reserved. The type allows it; no writer emits it yet. When a
 *    concrete live-only signal needs it (presence is the candidate), it gets
 *    a writer and the reasoning that justifies it. Two scopes is a real
 *    decision; three is a bet, so it is not written yet.
 */
export type LoomScope = 'personal' | 'shared' | 'session';

export type LoomEvent =
  | { seq: number; ts: string; writer: 'human'; kind: 'focus'; node: string; scope?: LoomScope; humanId?: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'traverse'; from: string; to: string; reason: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'propose'; id: string; node: string; body: unknown; author?: string; parentAgent?: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'revise'; proposal: string; body: unknown; scope?: LoomScope; humanId?: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'approve'; proposal: string; scope?: LoomScope; humanId?: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'reject'; proposal: string; reason: string; scope?: LoomScope; humanId?: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'review'; agent: string; proposalId: string; decision: 'approve' | 'amend' | 'reject'; reason?: string; revision: number; parentAgent?: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'presence'; node: string; attention: number }
  | { seq: number; ts: string; writer: 'human'; kind: 'view.save'; label: string; from: number; to: number; scope?: LoomScope; humanId?: string };

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

/** A named read promoted into the warp. `view.save` says "this window of the
 *  log is part of what the design system is" — a canonical event, not a weft
 *  trace. It enters `LoomState.saves` and therefore `canonicalize`; the
 *  artifact's identity includes its named readings. */
export interface SavedRead {
  id: string;
  label: string;
  /** The human whose read this is — `humanId`, or 'unknown'. */
  viewer: string;
  /** warpSeq at the start of the saved window. */
  from: number;
  /** warpSeq at the end of the saved window (inclusive). */
  to: number;
  seq: number;
  ts: string;
}

/** A derived record: the fold of a `review` event into a proposal's review
 *  list. `seq`/`ts` are copied from the event for the canvas and scrubber —
 *  nothing here is double-persisted; it is a DTO for consumers. */
export interface Review {
  agent: string;
  decision: 'approve' | 'amend' | 'reject';
  reason?: string;
  revision: number;
  seq: number;
  ts: string;
}

export interface Proposal {
  id: string;
  node: string;
  body: unknown;
  /** Set from the propose event's `author`, or 'unknown' for pre-author events. */
  author: string;
  status: ProposalStatus;
  /** How many times a human has revised the draft. */
  revision: number;
  /** Append-only agent reviews. Advisory — never changes `status`. */
  reviews: Review[];
  /** Survival score for each revise. Index i = survival of revision i+1
   *  against revision i (Jaccard of leaf key=value pairs). Empty at revision 0. */
  revisionSurvival: number[];
  /** Mean of revisionSurvival, or 1.0 when there are no revisions. */
  overallSurvival: number;
  reason?: string;
}

export interface LoomState {
  /** The node the human most recently focused. */
  focused: string | null;
  /** The node the agent's cursor is on right now. */
  agentCursor: string | null;
  /** The agent's remaining attention budget (1 = full, 0 = exhausted). */
  agentAttention: number;
  /** The ordered path the agent has traversed. */
  agentPath: string[];
  /** Proposals by id, live status. */
  proposals: Map<string, Proposal>;
  /** Named reads promoted into the warp via `view.save`. Append-only. */
  saves: SavedRead[];
}

export function initialState(): LoomState {
  return {
    focused: null,
    agentCursor: null,
    agentAttention: 1,
    agentPath: [],
    proposals: new Map<string, Proposal>(),
    saves: [],
  };
}

/** Flatten an arbitrary JSON body into leaf `path=value` strings, deterministic.
 *  Keys become path segments, array indices are `[i]`, scalars are `JSON.stringify`d
 *  so a string `"1"` and a number `1` never collide. */
function flatten(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [`${prefix}=${JSON.stringify(value)}`];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => flatten(v, `${prefix}[${i}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

/** Jaccard overlap of two bodies' leaf key=value pairs. 1.0 = identical leaves;
 *  0.0 = no shared leaves. Both-empty is 1.0 (no change); one-empty is 0.0. */
function survival(prev: unknown, next: unknown): number {
  const a = new Set(flatten(prev));
  const b = new Set(flatten(next));
  if (a.size === 0 && b.size === 0) return 1.0;
  if (a.size === 0 || b.size === 0) return 0.0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Pure fold. Returns a new state; never mutates the input or its maps. */
export function reduce(state: LoomState, event: LoomEvent): LoomState {
  let { focused, agentCursor, agentAttention, agentPath, proposals, saves } = state;

  switch (event.kind) {
    case 'focus':
      focused = event.node;
      break;
    case 'presence':
      agentCursor = event.node;
      agentAttention = event.attention;
      break;
    case 'traverse':
      agentPath = [...agentPath, event.to];
      agentCursor = event.to;
      break;
    case 'propose':
      proposals = new Map(proposals);
      proposals.set(event.id, {
        id: event.id,
        node: event.node,
        body: event.body,
        author: event.author ?? 'unknown',
        status: 'pending',
        revision: 0,
        reviews: [],
        revisionSurvival: [],
        overallSurvival: 1.0,
      });
      break;
    case 'revise': {
      const p = proposals.get(event.proposal);
      if (p) {
        proposals = new Map(proposals);
        const s = survival(p.body, event.body);
        const revisionSurvival = [...p.revisionSurvival, s];
        const overallSurvival = revisionSurvival.reduce((a, b) => a + b, 0) / revisionSurvival.length;
        proposals.set(p.id, { ...p, body: event.body, revision: p.revision + 1, revisionSurvival, overallSurvival });
      }
      break;
    }
    case 'approve': {
      const p = proposals.get(event.proposal);
      if (p) {
        proposals = new Map(proposals);
        proposals.set(p.id, { ...p, status: 'approved' });
      }
      break;
    }
    case 'reject': {
      const p = proposals.get(event.proposal);
      if (p) {
        proposals = new Map(proposals);
        proposals.set(p.id, { ...p, status: 'rejected', reason: event.reason });
      }
      break;
    }
    case 'review': {
      const p = proposals.get(event.proposalId);
      if (p) {
        proposals = new Map(proposals);
        proposals.set(p.id, {
          ...p,
          reviews: [
            ...p.reviews,
            {
              agent: event.agent,
              decision: event.decision,
              reason: event.reason,
              revision: event.revision,
              seq: event.seq,
              ts: event.ts,
            },
          ],
        });
      }
      break;
    }
    case 'view.save':
      saves = [
        ...saves,
        {
          id: `save:${event.seq}`,
          label: event.label,
          viewer: event.humanId ?? 'unknown',
          from: event.from,
          to: event.to,
          seq: event.seq,
          ts: event.ts,
        },
      ];
      break;
  }

  return { focused, agentCursor, agentAttention, agentPath, proposals, saves };
}

/** Fold the whole log, or only events with seq <= until. */
export function replay(events: readonly LoomEvent[], until?: number): LoomState {
  let state = initialState();
  for (const event of events) {
    if (until !== undefined && event.seq > until) break;
    state = reduce(state, event);
  }
  return state;
}
