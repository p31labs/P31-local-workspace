import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';

const GENESIS_HASH = '0'.repeat(64);

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Axis-2 verify side: confirm a creation-accountant receipt signature
// (Ed25519, SPKI public key). Optional — only enforced when the
// caller supplies X-Receipt-Signature.
async function verifyReceiptSig(message: string, sigB64: string, pubB64: string): Promise<boolean> {
  try {
    const pubBin = atob(pubB64);
    const pub = new Uint8Array(pubBin.length);
    for (let i = 0; i < pubBin.length; i++) pub[i] = pubBin.charCodeAt(i);
    const sigBin = atob(sigB64);
    const sig = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) sig[i] = sigBin.charCodeAt(i);
    const key = await crypto.subtle.importKey('spki', pub, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, sig, new TextEncoder().encode(message));
  } catch {
    return false;
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = 'd1_query'): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
      }
    }
  }
  logEvent({ event: `${label}_retry_exhausted`, service: 'love-ledger', success: false, error: String(lastErr) });
  throw lastErr;
}

// ── Write authorization (LOVE_REQUIRE_AUTH fail-closed gate) ──────────
// Writes accept EITHER an Ed25519 did:key signature (end-user wallets — the
// existing verifyRequest path) OR a Bearer <LOVE_AUTH_SECRET> service token
// (trusted internal callers: love-registry MCP, CLI, cron). Reads stay public.
const WRITE_PATHS = new Set(['/transfer', '/stake', '/care-score', '/withdraw']);

function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return crypto.subtle.timingSafeEqual(ab, bb);
}

async function authorizeWrite(request: Request, env: Env, didSource: string): Promise<boolean> {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    if (!env.LOVE_AUTH_SECRET) return false;
    return timingSafeEqual(auth.slice(7), env.LOVE_AUTH_SECRET);
  }
  return verifyRequest(request, didSource);
}

// ── Two-pool / care-score (unified from monolith v1.3.0) ──────────────
// care_score 0–1 modulates liquid (performance-pool) LOVE; sovereignty
// pool is immutable. Earned LOVE is split 50/50; here the split is derived
// from the existing `earned` column so no write-path changes are needed.
const CARE_SCORE_GRACE_DAYS = 7;
const CARE_SCORE_DECAY_PER_DAY = 0.005;
const CARE_SCORE_MIN = 0.1;
const CARE_SCORE_MAX = 1.0;

function computeEffectiveCareScore(stored: number, updatedAtMs: number): number {
  if (!updatedAtMs) return stored;
  const daysSince = (Date.now() - updatedAtMs) / 86_400_000;
  if (daysSince <= CARE_SCORE_GRACE_DAYS) return stored;
  const decay = (daysSince - CARE_SCORE_GRACE_DAYS) * CARE_SCORE_DECAY_PER_DAY;
  return Math.max(CARE_SCORE_MIN, stored - decay);
}

interface RawChainRow {
  id: string; from_did: string; to_did: string; amount: number;
  type: string; signature: string; prev_hash: string; entry_hash: string; created_at: number;
}

// Loads a did's hash chain (sorted by created_at in JS — D1-in-Worker
// ORDER BY on content projections is unreliable), verifies continuity,
// and computes a deterministic root hash over the canonical ordering.
async function loadChain(env: Env, did: string): Promise<{
  chain: Array<{ id: string; from: string; to: string; amount: number; type: string; signature: string; prevHash: string; entryHash: string; timestamp: number }>;
  valid: boolean;
  rootHash: string;
}> {
  const rows = await withRetry(() => env.LOVE_DB.prepare(
    'SELECT id, from_did, to_did, amount, type, signature, prev_hash, entry_hash, created_at FROM love_chain WHERE from_did = ?'
  ).bind(did).all<RawChainRow>(), 3, 'chain_select');

  const chain = (rows.results || []).slice().sort((a, b) => a.created_at - b.created_at).map((r) => ({
    id: r.id,
    from: r.from_did,
    to: r.to_did,
    amount: r.amount,
    type: r.type,
    signature: r.signature,
    prevHash: r.prev_hash,
    entryHash: r.entry_hash,
    timestamp: r.created_at,
  }));

  let valid = true;
  let lastEntryHash = GENESIS_HASH;
  for (const entry of chain) {
    if (entry.prevHash !== lastEntryHash) { valid = false; break; }
    const recomputed = await sha256(
      [entry.from, entry.to, String(entry.amount), String(entry.timestamp), entry.prevHash, entry.signature || ''].join('|')
    );
    if (recomputed !== entry.entryHash) { valid = false; break; }
    lastEntryHash = entry.entryHash;
  }

  const rootHash = await sha256(
    chain.map((e) => [e.id, e.prevHash, e.entryHash, e.from, e.to, e.amount, e.timestamp].join('|')).join('\n')
  );

  return { chain, valid, rootHash };
}

