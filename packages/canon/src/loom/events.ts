/**
 * @p31/canon — loom/events.ts
 *
 * THE frozen interface for The Loom. Both parallel paths depend on this file
 * and nothing else shares it:
 *
 *   Path α (substrate)  owns apps/loom/** and loom/{jsonl,replay}.ts
 *   Path β (presence)   owns canon-mcp/src/server.ts and the demo agent
 *
 * The event log is append-only JSONL. The reducer is pure: `reduce` folds one
 * event; `replay` reconstructs state at any sequence number. Same log ⇒ same
 * state, always. That property is the gate that lets the two paths work
 * independently.
 *
 * The agent only ever APPENDS events. It never writes registry.json, contracts,
 * or CSS — acceptance is a human `approve` event that a human lands as a normal
 * patch through the existing validators (validate-contracts, validate-registry,
 * verify:parity).
 */

export type Writer = 'human' | 'agent';

export type LoomEvent =
  | { seq: number; ts: string; writer: Writer; kind: 'focus'; node: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'traverse'; from: string; to: string; reason: string }
  | { seq: number; ts: string; writer: 'agent'; kind: 'propose'; id: string; node: string; body: unknown }
  | { seq: number; ts: string; writer: 'human'; kind: 'approve'; proposal: string }
  | { seq: number; ts: string; writer: 'human'; kind: 'reject'; proposal: string; reason: string }
  | { seq: number; ts: string; writer: Writer; kind: 'presence'; node: string; attention: number };

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  node: string;
  body: unknown;
  status: ProposalStatus;
  reason?: string;
}

export interface LoomState {
  /** The node the human most recently focused. */
  focused: string | null;
  /** The node the agent's cursor is on right now. */
  agentCursor: string | null;
  /** The ordered path the agent has traversed. */
  agentPath: string[];
  /** Proposals by id, live status. */
  proposals: Map<string, Proposal>;
  /** Every event, in order — the scrub source. */
  timeline: LoomEvent[];
}

export function initialState(): LoomState {
  return {
    focused: null,
    agentCursor: null,
    agentPath: [],
    proposals: new Map<string, Proposal>(),
    timeline: [],
  };
}

/** Pure fold. Returns a new state; never mutates the input. */
export function reduce(state: LoomState, event: LoomEvent): LoomState {
  let focused = state.focused;
  let agentCursor = state.agentCursor;
  let agentPath = state.agentPath;
  const proposals = new Map(state.proposals);

  switch (event.kind) {
    case 'focus':
      focused = event.node;
      break;
    case 'presence':
      agentCursor = event.node;
      break;
    case 'traverse':
      agentPath = [...agentPath, event.to];
      agentCursor = event.to;
      break;
    case 'propose':
      proposals.set(event.id, {
        id: event.id,
        node: event.node,
        body: event.body,
        status: 'pending',
      });
      break;
    case 'approve': {
      const p = proposals.get(event.proposal);
      if (p) proposals.set(p.id, { ...p, status: 'approved' });
      break;
    }
    case 'reject': {
      const p = proposals.get(event.proposal);
      if (p) proposals.set(p.id, { ...p, status: 'rejected', reason: event.reason });
      break;
    }
  }

  return { focused, agentCursor, agentPath, proposals, timeline: [...state.timeline, event] };
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
