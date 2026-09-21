/**
 * @p31/canon — loom/memory.ts
 *
 * Lumi's persistent memory, as a pure fold over the event log.
 *
 * Four tiers, per the AEGIS family-memory pattern:
 *   - episodic  — what happened: the recent shared events, named by codename
 *   - semantic  — what matters: the child's color, the nodes that recur
 *   - procedural — what works: which proposals were approved, what landed
 *   - narrative — the arc, as ONE plain sentence ("you and Lumi made N things")
 *
 * The fold is DETERMINISTIC — no LLM on the critical path. The same events
 * always fold to the same memory. AI phrasing is a separate, gated increment
 * (a missing binding degrades to this deterministic sentence, never to a
 * blank or an error).
 *
 * Edge-safe + pure: no imports beyond the types, works in Workers, Node, and
 * tests. Shared substrate — Path α (the Worker's LumiMemoryDO + Pages
 * Functions) and Path β (the dev middleware) both consume this same fold so
 * the edge and the dev server never disagree about what Lumi remembers.
 *
 * Scope: the fold reads SHARED events only (the read path already scoped
 * them). Personal preferences that a child shared via an agent proposal are
 * in the log as shared `propose` events (the agent formalized the child's
 * idea), so the semantic tier sees them without ever touching a personal
 * record.
 */
import type { LoomEvent } from './events.ts'

export interface EpisodicEntry {
  seq: number
  ts: string
  /** One-line description, named by codename (statedBy) or role. */
  summary: string
}

export interface LumiMemory {
  episodic: EpisodicEntry[]
  /** The colors the child picked, most recent first. */
  colors: string[]
  /** The node names the human focused on most, most frequent first. */
  focusNodes: { node: string; count: number }[]
  /** Proposals the child approved. */
  approved: string[]
  /** One deterministic narrative sentence. */
  narrative: string
  /** Total shared human actions (the "things done together" count). */
  sharedHumanCount: number
}

export function emptyMemory(): LumiMemory {
  return {
    episodic: [],
    colors: [],
    focusNodes: [],
    approved: [],
    narrative: 'Lumi is new here. Go say hello.',
    sharedHumanCount: 0,
  }
}

const MAX_EPISODIC = 5

/** Describe an event in plain language, naming people by codename. Shared
 *  human events carry statedBy (a handle); agent events read as Lumi's role. */
export function describeEvent(e: LoomEvent): string {
  if (e.writer === 'agent') {
    switch (e.kind) {
      case 'propose': return 'Lumi proposed something'
      case 'traverse': return 'Lumi looked around'
      case 'review': return 'Lumi reviewed a proposal'
      default: return 'Lumi was here'
    }
  }
  const who = e.statedBy ? e.statedBy : 'someone'
  switch (e.kind) {
    case 'focus': return `${who} focused on ${e.node}`
    case 'approve': return `${who} said yes`
    case 'reject': return `${who} said not yet`
    case 'view.save': return `${who} saved a read`
    default: return `${who} did something`
  }
}

/** Fold the (already scoped) shared events into Lumi's memory. Deterministic:
 *  same events → same memory, on every runtime. */
export function foldMemory(events: readonly LoomEvent[]): LumiMemory {
  const m = emptyMemory()

  // Episodic: the most recent shared events, newest first.
  m.episodic = [...events]
    .reverse()
    .slice(0, MAX_EPISODIC)
    .map((e) => ({ seq: e.seq, ts: e.ts, summary: describeEvent(e) }))

  // Semantic: colors the child picked (agent proposals with body.color), and
  // the nodes the human focused on most.
  const colorSeen = new Set<string>()
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.writer === 'agent' && e.kind === 'propose') {
      const color = (e.body as { color?: unknown } | undefined)?.color
      if (typeof color === 'string' && !colorSeen.has(color)) {
        colorSeen.add(color)
        m.colors.push(color)
      }
    }
  }
  const nodeCount = new Map<string, number>()
  for (const e of events) {
    if (e.writer === 'human' && e.kind === 'focus' && typeof e.node === 'string') {
      nodeCount.set(e.node, (nodeCount.get(e.node) ?? 0) + 1)
    }
  }
  m.focusNodes = [...nodeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([node, count]) => ({ node, count }))

  // Procedural: proposals the child approved.
  for (const e of events) {
    if (e.writer === 'human' && e.kind === 'approve') m.approved.push(e.proposal)
  }

  // Narrative: ONE plain sentence. Deterministic; the "N things" count is the
  // number of shared human actions (what the family did together).
  m.sharedHumanCount = events.filter((e) => e.writer === 'human').length
  if (m.colors.length > 0) {
    m.narrative = `You and Lumi have made ${m.colors.length} thing${m.colors.length === 1 ? '' : 's'} together — the latest in ${m.colors[0]}.`
  } else if (m.sharedHumanCount > 0) {
    m.narrative = `You and Lumi have been doing things together (${m.sharedHumanCount} so far).`
  } else {
    m.narrative = 'Lumi is new here. Go say hello.'
  }

  return m
}