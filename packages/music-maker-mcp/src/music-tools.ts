/**
 * @p31/music-maker-mcp — src/music-tools.ts
 *
 * The music maker's agent-facing tools. Transport: HTTP to the deployed
 * worker (the same endpoints the browser client uses). Unlike canon-mcp
 * (which reads a local file log), the music maker's log lives in D1 behind
 * the worker — so these tools call the worker's HTTP API, NOT readEvents().
 * The pattern is reused; the module isn't (the sibling-in-shape, not-
 * sibling-in-transport correction from the integration scope).
 *
 *   music_observe   → GET /api/music/events   (read the committed composition)
 *   music_place     → POST /api/music/event   (committed through the canon gate)
 *   music_clear     → POST /api/music/event   (committed)
 *   music_name      → POST /api/music/event   (committed)
 *   music_trigger   → POST /api/music/ephemeral (never persisted, never gated)
 *
 * The base URL is configurable (MUSIC_API_URL) so the same tools run against
 * the deployed worker in production and the Vite dev middleware locally.
 */

let base = process.env.MUSIC_API_URL ?? 'https://music-presence.trimtab-signal.workers.dev';

/** Set the worker URL at runtime (the Worker wrapper passes its env). */
export function setBaseUrl(url?: string): void {
  if (url) base = url;
}

export interface MusicZone {
  id: string;
  position: [number, number, number];
  timbre: string;
  name: string;
}

export interface ObserveResult {
  zones: MusicZone[];
  count: number;
}

export interface WriteResult {
  ok: boolean;
  error?: string;
  seq?: number;
}

async function httpJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  return res.json();
}

/** Read the committed composition. The zones are the family's score. */
export async function observe(): Promise<ObserveResult> {
  const events = (await httpJson('/api/music/events')) as Array<Record<string, unknown>>;
  const zones = (events ?? [])
    .filter((e) => e.kind === 'instrument.zone.place')
    .map((e) => ({
      id: String(e.node),
      position: e.position as [number, number, number],
      timbre: String(e.timbre ?? 'hydrogen'),
      name: String(e.name ?? ''),
    }));
  return { zones, count: zones.length };
}

/** Commit a placement — gate-validated, seq-stamped, hash-chained. */
export async function place(position: [number, number, number], timbre: string, name?: string): Promise<WriteResult> {
  const r = (await httpJson('/api/music/event', {
    method: 'POST',
    body: JSON.stringify({
      input: { writer: 'human', kind: 'instrument.zone.place', node: `zone:${Date.now().toString(36)}`, position, timbre, ...(name ? { name } : {}) },
    }),
  })) as { valid: boolean; error?: string; event?: { seq: number } };
  return { ok: r.valid, error: r.error, seq: r.event?.seq };
}

/** Commit a clear — the removal is a log entry like any other change. */
export async function clear(zoneId: string): Promise<WriteResult> {
  const r = (await httpJson('/api/music/event', {
    method: 'POST',
    body: JSON.stringify({ input: { writer: 'human', kind: 'instrument.zone.clear', node: zoneId } }),
  })) as { valid: boolean; error?: string; event?: { seq: number } };
  return { ok: r.valid, error: r.error, seq: r.event?.seq };
}

/** Commit a rename. */
export async function name(zoneId: string, newName: string): Promise<WriteResult> {
  const r = (await httpJson('/api/music/event', {
    method: 'POST',
    body: JSON.stringify({ input: { writer: 'human', kind: 'instrument.zone.name', node: zoneId, name: newName } }),
  })) as { valid: boolean; error?: string; event?: { seq: number } };
  return { ok: r.valid, error: r.error, seq: r.event?.seq };
}

/** Ephemeral — never persisted. The live act of a zone sounding when touched. */
export async function trigger(zoneId: string, origin = 'agent'): Promise<WriteResult> {
  const r = (await httpJson('/api/music/ephemeral', {
    method: 'POST',
    body: JSON.stringify({ type: 'ephemeral', kind: 'zone.trigger', zone: zoneId, origin }),
  })) as { valid: boolean; error?: string };
  return { ok: r.valid, error: r.error };
}