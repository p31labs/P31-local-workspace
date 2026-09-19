/**
 * @p31/canon-mcp — loom-tools.ts
 *
 * The Loom's presence handlers — the agent-facing half of the shared event log.
 * One implementation, two entry points: server.ts registers each function as an
 * MCP tool, and scripts/loom-demo-agent.mjs imports the same functions directly
 * so the demo exercises exactly what the tools exercise.
 *
 * Every write goes through commit() — the seal gate fails the build otherwise.
 * Writer-per-kind holds: these handlers emit agent-only events (traverse,
 * propose, presence). They never focus/approve/reject/revise — those are human.
 *
 * NOTE on reviews: the substrate has no `review` event kind yet. awaitReviews()
 * polls for one, so today its only exercised path is timeout. That is honest —
 * the signature is shaped for the future without inventing the schema.
 */
import { commit, type CommitResult } from '@p31/canon/loom/commit';
import { readEvents } from '@p31/canon/loom/jsonl';
import { replay } from '@p31/canon/loom/events';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** The log every handler reads and writes. cwd-walk to the repo root, or the
 *  LOOM_LOG env var. Same convention as the canvas's middleware so both sides
 *  of the log agree on one file. */
export function resolveLogPath(): string {
  if (process.env.LOOM_LOG) return process.env.LOOM_LOG;
  let dir = resolve(process.cwd());
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return join(dir, '.loom', 'events.jsonl');
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('repo root not found (no pnpm-workspace.yaml up the tree)');
    dir = parent;
  }
}

export interface ProposalView {
  id: string;
  node: string;
  status: string;
  revision: number;
  body: unknown;
}

export interface ObserveResult {
  focused: string | null;
  agentCursor: string | null;
  agentAttention: number;
  agentPath: string[];
  proposals: ProposalView[];
  proposal?: ProposalView | null;
}

/** Read the log, fold it, and return a JSON-serializable view. No Map, no Date. */
export function observe(logPath: string, proposalId?: string): ObserveResult {
  const state = replay(readEvents(logPath));
  const proposals: ProposalView[] = [...state.proposals.values()].map((p) => ({
    id: p.id,
    node: p.node,
    status: p.status,
    revision: p.revision,
    body: p.body,
  }));
  const result: ObserveResult = {
    focused: state.focused,
    agentCursor: state.agentCursor,
    agentAttention: state.agentAttention,
    agentPath: state.agentPath,
    proposals,
  };
  if (proposalId !== undefined) {
    result.proposal = proposals.find((p) => p.id === proposalId) ?? null;
  }
  return result;
}

/** Agent-only: record a traversal step through the graph. */
export function traverse(logPath: string, from: string, to: string, reason: string): CommitResult {
  return commit(logPath, { writer: 'agent', kind: 'traverse', from, to, reason });
}

/** Agent-only: record a proposal against a node. The id is the caller's choice. */
export function propose(logPath: string, id: string, node: string, body: unknown): CommitResult {
  return commit(logPath, { writer: 'agent', kind: 'propose', id, node, body });
}

export interface AwaitResult {
  status: 'timeout' | 'complete';
  reviews?: unknown[];
}

/**
 * Block until a review event lands for the proposal, or the timeout elapses.
 * A timeout is a RETURN VALUE, not an exception — the caller adapts. Today it
 * always times out because the review event kind does not exist yet.
 */
export async function awaitReviews(
  logPath: string,
  proposalId: string,
  timeoutMs: number,
): Promise<AwaitResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const reviews = readEvents(logPath).filter(
      (e) => (e as { kind?: string }).kind === 'review' && (e as { proposalId?: string }).proposalId === proposalId,
    );
    if (reviews.length > 0) return { status: 'complete', reviews };
    await new Promise((r) => setTimeout(r, 100));
  }
  return { status: 'timeout' };
}
