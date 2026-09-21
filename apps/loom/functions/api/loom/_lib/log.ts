import { ReplayGate, type LoomEventInput } from '@p31/canon/loom/gate';
import type { LoomEvent } from '@p31/canon/loom/events';

/**
 * The D1-backed log adapter. The canon's log is file-based locally; in the
 * edge it is D1 rows. seq/ts are gate-assigned; the full event JSON is stored
 * in `data` so replay reconstructs LoomEvent objects exactly.
 *
 * The gate is stateless per invocation, so appendEvent rebuilds it by folding
 * the existing rows first (reconstructing proposalIds / proposalRevisions),
 * then appends the new input. O(log length) per append — trivial for a family
 * log.
 */
export interface D1Env {
  LOOM_D1: import('@cloudflare/workers-types').D1Database;
}

export async function readEvents(env: D1Env): Promise<LoomEvent[]> {
  const { results } = await env.LOOM_D1.prepare('SELECT seq, ts, data FROM events ORDER BY seq ASC').all<{
    seq: number;
    ts: string;
    data: string;
  }>();
  return (results ?? []).map((r) => {
    const event = JSON.parse(r.data) as LoomEvent;
    return { ...event, seq: r.seq, ts: r.ts };
  });
}

/** Append one input, gate-validated. Returns the committed event, or throws
 *  with the gate's error if invalid. */
export async function appendEvent(env: D1Env, input: LoomEventInput): Promise<LoomEvent> {
  const gate = new ReplayGate();
  const existing = await readEvents(env);
  for (const e of existing) {
    const r = gate.append(e as LoomEventInput);
    if (!r.valid) throw new Error(`replay rejected existing event: ${r.error}`);
  }
  const result = gate.append(input);
  if (!result.valid) throw new Error(`gate rejected ${input.kind}: ${result.error}`);
  // The gate's append returns {valid, error} — the committed event is the last
  // entry of its internal log.
  const log = gate.getLog();
  const event = log[log.length - 1];
  await env.LOOM_D1.prepare('INSERT INTO events (seq, ts, data) VALUES (?, ?, ?)')
    .bind(event.seq, event.ts, JSON.stringify(event))
    .run();
  return event;
}