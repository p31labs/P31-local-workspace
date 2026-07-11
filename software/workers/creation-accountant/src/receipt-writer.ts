// Hash-chain receipt writer for the LOVE ledger.
// Web Crypto only (no Node.js `crypto`). Atomic via D1 batch.
import { withRetry } from './receipt-crypto';

// Axis-3 (replay): a reused spoon-measurement nonce is rejected.
export class ReplayError extends Error {}

async function sha256(message: string): Promise<string> {
  const buf = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ReceiptInput {
  intent_id: string;
  from_did: string;
  to_did: string;
  spoons_saved: number;
  care_value: number;
  settlement_unit: 'love' | 'usdc';
  amount: number;
  artifacts: string[];
  quote_met: boolean;
  signature?: string;
  nonce?: string;
}

export async function writeReceipt(db: D1Database, data: ReceiptInput) {
  // prev_hash = this user's most recent love_chain entry_hash.
  // (Avoid ORDER BY — reconstruct in JS, matching the deployed ledger.)
  const prevRows = await db.prepare(
    'SELECT entry_hash, created_at FROM love_chain WHERE from_did = ?'
  ).bind(data.from_did).all<{ entry_hash: string; created_at: number }>();
  let prevHash = '0'.repeat(64);
  let maxTs = -1;
  for (const r of prevRows.results || []) {
    if (r.created_at > maxTs) {
      maxTs = r.created_at;
      prevHash = r.entry_hash;
    }
  }

  const entryData = [
    data.from_did,
    data.to_did,
    String(data.spoons_saved),
    String(data.care_value),
    data.settlement_unit,
    String(data.amount),
    prevHash,
    data.intent_id,
  ].join('|');
  const entryHash = await sha256(entryData);

  const id = `creat-${crypto.randomUUID()}`;
  const ts = Date.now(); // ms — matches the deployed ledger's created_at

  // Axis-3 (replay): reject a reused spoon-measurement nonce
  // before any write. The nonce is renderer-supplied and must be
  // single-use (prevents replaying a favourable spoon delta).
  if (data.nonce) {
    const seen = await db.prepare(
      'SELECT 1 FROM consumed_nonces WHERE nonce = ?'
    ).bind(data.nonce).first();
    if (seen) throw new ReplayError('Spoon measurement nonce already consumed');
  }

  const insertChain = db.prepare(`
    INSERT INTO love_chain (id, prev_hash, entry_hash, from_did, to_did, amount, type, signature, created_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, 'creation_receipt', ?, ?, ?)
  `).bind(
    id,
    prevHash,
    entryHash,
    data.from_did,
    data.to_did,
    String(data.amount),
    data.signature ?? '',
    ts,
    JSON.stringify({
      intent_id: data.intent_id,
      spoons_saved: data.spoons_saved,
      care_value: data.care_value,
      settlement_unit: data.settlement_unit,
      artifacts: data.artifacts,
      quote_met: data.quote_met,
    })
  );

  // Everything below commits atomically. A single batch means a
  // replay/penalty can never be left half-written under D1 locks.
  const statements: D1PreparedStatement[] = [insertChain];

  if (data.nonce) {
    statements.push(db.prepare(`
      INSERT INTO consumed_nonces (nonce, consumed_at, intent_id, worker_did)
      VALUES (?, ?, ?, ?)
    `).bind(data.nonce, ts, data.intent_id, data.to_did));
  }

  // Failed intent → void the quote + log a worker-reputation penalty.
  if (!data.quote_met) {
    statements.push(db.prepare(`
      INSERT INTO creation_penalties (worker_did, actual_spoons, quoted_spoons, reason, severity, created_at)
      VALUES (?, ?, ?, ?, 'major', datetime('now'))
    `).bind(
      data.to_did,
      data.spoons_saved,
      data.spoons_saved + 1,
      'Intent contract delivery failure'
    ));
  }

  await withRetry(() => db.batch(statements));

  return { id, entry_hash: entryHash, prev_hash: prevHash, settlement: { unit: data.settlement_unit, amount: data.amount } };
}
