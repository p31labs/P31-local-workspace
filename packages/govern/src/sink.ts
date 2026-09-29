/**
 * sink — where audit events go.
 *
 * The runtime emits to a sink; the sink decides where events land. The
 * interface is what makes the runtime universal — the Genesis Block chain, a
 * remote Loom, or stdout are all sinks the same interface allows.
 *
 * The JsonlHashChainSink matches Paper XII's Genesis Block contract:
 *   blockNumber, ISO-8601 timestamp, eventType, payload, prevHash, currentHash.
 * SHA-256 over the canonical JSON of {blockNumber, timestamp, eventType, payload, prevHash}.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, existsSync } from 'node:fs';

export interface AuditEvent {
  domain: string;
  schemaVersion: string;
  timestamp: string;
  valid: boolean;
  violations: string[];
  selfTest: { gates: number; canFail: number; furniture: string[] };
  ratchets: Array<{ id: string; baseline: number; current: number; ok: boolean; detail: string }>;
  floatingNeutrals: Array<{ primitive: string; detail: string; remediation: string }>;
  capacity: number | null;
}

export interface Block {
  blockNumber: number;
  timestamp: string;
  eventType: 'genesis' | 'audit';
  payload: AuditEvent;
  prevHash: string;
  currentHash: string;
}

export interface AuditSink {
  append(event: AuditEvent): Block;
}

export class JsonlHashChainSink implements AuditSink {
  private path: string;
  private chainName: string;

  constructor(path: string, chainName: string) {
    this.path = path;
    this.chainName = chainName;
  }

  private lastBlock(): Block | null {
    if (!existsSync(this.path)) return null;
    const lines = readFileSync(this.path, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length === 0) return null;
    return JSON.parse(lines[lines.length - 1]) as Block;
  }

  append(event: AuditEvent): Block {
    const last = this.lastBlock();
    const blockNumber = last ? last.blockNumber + 1 : 0;
    const prevHash = last ? last.currentHash : '0'.repeat(64);
    // Use the event's timestamp if present — CompositeSink stamps once so all
    // sinks hash a byte-identical block. Without this, each sink stamps its
    // own new Date(), and a clock tick between appends gives the enterprise
    // timeline mirror blocks with different hashes.
    const timestamp = event.timestamp ?? new Date().toISOString();
    const eventType: 'genesis' | 'audit' = last ? 'audit' : 'genesis';
    const canonical = JSON.stringify({ blockNumber, timestamp, eventType, payload: event, prevHash });
    const currentHash = createHash('sha256').update(canonical).digest('hex');
    const block: Block = { blockNumber, timestamp, eventType, payload: event, prevHash, currentHash };
    appendFileSync(this.path, JSON.stringify(block) + '\n');
    return block;
  }
}

export class StdoutSink implements AuditSink {
  append(event: AuditEvent): Block {
    const timestamp = new Date().toISOString();
    const prevHash = '0'.repeat(64);
    const canonical = JSON.stringify({ blockNumber: 0, timestamp, eventType: 'audit', payload: event, prevHash });
    const currentHash = createHash('sha256').update(canonical).digest('hex');
    const block: Block = { blockNumber: 0, timestamp, eventType: 'audit', payload: event, prevHash, currentHash };
    console.log(JSON.stringify(block, null, 2));
    return block;
  }
}

/**
 * CompositeSink — writes every event to multiple sinks. This is the
 * enterprise timeline mechanism: each domain's Genesis chain stays intact,
 * and a shared enterprise chain receives the same events. The per-domain
 * chain is the local truth; the composite is the unified timeline.
 */
export class CompositeSink implements AuditSink {
  private sinks: AuditSink[];

  constructor(...sinks: AuditSink[]) {
    this.sinks = sinks;
  }

  append(event: AuditEvent): Block {
    // Stamp the event ONCE so every sink hashes a byte-identical payload.
    // If each sink called new Date() independently, a clock tick between
    // appends would give mirror blocks different timestamps → different
    // hashes → the enterprise timeline would not reconcile. This is the
    // determinism the reconciliation depends on.
    const stamped: AuditEvent = { ...event, timestamp: event.timestamp ?? new Date().toISOString() };
    const [head, ...rest] = this.sinks;
    const block = head.append(stamped);
    for (const s of rest) s.append(stamped);
    return block;
  }
}