// ── Court-admissible export artifact (Task 4) ────────────────────────
// Produces a portable, self-verifying bundle: the canonical ordered chain,
// continuity flag, and a deterministic root hash over the canonical order.
async function buildCourtArtifact(env: Env, did: string): Promise<{
  did: string; exportedAt: string; count: number; valid: boolean; rootHash: string;
  method: string; genesisHash: string; entries: ReturnType<typeof serializeEntry>[];
  storage?: { json: string; text: string };
}> {
  const { chain, valid, rootHash } = await loadChain(env, did);
  return {
    did,
    exportedAt: new Date().toISOString(),
    count: chain.length,
    valid,
    rootHash,
    method: 'SHA-256(entry = SHA-256(from|to|amount|ts|prevHash|signature)); prevHash links prior entry_hash; genesis = 64×0)',
    genesisHash: GENESIS_HASH,
    entries: chain.map(serializeEntry),
  };
}

function serializeEntry(e: { id: string; from: string; to: string; amount: number; type: string; signature: string; prevHash: string; entryHash: string; timestamp: number }) {
  return {
    id: e.id,
    from: e.from,
    to: e.to,
    amount: e.amount,
    type: e.type,
    signature: e.signature,
    prevHash: e.prevHash,
    entryHash: e.entryHash,
    timestamp: e.timestamp,
    iso: new Date(e.timestamp).toISOString(),
  };
}

function affidavitText(a: { did: string; exportedAt: string; count: number; valid: boolean; rootHash: string; entries: ReturnType<typeof serializeEntry>[] }): string {
  const lines: string[] = [];
  lines.push('P31 LOVE LEDGER — COURT-ADMISSIBLE EXPORT');
  lines.push('DID: ' + a.did);
  lines.push('Exported: ' + a.exportedAt);
  lines.push('Entries: ' + a.count);
  lines.push('Chain valid: ' + a.valid);
  lines.push('Root hash (SHA-256): ' + a.rootHash);
  lines.push('');
  a.entries.forEach((e, i) => {
    lines.push('ENTRY ' + (i + 1));
    lines.push('  id:        ' + e.id);
    lines.push('  from:      ' + e.from);
    lines.push('  to:        ' + e.to);
    lines.push('  amount:    ' + e.amount);
    lines.push('  type:      ' + e.type);
    lines.push('  prevHash:  ' + e.prevHash);
    lines.push('  entryHash: ' + e.entryHash);
    lines.push('  timestamp: ' + e.iso);
    lines.push('');
  });
  return lines.join('\n');
}

export interface Env {
  LOVE_DB: D1Database;
  LOVE_ARCHIVE: R2Bucket;
  LOVE_AUTH_SECRET?: string;
  LOVE_REQUIRE_AUTH?: string;
  RECEIPT_SIGNER_PUBLIC_KEY?: string;
  BLIND_MODE?: string;
  ENVIRONMENT?: string;
}

