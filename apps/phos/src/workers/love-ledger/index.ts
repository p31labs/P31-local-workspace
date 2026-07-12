import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';
import { ensureCbs, base as cbsBase, signBlinded as cbsSign, verify as cbsVerify } from './taler-cbs/loader';
import { deriveNonce } from './taler-cbs/kdf';
import { MLDSA } from './taler-cbs/pqc';

// The wasm is imported via ?module in taler-cbs/loader.ts (esbuild
// compiles it at build time — the only Worker-supported way, since
// [wasm_modules] and runtime WebAssembly.instantiate() are both
// blocked for ES-module Workers. See AXIS-1 §6.1.

const GENESIS_HASH = '0'.repeat(64);

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Axis-1 CBS base64 helpers (atob-based, matches verifyReceiptSig style).
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Post-quantum server-side seal (ML-DSA-44 / L1, FIPS 204) over the
// entry hash. L1 (128-bit) is used live because the Workers secret-size
// cap (5.1 kB) cannot hold an L3 (ML-DSA-65) secret key; L1 is
// lattice-based (Shor-resistant) and ample for care-credit integrity.
// Additive: a missing / failed seal returns null and is logged — it never
// breaks the classical Ed25519 receipt path. Any reader holding
// MLDSA_SIGNER_PUBLIC_KEY can verify the seal.
async function signPqcSeal(entryHashHex: string, env: Env): Promise<string | null> {
  try {
    if (!env.MLDSA_SIGNER_PRIVATE_KEY) return null;
    const sk = b64ToBytes(env.MLDSA_SIGNER_PRIVATE_KEY);
    const mldsa = new MLDSA({ securityLevel: 1 });
    const sig = mldsa.sign(new TextEncoder().encode(entryHashHex), sk);
    return bytesToB64(sig);
  } catch (e: any) {
    logEvent({ event: 'pqc_sign_error', service: 'love-ledger', success: false, error: String(e?.message || e) });
    return null;
  }
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
const WRITE_PATHS = new Set(['/transfer', '/stake', '/care-score', '/withdraw', '/family/onboard', '/family/status']);

function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return crypto.subtle.timingSafeEqual(ab, bb);
}

