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

export type LoomEvent =
  | { seq: number; ts: string; writer: 'human'; kind: 'focus'; node: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'traverse'; from: string; to: string; reason: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'propose'; id: string; node: string; body: unknown; author?: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'revise'; proposal: string; body: unknown }
  | { seq: number; ts: string; writer: 'human'; kind: 'approve'; proposal: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'reject'; proposal: string; reason: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'review'; agent: string; proposalId: string; decision: 'approve' | 'amend' | 'reject'; reason?: string; revision: number }
  | { seq: number; ts: string; writer: 'agent'; kind: 'presence'; node: string; attention: number };

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

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
}

export function initialState(): LoomState {
  return {
    focused: null,
    agentCursor: null,
    agentAttention: 1,
    agentPath: [],
    proposals: new Map<string, Proposal>(),
  };
}

/** Pure fold. Returns a new state; never mutates the input or its maps. */
export function reduce(state: LoomState, event: LoomEvent): LoomState {
  let { focused, agentCursor, agentAttention, agentPath, proposals } = state;

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
      });
      break;
    case 'revise': {
      const p = proposals.get(event.proposal);
      if (p) {
        proposals = new Map(proposals);
        proposals.set(p.id, { ...p, body: event.body, revision: p.revision + 1 });
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
  }

  return { focused, agentCursor, agentAttention, agentPath, proposals };
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
