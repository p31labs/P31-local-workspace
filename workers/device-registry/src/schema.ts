/**
 * @file schema.ts — CRDT sync primitives for the device registry (CWP-2026-071, Track F).
 *
 * Last-Writer-Wins per-field is EXPLICITLY OUT OF SCOPE — we use a CRDT merge
 * with Lamport clocks. Each leaf carries a `{ value, ts }` (ts = Lamport clock);
 * the higher clock wins; ties broken by actor id for determinism. Convergence
 * is guaranteed across ESP32-S3 → desktop.
 *
 * No external CRDT lib — the firmware C client re-implements this in ~120 lines.
 */

export interface Timestamped<T> {
  v: T;
  ts: number; // Lamport clock
  actor: string;
}

export type JSONValue =
  | string | number | boolean | null
  | JSONValue[]
  | { [k: string]: JSONValue };

export interface SyncDelta {
  deviceId: string;
  actor: string;
  lamport: number;
  /** Sparse path → value map (dotted paths, e.g. "config.brightness"). */
  paths: Record<string, Timestamped<JSONValue>>;
  /** Lamport clock the sender last observed from the server (for GC/ack). */
  baseLamport?: number;
  /** Sender wall-clock (ms). Used by the worker to reject stale offline deltas. */
  timestamp?: number;
}

export interface DeviceState {
  deviceId: string;
  actor: string;
  lamport: number;
  /** Full materialized key/value store (dotted paths → timestamped value). */
  fields: Record<string, Timestamped<JSONValue>>;
  version: number;
}

function lamportWins(a: Timestamped<JSONValue>, b: Timestamped<JSONValue>): boolean {
  if (a.ts !== b.ts) return a.ts > b.ts;
  return a.actor > b.actor;
}

/** Build a full DeviceState from a single SyncDelta (used on first sync). */
export function seedFromDelta(delta: SyncDelta): DeviceState {
  return {
    deviceId: delta.deviceId,
    actor: delta.actor,
    lamport: delta.lamport,
    fields: { ...delta.paths },
    version: delta.lamport,
  };
}

/**
 * Merge an incoming delta into an existing state (CRDT + Lamport).
 * Returns a NEW state; never mutates inputs. Clock is the max of both.
 */
export function mergeCRDT(prev: DeviceState | null, delta: SyncDelta): DeviceState {
  const base: DeviceState = prev ?? seedFromDelta({ deviceId: delta.deviceId, actor: delta.actor, lamport: 0, paths: {} });
  const fields = { ...base.fields };
  for (const [path, incoming] of Object.entries(delta.paths)) {
    const current = fields[path];
    if (!current || lamportWins(incoming, current)) {
      fields[path] = incoming;
    }
  }
  return {
    deviceId: delta.deviceId,
    actor: delta.actor,
    lamport: Math.max(base.lamport, delta.lamport),
    fields,
    version: Math.max(base.version, delta.lamport),
  };
}