// ── JWT utilities (HS256, Web Crypto) ─────────────────────────────
// Used for passkey → session token flow. Clients authenticate via
// passkey, receive a JWT, and present it as Bearer token on writes.

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function signJWT(payload: Record<string, any>, secret: string, expiresIn = 86400): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresIn })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const data = new TextEncoder().encode(`${header}.${body}`);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return `${header}.${body}.${b64url(sig)}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const data = new TextEncoder().encode(`${header}.${body}`);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), data);
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function authorizeWrite(request: Request, env: Env, didSource: string): Promise<boolean> {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    // 1. Try LOVE_AUTH_SECRET (service token, static)
    if (env.LOVE_AUTH_SECRET && timingSafeEqual(token, env.LOVE_AUTH_SECRET)) return true;
    // 2. Try JWT (passkey session token)
    if (env.PASSKEY_JWT_SECRET) {
      const payload = await verifyJWT(token, env.PASSKEY_JWT_SECRET);
      if (payload?.sub) return true;
    }
    return false;
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
  BLIND_ISSUER_PRIVATE_KEY?: string;
  MLDSA_SIGNER_PRIVATE_KEY?: string;
  MLDSA_SIGNER_PUBLIC_KEY?: string;
  BLIND_MODE?: string;
  ENVIRONMENT?: string;
  PASSKEY_URL?: string;
  PASSKEY_JWT_SECRET?: string;
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

    // ── Passkey auth → JWT session token ────────────────────────────
    // POST /auth/passkey: accepts passkey assertion, verifies via the
    // passkey worker, and issues a JWT for love-ledger write access.
    if (method === 'POST' && url.pathname === '/auth/passkey') {
      if (!env.PASSKEY_URL || !env.PASSKEY_JWT_SECRET) {
        return new Response(JSON.stringify({ error: 'Passkey auth not configured' }), { status: 503 });
      }
      try {
        const body = await request.json() as any;
        const { credentialId, clientDataJSON, authenticatorData, signature } = body;
        if (!credentialId || !clientDataJSON || !authenticatorData || !signature) {
          return new Response(JSON.stringify({ error: 'Missing passkey assertion fields' }), { status: 400 });
        }
        // Verify via passkey worker's auth-finish endpoint
        const passkeyResp = await fetch(`${env.PASSKEY_URL}/api/passkey/auth-finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentialId, clientDataJSON, authenticatorData, signature }),
        });
        const passkeyResult = await passkeyResp.json() as any;
        if (!passkeyResp.ok || !passkeyResult.ok) {
          return new Response(JSON.stringify({ error: 'Passkey verification failed', details: passkeyResult.error }), { status: 401 });
        }
        // Issue JWT with userId as subject
        const jwt = await signJWT({ sub: passkeyResult.userId, auth: 'passkey' }, env.PASSKEY_JWT_SECRET);
        return new Response(JSON.stringify({ ok: true, token: jwt, userId: passkeyResult.userId }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Passkey auth error', details: e.message }), { status: 500 });
      }
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
        const pqcSig = await signPqcSeal(entryHash, env);

        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO love_chain (id, from_did, to_did, amount, type, signature, signature_pqc, prev_hash, entry_hash, created_at)
          VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?, ?, ?)
        `        ).bind(txId, body.from, body.to, body.amount, body.signature ?? null, pqcSig, prevHash, entryHash, ts).run(), 3, 'transfer_insert');

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

    if (method === 'GET' && url.pathname === '/blind-pubkey') {
      try {
        // TEMP DEBUG: surface the real error (remove after CBS smoke).
        if (!env.BLIND_ISSUER_PRIVATE_KEY) {
          return new Response(JSON.stringify({ error: 'CBS issuer not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        await ensureCbs();
        const xBytes = b64ToBytes(env.BLIND_ISSUER_PRIVATE_KEY);
        // Fresh one-time nonce `t` per request. n = clamp(SHA-512(x ‖ t))
        // is recomputed (stateless) from `t` at /blind-sign. R = n·G is
        // published so the client can blind against it. Reusing `t` (same n)
        // across two challenges leaks x, so `t` is single-use (see /blind-sign).
        const t = crypto.getRandomValues(new Uint8Array(32));
        const nBytes = await deriveNonce(xBytes, t);
        const X = cbsBase(xBytes);
        const R = cbsBase(nBytes);
        return new Response(JSON.stringify({
          X: bytesToB64(X),
          R: bytesToB64(R),
          t: bytesToB64(t),
        }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err: any) {
          logEvent({ event: 'blind_pubkey_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
          return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

    if (method === 'POST' && url.pathname === '/blind-sign') {
      try {
        if (!env.BLIND_ISSUER_PRIVATE_KEY) {
          return new Response(JSON.stringify({ error: 'CBS issuer not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const body = await request.json() as { c: string; t: string };
        if (typeof body.c !== 'string' || typeof body.t !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing blinded challenge c or nonce t' }), { status: 400 });
        }
        await ensureCbs();
        const xBytes = b64ToBytes(env.BLIND_ISSUER_PRIVATE_KEY);
        const tBytes = b64ToBytes(body.t);
        // SECURITY: n is derived from (x, t). Reusing the same `t` with two
        // different challenges c yields two signatures under the SAME n, from
        // which x leaks (s1−s2 = (c1−c2)·x). Enforce single-use here, at
        // the sign step — not at /withdraw — so the leak is impossible.
        const tB64 = body.t;
        const existing = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT t FROM cbs_nonce WHERE t = ?'
        ).bind(tB64).first<{ t: string }>(), 3, 'cbs_nonce_select');
        if (existing) {
          logEvent({ event: 'cbs_nonce_reuse', service: 'love-ledger', success: false, data: { t: tB64.slice(0, 16) } });
          return new Response(JSON.stringify({ error: 'Nonce already used' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const nBytes = await deriveNonce(xBytes, tBytes);
        const s = cbsSign(b64ToBytes(body.c), nBytes, xBytes);
        const expires = Date.now() + 86_400_000;
        await withRetry(() => env.LOVE_DB.prepare(
          'INSERT INTO cbs_nonce (t, expires) VALUES (?, ?)'
        ).bind(tB64, expires).run(), 3, 'cbs_nonce_insert');
        // Best-effort TTL sweep of expired nonces (cheap, keeps table small).
        await withRetry(() => env.LOVE_DB.prepare(
          'DELETE FROM cbs_nonce WHERE expires < ?'
        ).bind(Date.now()).run(), 1, 'cbs_nonce_sweep').catch(() => {});
        return new Response(JSON.stringify({ s: bytesToB64(s) }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'blind_sign_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/withdraw') {
      try {
        const body = await request.json() as {
          did: string;
          amount: number;
          msg: string;
          cPrime: string;
          sPrime: string;
          t: string;
          R?: string;
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
        // Axis-1: real Clause Blind Schnorr. Fail-closed — no mint
        // path exists unless BLIND_MODE === 'taler'.
        if (env.BLIND_MODE !== 'taler') {
          return new Response(JSON.stringify({ error: 'FATAL: blind signatures disabled (BLIND_MODE != taler)' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (!env.BLIND_ISSUER_PRIVATE_KEY) {
          return new Response(JSON.stringify({ error: 'CBS issuer not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        await ensureCbs();
        const xBytes = b64ToBytes(env.BLIND_ISSUER_PRIVATE_KEY);
        const X = cbsBase(xBytes);
        // Prefer recomputing R from t (deterministic, server-side). Fall
        // back to client-supplied R for backward compat with old callers.
        let R: Uint8Array;
        if (body.t) {
          const tBytes = b64ToBytes(body.t);
          const nBytes = await deriveNonce(xBytes, tBytes);
          R = cbsBase(nBytes);
        } else if (body.R) {
          R = b64ToBytes(body.R);
        } else {
          return new Response(JSON.stringify({ error: 'Missing t or R' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const valid = cbsVerify(b64ToBytes(body.msg), b64ToBytes(body.cPrime), b64ToBytes(body.sPrime), X, R);
        if (!valid) {
          return new Response(JSON.stringify({ error: 'Invalid blind signature' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        // Axis-1: consume the signing nonce t to prevent reuse. Reusing
        // the same n across two challenges leaks x (s1−s2 = (c1−c2)·x).
        if (body.t) {
          const nonceRow = await withRetry(() => env.LOVE_DB.prepare(
            'SELECT t FROM cbs_nonce WHERE t = ?'
          ).bind(body.t).first<{ t: string }>(), 3, 'cbs_nonce_withdraw_check');
          if (!nonceRow) {
            return new Response(JSON.stringify({ error: 'Unknown or expired nonce' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          // Delete to prevent reuse.
          await withRetry(() => env.LOVE_DB.prepare(
            'DELETE FROM cbs_nonce WHERE t = ?'
          ).bind(body.t).run(), 3, 'cbs_nonce_withdraw_consume');
        }
        // Axis-1 replay protection: each blind-signature coin (c', s') is
        // spent exactly once. Claim c' (PRIMARY KEY) before debiting; a
        // replay is rejected with 409. This is the missing half of
        // replay safety: cbs_nonce guards the signing nonce `t` (x-leak),
        // while this guards the issued token here (double-spend).
        // Legitimate repeats get a fresh t -> fresh coin. D1 `.run()` does
        // not reliably surface `changes` in the Worker runtime, so we probe
        // existence explicitly and rely on the PK violation (caught) to
        // cover the concurrent-replay race.
        const coinExpires = Date.now() + 365 * 86_400_000;
        const prior = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT coin FROM cbs_coin WHERE coin = ?'
        ).bind(body.cPrime).first<{ coin: string }>(), 3, 'cbs_coin_probe');
        if (prior) {
          logEvent({ event: 'cbs_coin_replay', service: 'love-ledger', success: false, data: { did: body.did } });
          return new Response(JSON.stringify({ error: 'Token already spent (replay blocked)' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        try {
          await env.LOVE_DB.prepare(
            'INSERT INTO cbs_coin (coin, did, expires) VALUES (?, ?, ?)'
          ).bind(body.cPrime, body.did, coinExpires).run();
        } catch (claimErr: any) {
          // PRIMARY KEY violation => a concurrent request already spent it.
          logEvent({ event: 'cbs_coin_replay', service: 'love-ledger', success: false, data: { did: body.did }, error: String(claimErr?.message || claimErr) });
          return new Response(JSON.stringify({ error: 'Token already spent (replay blocked)' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        // Best-effort TTL sweep of expired coins (cheap, keeps table small).
        await env.LOVE_DB.prepare(
          'DELETE FROM cbs_coin WHERE expires < ?'
        ).bind(Date.now()).run().catch(() => {});
        // Court-admissible token = (c', s').
        const token = `${body.cPrime}.${body.sPrime}`;
        const entryHash = await sha256(
          [body.did, 'system:love-issuer', String(body.amount), String(ts), prevHash, token].join('|')
        );
        const pqcSig = await signPqcSeal(entryHash, env);

        const chain = env.LOVE_DB.prepare(`
          INSERT INTO love_chain (id, from_did, to_did, amount, type, signature, signature_pqc, prev_hash, entry_hash, created_at)
          VALUES (?, ?, ?, ?, 'love_withdraw', ?, ?, ?, ?, ?)
        `).bind(txId, body.did, 'system:love-issuer', body.amount, token, pqcSig, prevHash, entryHash, ts);

        // Atomic: debit + chain entry commit together (or roll back).
        await env.LOVE_DB.batch([debit, chain]);

        return new Response(JSON.stringify({
          success: true,
          blind_signature: token,
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

    // ── Pilot Registry Routes ──────────────────────────────────────────
    if (method === 'POST' && url.pathname === '/family/onboard') {
      try {
        const body = await request.json() as { did: string; family_name: string; nodes?: string[] };
        if (!body.did || !body.family_name) {
          return new Response(JSON.stringify({ error: 'Missing did or family_name' }), { status: 400 });
        }
        const existing = await env.LOVE_DB.prepare('SELECT did FROM love_accounts WHERE did = ?').bind(body.did).first();
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Account not found. Create LOVE account first.' }), { status: 404 });
        }
        const onboarded_at = Date.now();
        await env.LOVE_DB.prepare(
          'INSERT OR REPLACE INTO pilot_registry (did, family_name, status, onboarded_at, active_nodes) VALUES (?, ?, ?, ?, 0)'
        ).bind(body.did, body.family_name, 'pending', onboarded_at).run();
        if (body.nodes && body.nodes.length) {
          const now = Date.now();
          for (const nodeId of body.nodes) {
            await env.LOVE_DB.prepare(
              'INSERT OR IGNORE INTO node_registry (node_id, family_did, last_seen, firmware_version) VALUES (?, ?, ?, ?)'
            ).bind(nodeId, body.did, now, 'v0.1.0').run();
          }
          await env.LOVE_DB.prepare(
            'UPDATE pilot_registry SET active_nodes = (SELECT COUNT(*) FROM node_registry WHERE family_did = ?) WHERE did = ?'
          ).bind(body.did, body.did).run();
        }
        logEvent({ event: 'family_onboarded', service: 'love-ledger', success: true, did: body.did, family: body.family_name });
        return new Response(JSON.stringify({ success: true, did: body.did, status: 'pending' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'family_onboard_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
      }
    }

    if (method === 'PATCH' && url.pathname.startsWith('/family/') && url.pathname.endsWith('/status')) {
      try {
        if (!await authorizeWrite(request, env, 'did')) {
          logEvent({ event: 'write_auth_fail', service: 'love-ledger', success: false, data: { path: url.pathname } });
          return unauthorizedResponse();
        }
        const parts = url.pathname.split('/');
        const did = parts[2];
        if (!did) {
          return new Response(JSON.stringify({ error: 'Missing DID' }), { status: 400 });
        }
        const body = await request.json() as { status: string };
        if (!body.status || !['pending', 'active', 'completed'].includes(body.status)) {
          return new Response(JSON.stringify({ error: 'Invalid status. Must be pending, active, or completed.' }), { status: 400 });
        }
        await env.LOVE_DB.prepare('UPDATE pilot_registry SET status = ? WHERE did = ?').bind(body.status, did).run();
        logEvent({ event: 'family_status_update', service: 'love-ledger', success: true, did, status: body.status });
        return new Response(JSON.stringify({ success: true, did, status: body.status }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'family_status_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
      }
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
