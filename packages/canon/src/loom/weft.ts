/**
 * @p31/canon — loom/weft.ts
 *
 * The WEft store — the operational ledger of reads, distinct from the warp
 * (the canonical artifact log). Where the warp holds decisions, the weft
 * holds attention: mode switches, pins, scrubs. Ephemeral by default,
 * pruned; promotion into the warp happens only when a human emits a
 * `view.save` (which lives in events.ts, not here).
 *
 * Every weft event carries the `warpSeq` it was emitted against — the warp
 * head the viewer was reading when they acted. This is what makes a read
 * replayable: to see the artifact at T47 *and* the reads at T47, filter the
 * weft by warpSeq <= 47. Without the stamp, you would only ever see weft-head.
 */
import { readFileSync, existsSync } from 'node:fs';

export type WeftMode = 'explore' | 'review' | 'timeline' | 'diff';

export type WeftEvent =
  | { seq: number; ts: string; kind: 'view.mode'; mode: WeftMode; warpSeq: number; humanId?: string }
  | { seq: number; ts: string; kind: 'view.pin'; node: string; pinned: boolean; warpSeq: number; humanId?: string }
  | { seq: number; ts: string; kind: 'view.scrub'; at: number; warpSeq: number; humanId?: string }
  | { seq: number; ts: string; kind: 'view.read'; scale: 'constellation' | 'zone' | 'trace'; focus: string | null; entropy: number; whiteSpace: number; warpSeq: number; humanId?: string }
  | { seq: number; ts: string; kind: 'field.decision'; zone: string; proposalId: string; pressure: number; hazard: number; trust: number; warpSeq: number; humanId?: string };

export type WeftEventInput =
  | { kind: 'view.mode'; mode: WeftMode; warpSeq: number; humanId?: string }
  | { kind: 'view.pin'; node: string; pinned: boolean; warpSeq: number; humanId?: string }
  | { kind: 'view.scrub'; at: number; warpSeq: number; humanId?: string }
  | { kind: 'view.read'; scale: 'constellation' | 'zone' | 'trace'; focus: string | null; entropy: number; whiteSpace: number; warpSeq: number; humanId?: string }
  | { kind: 'field.decision'; zone: string; proposalId: string; pressure: number; hazard: number; trust: number; warpSeq: number; humanId?: string };

export interface WeftGateResult {
  valid: boolean;
  error?: string;
}

/**
 * The weft gate. Assigns seq + ts, validates the shape, and reconstructs
 * state. Deliberately lighter than ReplayGate: the weft carries no proposals,
 * no orphan references, no stale-revision hazards — it is a record of reads.
 * But it is still a gate: a malformed weft line fails, not silently skips.
 */
export class WeftGate {
  private log: WeftEvent[] = [];
  private seq = 0;

  append(input: WeftEventInput): WeftGateResult {
    if (input.kind === 'view.mode') {
      if (!['explore', 'review', 'timeline', 'diff'].includes(input.mode)) {
        return { valid: false, error: `unknown view mode: ${input.mode}` };
      }
    } else if (input.kind === 'view.pin') {
      if (typeof input.node !== 'string' || input.node.trim().length === 0) {
        return { valid: false, error: 'view.pin requires a non-empty node' };
      }
    } else if (input.kind === 'view.scrub') {
      if (!Number.isInteger(input.at) || input.at < 0) {
        return { valid: false, error: `view.scrub.at must be a non-negative integer (got ${input.at})` };
      }
    } else if (input.kind === 'view.read') {
      if (!['constellation', 'zone', 'trace'].includes(input.scale)) {
        return { valid: false, error: `unknown view.read scale: ${input.scale}` };
      }
      for (const k of ['entropy', 'whiteSpace'] as const) {
        if (typeof input[k] !== 'number' || !Number.isFinite(input[k])) {
          return { valid: false, error: `view.read.${k} must be a finite number` };
        }
      }
    } else if (input.kind === 'field.decision') {
      if (typeof input.zone !== 'string' || input.zone.trim().length === 0) {
        return { valid: false, error: 'field.decision requires a non-empty zone' };
      }
      if (typeof input.proposalId !== 'string' || input.proposalId.trim().length === 0) {
        return { valid: false, error: 'field.decision requires a non-empty proposalId' };
      }
      for (const k of ['pressure', 'hazard', 'trust'] as const) {
        if (typeof input[k] !== 'number' || !Number.isFinite(input[k])) {
          return { valid: false, error: `field.decision.${k} must be a finite number` };
        }
      }
    }
    if (!Number.isInteger(input.warpSeq) || input.warpSeq < 0) {
      return { valid: false, error: `weft warpSeq must be a non-negative integer (got ${input.warpSeq})` };
    }

    const seq = this.seq;
    const event = { ...input, seq, ts: new Date().toISOString() } as WeftEvent;
    this.log.push(event);
    this.seq = seq + 1;
    return { valid: true };
  }

  toJSONL(): string {
    return this.log.map((e) => JSON.stringify(e)).join('\n');
  }

  fromJSONL(text: string): WeftGateResult {
    this.log = [];
    this.seq = 0;
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let parsed: WeftEvent;
      try {
        parsed = JSON.parse(line) as WeftEvent;
      } catch {
        return { valid: false, error: `corrupt weft line: ${line.slice(0, 48)}` };
      }
      const { seq, ts, ...rest } = parsed as WeftEvent & { seq: number; ts: string };
      const r = this.append(rest as WeftEventInput);
      if (!r.valid) return r;
      const last = this.log[this.log.length - 1];
      last.seq = seq;
      last.ts = ts;
      this.seq = Math.max(this.seq, seq + 1);
    }
    return { valid: true };
  }

  getLog(): readonly WeftEvent[] {
    return this.log;
  }
}

/** Read the weft log, skipping malformed lines, sorted ascending by seq. */
export function readWeft(path: string): WeftEvent[] {
  if (!existsSync(path)) return [];
  const events: WeftEvent[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line) as WeftEvent);
    } catch {
      // skip corrupt line
    }
  }
  return events.sort((a, b) => a.seq - b.seq);
}

const MAX_WEFT_EVENTS = 100_000;

/**
 * Retention. The weft is ephemeral; it decays. The rule, expressed once so it
 * is not invented per-caller:
 *
 *   When the weft exceeds MAX_WEFT_EVENTS, keep the newest MAX_WEFT_EVENTS.
 *
 * Saved reads are already promoted into the warp (via view.save), so pruning
 * the weft loses only unsaved attention — which is exactly what ephemeral
 * means. Nothing here is canonical.
 */
export function pruneWeft(events: WeftEvent[]): WeftEvent[] {
  if (events.length <= MAX_WEFT_EVENTS) return events;
  return events.slice(events.length - MAX_WEFT_EVENTS);
}