export class LoveTransactionDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response('Legacy love transaction endpoint — use D1-based API', { status: 410 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // ── Fail-closed write authorization ─────────────────────────────
    // Default-deny: writes require auth unless LOVE_REQUIRE_AUTH === 'false'
    // (explicit opt-out). Missing LOVE_AUTH_SECRET when auth is required
    // returns 503 — never an open write path.
    if (method === 'POST' && WRITE_PATHS.has(url.pathname)) {
      if (env.LOVE_REQUIRE_AUTH !== 'false') {
        if (!env.LOVE_AUTH_SECRET) {
          return new Response(JSON.stringify({ error: 'LOVE_AUTH_SECRET not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const didSource = url.pathname === '/transfer' ? 'from' : 'did';
        if (!await authorizeWrite(request, env, didSource)) {
          logEvent({ event: 'write_auth_fail', service: 'love-ledger', success: false, data: { path: url.pathname } });
          return unauthorizedResponse();
        }
      }
    }

    if (method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'love-ledger', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && url.pathname === '/balance') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });

      const result = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT balance, staked, earned, reputation, care_score, care_score_at FROM love_accounts WHERE did = ?'
      ).bind(did).first<{ balance: number; staked: number; earned: number; reputation: number; care_score: number; care_score_at: number }>(), 3, 'balance_select');

      if (!result) {
        return new Response(JSON.stringify({ did, balance: 0, staked: 0, earned: 0, reputation: 50, careScore: 0.5, sovereigntyPool: 0, performancePool: 0 }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const careScore = computeEffectiveCareScore(result.care_score, result.care_score_at);
      const sovereigntyPool = Math.floor((result.earned || 0) * 0.5);
      const performancePool = (result.earned || 0) - sovereigntyPool;

      return new Response(JSON.stringify({
        did,
        balance: result.balance,
        staked: result.staked,
        earned: result.earned,
        reputation: result.reputation,
        careScore,
        sovereigntyPool,
        performancePool,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/transfer') {
      try {
        const body = await request.json() as {
          from: string;
          to: string;
          amount: number;
          signature: string;
        };

        const fromAccount = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.from).first<{ balance: number }>(), 3, 'transfer_select');

        if (!fromAccount || fromAccount.balance < body.amount) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
        }

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(body.amount, body.from).run(), 3, 'balance_update');

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance + ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(body.amount, body.to).run(), 3, 'balance_update');

        const txId = crypto.randomUUID();
        const ts = Date.now();

        // ── Hash chain (court-admissible integrity) ──────────────────
        // Each did maintains its own SHA-256 chain. prev_hash is the
        // sender's most recent entry_hash (genesis for the first event).
        // Reads avoid ORDER BY (D1-in-Worker binding bug on content
        // projections); chain order is reconstructed in JS by created_at.
        const prevRows = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT entry_hash, created_at FROM love_chain WHERE from_did = ?'
        ).bind(body.from).all<{ entry_hash: string; created_at: number }>(), 3, 'chain_prev');
        let prevHash = GENESIS_HASH;
        let maxTs = -1;
        for (const r of prevRows.results || []) {
          if (r.created_at > maxTs) { maxTs = r.created_at; prevHash = r.entry_hash; }
        }
        const entryHash = await sha256(
          [body.from, body.to, String(body.amount), String(ts), prevHash, body.signature || ''].join('|')
        );

        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO love_chain (id, from_did, to_did, amount, type, signature, prev_hash, entry_hash, created_at)
          VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?, ?)
        `        ).bind(txId, body.from, body.to, body.amount, body.signature ?? null, prevHash, entryHash, ts).run(), 3, 'transfer_insert');

        logEvent({
          event: 'transfer_completed',
          service: 'love-ledger',
          did: body.from,
          success: true,
          data: { txId, to: body.to, amount: body.amount },
        });

        return new Response(JSON.stringify({
          success: true,
          transactionId: txId,
          from: body.from,
          to: body.to,
          amount: body.amount,
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'transfer_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/stake') {
      try {
        const body = await request.json() as {
          did: string;
          contractId: string;
          amount: number;
          signature: string;
        };

        const account = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.did).first<{ balance: number }>(), 3, 'stake_select');

        if (!account || account.balance < body.amount) {
          return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 });
        }

        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, staked = staked + ? WHERE did = ?'
        ).bind(body.amount, body.amount, body.did).run(), 3, 'stake_update');

        const unlockedAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO love_stakes (contract_id, staker_did, amount, unlocked_at, status)
          VALUES (?, ?, ?, ?, 'locked')
        `).bind(body.contractId, body.did, body.amount, unlockedAt).run(), 3, 'stake_insert');

        logEvent({
          event: 'stake_completed',
          service: 'love-ledger',
          did: body.did,
          success: true,
          data: { contractId: body.contractId, amount: body.amount },
        });

        return new Response(JSON.stringify({
          success: true,
          contractId: body.contractId,
          staker: body.did,
          amount: body.amount,
          unlockedAt,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'stake_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'GET' && url.pathname === '/chain') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });

      const { chain, valid, rootHash } = await loadChain(env, did);

      return new Response(JSON.stringify({ did, count: chain.length, valid, rootHash, chain }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && url.pathname === '/care-score') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });
      const row = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT care_score, care_score_at FROM love_accounts WHERE did = ?'
      ).bind(did).first<{ care_score: number; care_score_at: number }>(), 3, 'care_score_select');
      const careScore = computeEffectiveCareScore(row?.care_score ?? 0.5, row?.care_score_at ?? 0);
      return new Response(JSON.stringify({ did, careScore }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST' && url.pathname === '/care-score') {
      try {
        const body = await request.json() as { did: string; careScore: number };
        if (typeof body.careScore !== 'number') {
          return new Response(JSON.stringify({ error: 'Invalid careScore' }), { status: 400 });
        }
        const score = Math.max(CARE_SCORE_MIN, Math.min(CARE_SCORE_MAX, body.careScore));
        const now = Date.now();
        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE love_accounts SET care_score = ?, care_score_at = ? WHERE did = ?'
        ).bind(score, now, body.did).run(), 3, 'care_score_update');
        logEvent({ event: 'care_score_updated', service: 'love-ledger', did: body.did, success: true });
        return new Response(JSON.stringify({ did: body.did, careScore: score, updatedAt: now }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'care_score_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/withdraw') {
      try {
        const body = await request.json() as {
          did: string;
          amount: number;
          blind_secret: string;
        };
        if (typeof body.amount !== 'number' || body.amount <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 });
        }

        const account = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.did).first<{ balance: number }>(), 3, 'withdraw_select');

        if (!account || account.balance < body.amount) {
          return new Response(JSON.stringify({ error: 'Insufficient LOVE balance' }), { status: 402 });
        }

        // Axis-2 (verify side): if the caller supplies a receipt signature,
        // confirm it against the creation-accountant public key.
        const receiptSig = request.headers.get('X-Receipt-Signature');
        if (receiptSig && env.RECEIPT_SIGNER_PUBLIC_KEY) {
          const canonical = [body.did, 'system:love-issuer', String(body.amount)].join('|');
          if (!await verifyReceiptSig(canonical, receiptSig, env.RECEIPT_SIGNER_PUBLIC_KEY)) {
            return new Response(JSON.stringify({ error: 'Invalid receipt signature' }), { status: 401 });
          }
        }

        const debit = env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(body.amount, body.did);

        const txId = crypto.randomUUID();
        const ts = Date.now();

        // Hash chain (court-admissible) — mirrors /transfer.
        const prevRows = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT entry_hash, created_at FROM love_chain WHERE from_did = ?'
        ).bind(body.did).all<{ entry_hash: string; created_at: number }>(), 3, 'withdraw_prev');
        let prevHash = GENESIS_HASH;
        let maxTs = -1;
        for (const r of prevRows.results || []) {
          if (r.created_at > maxTs) { maxTs = r.created_at; prevHash = r.entry_hash; }
        }
        // Axis-1 guard: the current blind signature is a staging-only
        // placeholder. Real GNU Taler Clause Blind Schnorr needs a WASM
        // build; never mint with the mock on production.
        if (env.BLIND_MODE === 'mock' && env.ENVIRONMENT === 'production') {
          return new Response(JSON.stringify({ error: 'FATAL: mock blind signatures disabled in production' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        // TODO: GNU Taler Clause Blind Schnorr issuance (blind_secret).
        const blindSig = `blindsig-${crypto.randomUUID()}`;
        const entryHash = await sha256(
          [body.did, 'system:love-issuer', String(body.amount), String(ts), prevHash, blindSig].join('|')
        );

        const chain = env.LOVE_DB.prepare(`
          INSERT INTO love_chain (id, from_did, to_did, amount, type, signature, prev_hash, entry_hash, created_at)
          VALUES (?, ?, ?, ?, 'love_withdraw', ?, ?, ?, ?)
        `).bind(txId, body.did, 'system:love-issuer', body.amount, blindSig, prevHash, entryHash, ts);

        // Atomic: debit + chain entry commit together (or roll back).
        await env.LOVE_DB.batch([debit, chain]);

        return new Response(JSON.stringify({
          success: true,
          blind_signature: blindSig,
          transactionId: txId,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'withdraw_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'GET' && url.pathname === '/status') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });
      const [bal, chainRes] = await Promise.all([
        withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance, staked, earned, reputation, care_score, care_score_at FROM love_accounts WHERE did = ?'
        ).bind(did).first<{ balance: number; staked: number; earned: number; reputation: number; care_score: number; care_score_at: number }>(), 3, 'status_balance'),
        loadChain(env, did),
      ]);
      const careScore = bal ? computeEffectiveCareScore(bal.care_score, bal.care_score_at) : 0.5;
      const earned = bal?.earned || 0;
      return new Response(JSON.stringify({
        did,
        balance: bal?.balance ?? 0,
        staked: bal?.staked ?? 0,
        earned,
        reputation: bal?.reputation ?? 50,
        careScore,
        sovereigntyPool: Math.floor(earned * 0.5),
        performancePool: earned - Math.floor(earned * 0.5),
        chain: { count: chainRes.chain.length, valid: chainRes.valid, rootHash: chainRes.rootHash },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'GET' && url.pathname === '/export') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });
      const store = url.searchParams.get('store') === '1';
      const artifact = await buildCourtArtifact(env, did);
      if (store) {
        const key = `love-export/${did}/${artifact.exportedAt}.json`;
        await env.LOVE_ARCHIVE.put(key, JSON.stringify(artifact, null, 2), {
          httpMetadata: { contentType: 'application/json' },
          customMetadata: { did, rootHash: artifact.rootHash, valid: String(artifact.valid) },
        });
        const txtKey = `love-export/${did}/${artifact.exportedAt}.txt`;
        await env.LOVE_ARCHIVE.put(txtKey, affidavitText(artifact), {
          httpMetadata: { contentType: 'text/plain' },
          customMetadata: { did, rootHash: artifact.rootHash, valid: String(artifact.valid) },
        });
        artifact.storage = { json: key, text: txtKey };
      }
      return new Response(JSON.stringify(artifact), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not found', { status: 404 });
  },

  // ── Scheduled cold archive (Task 3): snapshot every did's chain to R2 ──
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const date = new Date(event.scheduledTime || Date.now()).toISOString().slice(0, 10);
    const dids = await withRetry(() => env.LOVE_DB.prepare('SELECT DISTINCT from_did FROM love_chain').all<{ from_did: string }>(), 3, 'archive_dids');
    const list = (dids.results || []).map((r) => r.from_did);
    const manifest: Array<{ did: string; count: number; valid: boolean; rootHash: string }> = [];
    await Promise.all(list.map(async (did) => {
      const artifact = await buildCourtArtifact(env, did);
      const jsonKey = `love-archive/${date}/${did}.json`;
      const txtKey = `love-archive/${date}/${did}.txt`;
      await env.LOVE_ARCHIVE.put(jsonKey, JSON.stringify(artifact, null, 2), {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { did, rootHash: artifact.rootHash, valid: String(artifact.valid) },
      });
      await env.LOVE_ARCHIVE.put(txtKey, affidavitText(artifact), {
        httpMetadata: { contentType: 'text/plain' },
        customMetadata: { did, rootHash: artifact.rootHash, valid: String(artifact.valid) },
      });
      manifest.push({ did, count: artifact.count, valid: artifact.valid, rootHash: artifact.rootHash });
    }));
    await env.LOVE_ARCHIVE.put(`love-archive/${date}/manifest.json`, JSON.stringify({ date, exportedAt: new Date().toISOString(), count: manifest.length, entries: manifest }, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });
    logEvent({ event: 'archive_completed', service: 'love-ledger', success: true, data: { date, dids: manifest.length } });
  }
};
