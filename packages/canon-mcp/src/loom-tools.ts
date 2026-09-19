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
 * propose, review, presence). They never focus/approve/reject/revise — those
 * are human.
 */
import { commit, type CommitResult } from '@p31/canon/loom/commit';
import { readEvents } from '@p31/canon/loom/jsonl';
import { replay, type LoomEvent, type Review } from '@p31/canon/loom/events';
import { readProfile, type HumanProfile } from '@p31/canon/loom/profiles';
import { watch, type FSWatcher } from 'node:fs';

/** Re-export the canonical resolver so existing importers (server.ts, the demo
 *  agent) keep their surface. The implementation lives in @p31/canon. */
export { resolveLogPath } from '@p31/canon/loom/log-path';

export interface ProposalView {
  id: string;
  node: string;
  author: string;
  status: string;
  revision: number;
  body: unknown;
  reviews: Review[];
  revisionSurvival: number[];
  overallSurvival: number;
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
    author: p.author,
    status: p.status,
    revision: p.revision,
    body: p.body,
    reviews: p.reviews,
    revisionSurvival: p.revisionSurvival,
    overallSurvival: p.overallSurvival,
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

/** Agent-only: record a proposal against a node. The id is the caller's choice.
 *  `author` is the free-form agent identity; when omitted, the log records
 *  'unknown' (pre-author events are read the same way). */
export function propose(logPath: string, id: string, node: string, body: unknown, author?: string): CommitResult {
  return commit(logPath, { writer: 'agent', kind: 'propose', id, node, body, author });
}

/** Agent-only: post an advisory review on a proposal. The gate stamps the
 *  `revision` from the proposal's current state — the caller never sets it, so
 *  a review always pins the version it actually saw. `reason` is required when
 *  `decision` is amend or reject. */
export function review(
  logPath: string,
  proposalId: string,
  decision: 'approve' | 'amend' | 'reject',
  agent: string,
  reason?: string,
): CommitResult {
  const state = replay(readEvents(logPath));
  const proposal = state.proposals.get(proposalId);
  if (!proposal) return { valid: false, error: `unknown proposal: ${proposalId}` };
  return commit(logPath, { writer: 'agent', kind: 'review', agent, proposalId, decision, reason, revision: proposal.revision });
}

export interface AwaitResult {
  status: 'timeout' | 'complete';
  reviews?: LoomEvent[];
}

/**
 * Mediator: render a proposal body at the human's tier for DISPLAY only.
 *
 * Reads the human's profile (tier + consent) and the proposal's artifact view
 * via observe(). If the human consented (shareWithAgents.tier) and is at
 * `beginner`, returns a `mediated` field — a plain-language, one-sentence
 * "what this changes" summary plus the untouched original body. It NEVER
 * writes a review, approve, reject, or revise; it does not touch the log.
 *
 * The human's decision in the log is always a decision about the ORIGINAL
 * body. The mediation is a render-layer translation, not a shadow revision.
 */
export interface MediatedProposal extends ProposalView {
  /** Set when a beginner-tier human consented to tier sharing. Plain-language
   *  summary of the change; the original body remains authoritative. */
  mediatedSummary?: string;
}

export function mediate(
  logPath: string,
  profilesDir: string,
  humanId: string,
  proposalId?: string,
): ObserveResult & { mediated?: MediatedProposal } {
  const view = observe(logPath, proposalId);
  const profile: HumanProfile | null = readProfile(profilesDir, humanId);
  if (!profile || profile.tier !== 'beginner' || profile.shareWithAgents?.tier !== true) {
    return view;
  }
  const target = proposalId ? view.proposal : undefined;
  if (!target) return view;

  return {
    ...view,
    mediated: {
      ...target,
      mediatedSummary: summarize(target.body),
    },
  };
}

/** Deterministic, model-free plain-language summary of a proposal body. One
 *  sentence: what node it touches and, when the body is a plain object, its
 *  top-level keys. No model call — this is arithmetic over the body's shape. */
function summarize(body: unknown): string {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const keys = Object.keys(body as Record<string, unknown>);
    if (keys.length > 0) return `This changes ${keys.join(', ')}.`;
  }
  if (Array.isArray(body)) return `This changes a list of ${body.length} items.`;
  if (body === null || body === undefined) return 'This change has no detail.';
  return `This changes: ${String(body).slice(0, 120)}.`;
}

/**
 * Block until a review event lands for the proposal, or the timeout elapses.
 * A timeout is a RETURN VALUE, not an exception — the caller adapts.
 *
 * Waits on fs.watch of the log file rather than polling: the server owns the
 * file and re-reads it on change. An initial read is done first (a review may
 * already exist before the watcher is armed). The deadline is authoritative.
 */
export async function awaitReviews(
  logPath: string,
  proposalId: string,
  timeoutMs: number,
): Promise<AwaitResult> {
  const deadline = Date.now() + timeoutMs;
  const reviewsFor = (): LoomEvent[] =>
    readEvents(logPath).filter((e) => e.kind === 'review' && e.proposalId === proposalId);

  // A review may have landed before the watcher is armed.
  const already = reviewsFor();
  if (already.length > 0) return { status: 'complete', reviews: already };

  return new Promise<AwaitResult>((resolve) => {
    let watcher: FSWatcher | null = null;
    let timer: NodeJS.Timeout | null = null;
    let settled = false;
    const settle = (result: AwaitResult) => {
      if (settled) return;
      settled = true;
      watcher?.close();
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    timer = setTimeout(() => settle({ status: 'timeout' }), timeoutMs);

    try {
      watcher = watch(logPath, () => {
        const reviews = reviewsFor();
        if (reviews.length > 0) settle({ status: 'complete', reviews });
      });
    } catch {
      // The log file does not exist yet (nothing proposed). Fall back to a
      // bounded poll so the first commit still wakes this wait.
      const poll = () => {
        if (settled) return;
        if (Date.now() >= deadline) return settle({ status: 'timeout' });
        const reviews = reviewsFor();
        if (reviews.length > 0) settle({ status: 'complete', reviews });
        else setTimeout(poll, 50);
      };
      setTimeout(poll, 50);
    }
  });
}
