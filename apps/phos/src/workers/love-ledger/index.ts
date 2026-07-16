import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';
import { ensureCbs, base as cbsBase, signBlinded as cbsSign, verify as cbsVerify } from './taler-cbs/loader';
import { deriveNonce } from './taler-cbs/kdf';
import { MLKEM, MLDSA } from './taler-cbs/pqc';

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

/** Ensure genesis_state table exists (CWP-2026-052 — Reunion Protocol). */
async function ensureGenesisState(env: Env): Promise<void> {
  await env.LOVE_DB.prepare(
    `CREATE TABLE IF NOT EXISTS genesis_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      unlocked INTEGER DEFAULT 0,
      timestamp INTEGER,
      did TEXT,
      entry_hash TEXT,
      tx_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  // Seed locked state if row doesn't exist
  await env.LOVE_DB.prepare(
    'INSERT OR IGNORE INTO genesis_state (id, unlocked) VALUES (1, 0)'
  ).run();
}

/**
 * Anchor a court-admissible ledger entry on-chain via the ledger-bridge.
 *
 * The love-ledger entry_hash is a 64-char hex string WITHOUT 0x prefix.
 * P31TransparencyAnchor.anchor() requires a 0x-prefixed bytes32, so we prefix it.
 * The URI points at the verifiable hash-chain manifest for that DID — anyone
 * can fetch it and confirm the entry existed at the anchored block time.
 *
 * Fire-and-forget: failures are swallowed (best-effort anchoring). The D1 insert
 * is the source of truth; on-chain anchoring is the verifiable witness.
 */
async function anchorOnChain(entryHash: string, did: string, bridgeUrl?: string): Promise<void> {
  if (!bridgeUrl) return;
  const uri = `https://love-ledger.p31ca.org/chain?did=${encodeURIComponent(did)}`;
  try {
    await fetch(`${bridgeUrl}/anchor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryHash: `0x${entryHash}`, uri }),
    });
  } catch {
    // Non-blocking: on-chain anchoring is best-effort.
  }
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

// ── AES-256-GCM (Web Crypto) — symmetric layer under an ML-KEM shared secret ──
// ML-KEM only establishes a 32-byte shared secret; we use it as the AES-GCM
// key to encrypt the (potentially large) contract terms.
async function aesGcmEncrypt(plain: Uint8Array, key: Uint8Array): Promise<{ iv: Uint8Array; ct: Uint8Array }> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plain));
  return { iv, ct };
}

async function aesGcmDecrypt(iv: Uint8Array, ct: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ct));
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
const WRITE_PATHS = new Set(['/transfer', '/stake', '/care-score', '/withdraw', '/family/onboard', '/family/status', '/llm/reserve', '/llm/settle', '/contract/keygen', '/contract/propose', '/contract/activate', '/arcade/score', '/arcade/achievement']);

function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return crypto.subtle.timingSafeEqual(ab, bb);
}

// LOVE_AUTH_SECRET may be a plain string (legacy `wrangler secret put`) or a
// Cloudflare Secrets Store binding (`{ get(): Promise<string> }`). Resolve
// either shape to the bare secret string. Centralised in the `p31-secrets`
// store (store-id 33d48162fd6842869beeed3516e2909c) so a single rotation
// propagates to every bound Worker.
async function resolveLoveSecret(env: Env): Promise<string | undefined> {
  const s = env.LOVE_AUTH_SECRET;
  if (!s) return undefined;
  if (typeof (s as any).get === 'function') return (await (s as any).get()) as string;
  return s as string;
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
    const loveSecret = await resolveLoveSecret(env);
    if (loveSecret && timingSafeEqual(token, loveSecret)) return true;
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
  LOVE_AUTH_SECRET?: any;
  LOVE_REQUIRE_AUTH?: string;
  RECEIPT_SIGNER_PUBLIC_KEY?: string;
  BLIND_ISSUER_PRIVATE_KEY?: string;
  MLDSA_SIGNER_PRIVATE_KEY?: string;
  MLDSA_SIGNER_PUBLIC_KEY?: string;
  BLIND_MODE?: string;
  ENVIRONMENT?: string;
  PASSKEY_URL?: string;
  PASSKEY_JWT_SECRET?: string;
  BRIDGE_URL?: string;
}

export class LoveTransactionDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response('Legacy love transaction endpoint — use D1-based API', { status: 410 });
  }
}

// ── Identity registry helpers (CWP-2026-025) ──────────────────────────
// did:key encoding matches apps/phos/src/lib/crypto.ts:
//   did = `did:key:z${base64url(standardBase64(rawPubkey))}`
function jsonResp(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function b64UrlDecodeBytes(s: string): Uint8Array {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function didToEd25519Pub(did: string): Uint8Array | null {
  if (!did.startsWith('did:key:z')) return null;
  try { return b64UrlDecodeBytes(did.slice('did:key:z'.length)); } catch { return null; }
}

// Canonical registration payload — client and server must build identically.
function buildRegisterMessage(did: string, ed25519Pub: string, mldsa65Pub: string, ethAddress: string): string {
  return `${did}|${ed25519Pub}|${mldsa65Pub}|${ethAddress}`;
}

// Verify an Ed25519 (or P-256 fallback) signature over a UTF-8 message.
async function verifyDidSignature(message: string, sigB64: string, pubBytes: Uint8Array): Promise<boolean> {
  try {
    const alg = pubBytes.byteLength === 32 ? 'Ed25519' : 'ECDSA';
    const namedCurve = alg === 'Ed25519' ? undefined : 'P-256';
    const key = await crypto.subtle.importKey('raw', pubBytes, { name: alg, namedCurve } as any, false, ['verify']);
    return await crypto.subtle.verify({ name: alg, namedCurve } as any, key, b64ToBytes(sigB64), new TextEncoder().encode(message));
  } catch { return false; }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      const checks: Record<string, { ok: boolean; latency_ms?: number }> = {};
      let allOk = true;
      const d1Start = Date.now();
      try {
        await env.LOVE_DB.prepare('SELECT 1').first();
        checks.d1 = { ok: true, latency_ms: Date.now() - d1Start };
      } catch {
        checks.d1 = { ok: false };
        allOk = false;
      }
      try {
        await env.LOVE_ARCHIVE.head('health-check');
        checks.r2 = { ok: true };
      } catch {
        checks.r2 = { ok: false };
      }
      return new Response(JSON.stringify({
        ok: allOk,
        surface: 'love-ledger',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        status: allOk ? 'operational' : 'degraded',
        checks,
      }), {
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

        // Anchor the court-admissible entry on-chain (fire-and-forget).
        ctx.waitUntil(anchorOnChain(entryHash, body.to, env.BRIDGE_URL));

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

        // Anchor the court-admissible entry on-chain (fire-and-forget).
        ctx.waitUntil(anchorOnChain(entryHash, body.did, env.BRIDGE_URL));

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

    // ── Phase 4 (CWP-2026-013): LLM Usage Meter — Reserve & Refund ──
    // 1 LOVE = 1000 tokens. A caller reserves the max LOVE for a GLM call
    // upfront (atomic check + debit). After the call, settle() refunds the
    // unspent difference. This turns GLM-4.7-Flash into a self-funding
    // revenue engine (12–83× margin) instead of a P31 cost sink.

    if (method === 'POST' && url.pathname === '/llm/reserve') {
      try {
        const body = await request.json() as { did: string; max_tokens: number; model?: string };
        if (!body.did || typeof body.max_tokens !== 'number' || body.max_tokens <= 0) {
          return new Response(JSON.stringify({ error: 'Invalid did or max_tokens' }), { status: 400 });
        }
        const reservedLove = body.max_tokens / 1000; // 1 LOVE = 1000 tokens
        const model = body.model || 'glm-4.7-flash';

        const account = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT balance FROM love_accounts WHERE did = ?'
        ).bind(body.did).first<{ balance: number }>(), 3, 'llm_reserve_select');

        if (!account || account.balance < reservedLove) {
          return new Response(JSON.stringify({
            error: 'Insufficient LOVE balance',
            required_love: reservedLove,
            balance: account?.balance ?? 0,
          }), { status: 402, headers: { 'Content-Type': 'application/json' } });
        }

        const reservationId = crypto.randomUUID();
        const ts = Date.now();
        const debit = env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance - ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(reservedLove, body.did);
        const insert = env.LOVE_DB.prepare(`
          INSERT INTO llm_usage (id, did, model, reservation_id, reserved_love, actual_love, max_tokens, actual_tokens, refunded_love, status, created_at, settled_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0, 'reserved', ?, NULL)
        `).bind(reservationId, body.did, model, reservationId, reservedLove, body.max_tokens, ts);

        // Atomic: debit + reservation row commit together (or roll back).
        await env.LOVE_DB.batch([debit, insert]);

        logEvent({
          event: 'llm_reserve',
          service: 'love-ledger',
          did: body.did,
          success: true,
          data: { reservationId, reservedLove, maxTokens: body.max_tokens, model },
        });

        return new Response(JSON.stringify({
          success: true,
          reservation_id: reservationId,
          reserved_love: reservedLove,
          max_tokens: body.max_tokens,
          model,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'llm_reserve_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/llm/settle') {
      try {
        const body = await request.json() as { did: string; reservation_id: string; actual_tokens: number; model?: string };
        if (!body.did || !body.reservation_id || typeof body.actual_tokens !== 'number' || body.actual_tokens < 0) {
          return new Response(JSON.stringify({ error: 'Invalid settle request' }), { status: 400 });
        }
        const row = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT reserved_love, status FROM llm_usage WHERE reservation_id = ? AND did = ?'
        ).bind(body.reservation_id, body.did).first<{ reserved_love: number; status: string }>(), 3, 'llm_settle_select');

        if (!row) return new Response(JSON.stringify({ error: 'Unknown reservation' }), { status: 404 });
        if (row.status === 'settled') return new Response(JSON.stringify({ error: 'Already settled' }), { status: 409 });

        const actualLove = body.actual_tokens / 1000;
        const refundedLove = Math.max(0, row.reserved_love - actualLove);
        const ts = Date.now();

        const refund = env.LOVE_DB.prepare(
          'UPDATE love_accounts SET balance = balance + ?, updated_at = datetime("now") WHERE did = ?'
        ).bind(refundedLove, body.did);
        const update = env.LOVE_DB.prepare(`
          UPDATE llm_usage SET status = 'settled', actual_love = ?, actual_tokens = ?, refunded_love = ?, settled_at = ?
          WHERE reservation_id = ? AND did = ?
        `).bind(actualLove, body.actual_tokens, refundedLove, ts, body.reservation_id, body.did);

        // Atomic: refund + settle row update commit together.
        await env.LOVE_DB.batch([refund, update]);

        logEvent({
          event: 'llm_settle',
          service: 'love-ledger',
          did: body.did,
          success: true,
          data: { reservationId: body.reservation_id, actualLove, refundedLove },
        });

        return new Response(JSON.stringify({
          success: true,
          actual_love: actualLove,
          refunded_love: refundedLove,
          charged_love: actualLove,
          actual_tokens: body.actual_tokens,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'llm_settle_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'GET' && url.pathname === '/llm/usage') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
      const rows = await withRetry(() => env.LOVE_DB.prepare(
        `SELECT reservation_id, did, model, reserved_love, actual_love, max_tokens, actual_tokens, refunded_love, status, created_at, settled_at
         FROM llm_usage WHERE did = ? ORDER BY created_at DESC LIMIT ?`
      ).bind(did, limit).all(), 3, 'llm_usage_select');
      return new Response(JSON.stringify({ did, count: (rows.results || []).length, entries: rows.results || [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── PQC Care Contracts (CWP-2026-014) ──────────────────────────────────
    // ML-KEM-768 encrypted terms + ML-DSA-44 ledger seal. Author encrypts the
    // plaintext `terms` to the counterparty's ML-KEM public key; only the
    // counterparty (holding the ML-KEM private key) can decrypt. The ledger
    // attests integrity with its server-side ML-DSA-44 seal over entry_hash.

    if (method === 'POST' && url.pathname === '/contract/keygen') {
      try {
        const body = await request.json() as { did: string };
        if (!body.did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });

        const existing = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT kem_public_key, dsa_public_key FROM contract_keys WHERE did = ?'
        ).bind(body.did).first<{ kem_public_key: string; dsa_public_key: string }>(), 3, 'ck_select');

        if (existing) {
          // Key already exists — never re-disclose the private key.
          return new Response(JSON.stringify({
            did: body.did,
            generated: false,
            kem_public_key: existing.kem_public_key,
            dsa_public_key: existing.dsa_public_key,
          }), { headers: { 'Content-Type': 'application/json' } });
        }

        const kem = new MLKEM({ securityLevel: 3 }).keygen();   // ML-KEM-768
        const dsa = new MLDSA({ securityLevel: 1 }).keygen();   // ML-DSA-44 (L1: fits 5.1 kB secret cap)
        const now = Date.now();
        await withRetry(() => env.LOVE_DB.prepare(
          'INSERT INTO contract_keys (did, kem_public_key, dsa_public_key, created_at) VALUES (?, ?, ?, ?)'
        ).bind(body.did, bytesToB64(kem.publicKey), bytesToB64(dsa.publicKey), now).run(), 3, 'ck_insert');

        logEvent({ event: 'contract_keygen', service: 'love-ledger', did: body.did, success: true });
        return new Response(JSON.stringify({
          did: body.did,
          generated: true,
          kem_public_key: bytesToB64(kem.publicKey),
          kem_private_key: bytesToB64(kem.secretKey),
          dsa_public_key: bytesToB64(dsa.publicKey),
          dsa_private_key: bytesToB64(dsa.secretKey),
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'contract_keygen_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
          return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

    // ── Sovereign identity registry (CWP-2026-025) ──────────────────────
    // Self-signed registration: the client proves control of its Ed25519 DID
    // by signing the registration payload. No server secret required.
    if (method === 'POST' && url.pathname === '/identity/register') {
      try {
        const b = await request.json() as {
          did?: string; ed25519_pub?: string; mldsa65_pub?: string;
          eth_address?: string; signature?: string;
        };
        if (!b.did || !b.ed25519_pub || !b.eth_address || !b.signature) {
          return jsonResp({ error: 'Missing did, ed25519_pub, eth_address, or signature' }, 400);
        }
        if (!/^0x[0-9a-fA-F]{40}$/.test(b.eth_address)) {
          return jsonResp({ error: 'Invalid eth_address' }, 400);
        }
        const pubBytes = didToEd25519Pub(b.did);
        if (!pubBytes || pubBytes.byteLength !== 32) {
          return jsonResp({ error: 'did must encode a 32-byte Ed25519 key' }, 400);
        }
        // Sanity: body ed25519_pub must match the did-derived key.
        if (bytesToB64(pubBytes) !== b.ed25519_pub) {
          return jsonResp({ error: 'ed25519_pub does not match did' }, 400);
        }
        const msg = buildRegisterMessage(b.did, b.ed25519_pub, b.mldsa65_pub ?? '', b.eth_address);
        if (!await verifyDidSignature(msg, b.signature, pubBytes)) {
          return jsonResp({ error: 'Invalid signature — DID control not proven' }, 401);
        }
        const now = Date.now();
        await withRetry(() => env.LOVE_DB.prepare(
          `INSERT INTO identity_registry (did, ed25519_pub, mldsa65_pub, eth_address, registered_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(did) DO UPDATE SET
             ed25519_pub=excluded.ed25519_pub,
             mldsa65_pub=excluded.mldsa65_pub,
             eth_address=excluded.eth_address,
             updated_at=excluded.updated_at`
        ).bind(b.did, b.ed25519_pub, b.mldsa65_pub ?? null, b.eth_address, now, now).run(), 3, 'ir_upsert');
        logEvent({ event: 'identity_register', service: 'love-ledger', did: b.did, success: true });
        return jsonResp({ ok: true, did: b.did, eth_address: b.eth_address });
      } catch (err: any) {
        logEvent({ event: 'identity_register_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return jsonResp({ error: 'Internal server error' }, 500);
      }
    }

    if (method === 'GET' && url.pathname === '/identity/lookup') {
      const did = url.searchParams.get('did');
      if (!did) return jsonResp({ error: 'Missing did' }, 400);
      const row = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT did, ed25519_pub, mldsa65_pub, eth_address, registered_at, updated_at FROM identity_registry WHERE did = ?'
      ).bind(did).first<{
        did: string; ed25519_pub: string; mldsa65_pub: string | null;
        eth_address: string; registered_at: number; updated_at: number;
      }>(), 3, 'ir_lookup');
      if (!row) return jsonResp({ error: 'Not found' }, 404);
      return jsonResp(row);
    }

    if (method === 'POST' && url.pathname === '/identity/verify') {
      try {
        const b = await request.json() as {
          did?: string; message?: string; ed25519Sig?: string; mldsa65Sig?: string;
        };
        if (!b.did || !b.message || !b.ed25519Sig) {
          return jsonResp({ error: 'Missing did, message, or ed25519Sig' }, 400);
        }
        const row = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT ed25519_pub, mldsa65_pub FROM identity_registry WHERE did = ?'
        ).bind(b.did).first<{ ed25519_pub: string; mldsa65_pub: string | null }>(), 3, 'ir_vlookup');
        if (!row) return jsonResp({ error: 'Unknown did' }, 404);
        const pubBytes = didToEd25519Pub(b.did);
        const validEd25519 = pubBytes ? await verifyDidSignature(b.message, b.ed25519Sig, pubBytes) : false;
        let validMldsa65 = false;
        if (b.mldsa65Sig && row.mldsa65_pub) {
          try {
            const mldsa = new MLDSA({ securityLevel: 3 });
            validMldsa65 = mldsa.verify(new TextEncoder().encode(b.message), b64ToBytes(b.mldsa65Sig), b64ToBytes(row.mldsa65_pub));
          } catch { validMldsa65 = false; }
        }
        return jsonResp({ validEd25519, validMldsa65 });
      } catch (err: any) {
        return jsonResp({ error: 'Internal server error' }, 500);
      }
    }

    if (method === 'POST' && url.pathname === '/contract/propose') {
      try {
        const body = await request.json() as { author_did: string; counterparty_did: string; title: string; terms: any };
        if (!body.author_did || !body.counterparty_did || !body.title || body.terms === undefined) {
          return new Response(JSON.stringify({ error: 'Missing author_did, counterparty_did, title, or terms' }), { status: 400 });
        }
        const cpk = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT kem_public_key FROM contract_keys WHERE did = ?'
        ).bind(body.counterparty_did).first<{ kem_public_key: string }>(), 3, 'ck_cp_select');
        if (!cpk) {
          return new Response(JSON.stringify({ error: 'Counterparty has no contract key — call /contract/keygen first' }), { status: 400 });
        }

        const termsJson = JSON.stringify(body.terms);
        const termsBytes = new TextEncoder().encode(termsJson);
        const termsHash = await sha256(termsJson);

        // ML-KEM-768 encapsulate → 32-byte shared secret; AES-256-GCM encrypt terms.
        const { cipherText, sharedSecret } = new MLKEM({ securityLevel: 3 }).encapsulate(b64ToBytes(cpk.kem_public_key));
        const { iv, ct } = await aesGcmEncrypt(termsBytes, sharedSecret);
        const encryptedTerms = bytesToB64(new TextEncoder().encode(JSON.stringify({
          iv: bytesToB64(iv), ct: bytesToB64(ct),
        })));
        const kemCipherB64 = bytesToB64(cipherText);

        const id = crypto.randomUUID();
        const ts = Date.now();
        const entryHash = await sha256(
          [id, body.author_did, body.counterparty_did, body.title, termsHash, kemCipherB64, String(ts)].join('|')
        );
        const pqcSeal = await signPqcSeal(entryHash, env);

        await withRetry(() => env.LOVE_DB.prepare(`
          INSERT INTO care_contracts (id, author_did, counterparty_did, title, terms_hash, encrypted_terms, kem_ciphertext, pqc_seal, entry_hash, status, created_at, activated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, NULL)
        `).bind(id, body.author_did, body.counterparty_did, body.title, termsHash, encryptedTerms, kemCipherB64, pqcSeal, entryHash, ts).run(), 3, 'cc_insert');

        logEvent({ event: 'contract_propose', service: 'love-ledger', did: body.author_did, success: true, data: { id, counterparty: body.counterparty_did } });
        return new Response(JSON.stringify({
          id,
          status: 'proposed',
          title: body.title,
          author_did: body.author_did,
          counterparty_did: body.counterparty_did,
          terms_hash: termsHash,
          kem_ciphertext: kemCipherB64,
          pqc_seal: pqcSeal,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'contract_propose_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'POST' && url.pathname === '/contract/activate') {
      try {
        const body = await request.json() as { did: string; id: string; kem_private_key: string };
        if (!body.did || !body.id || !body.kem_private_key) {
          return new Response(JSON.stringify({ error: 'Missing did, id, or kem_private_key' }), { status: 400 });
        }
        const row = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT author_did, counterparty_did, title, terms_hash, encrypted_terms, kem_ciphertext, status FROM care_contracts WHERE id = ?'
        ).bind(body.id).first<{ author_did: string; counterparty_did: string; title: string; terms_hash: string; encrypted_terms: string; kem_ciphertext: string; status: string }>(), 3, 'cc_select');
        if (!row) return new Response(JSON.stringify({ error: 'Unknown contract' }), { status: 404 });
        if (row.counterparty_did !== body.did) {
          return new Response(JSON.stringify({ error: 'Only the counterparty can activate this contract' }), { status: 403 });
        }
        if (row.status !== 'proposed') {
          return new Response(JSON.stringify({ error: `Contract already ${row.status}` }), { status: 409 });
        }

        // Decapsulate with the counterparty's ML-KEM private key → shared secret → decrypt terms.
        const sharedSecret = new MLKEM({ securityLevel: 3 }).decapsulate(b64ToBytes(row.kem_ciphertext), b64ToBytes(body.kem_private_key));
        const envelope = JSON.parse(new TextDecoder().decode(b64ToBytes(row.encrypted_terms)));
        const termsBytes = await aesGcmDecrypt(b64ToBytes(envelope.iv), b64ToBytes(envelope.ct), sharedSecret);
        const termsJson = new TextDecoder().decode(termsBytes);
        const recomputed = await sha256(termsJson);
        if (recomputed !== row.terms_hash) {
          return new Response(JSON.stringify({ error: 'Terms hash mismatch — tampered or wrong key' }), { status: 422 });
        }

        const now = Date.now();
        await withRetry(() => env.LOVE_DB.prepare(
          'UPDATE care_contracts SET status = ?, activated_at = ? WHERE id = ?'
        ).bind('active', now, body.id).run(), 3, 'cc_activate');

        logEvent({ event: 'contract_activate', service: 'love-ledger', did: body.did, success: true, data: { id: body.id } });
        return new Response(JSON.stringify({
          id: body.id,
          status: 'active',
          title: row.title,
          terms: JSON.parse(termsJson),
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'contract_activate_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (method === 'GET' && url.pathname.startsWith('/contract/') && url.pathname.split('/').length === 3) {
      const id = url.pathname.split('/')[2];
      const row = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT id, author_did, counterparty_did, title, terms_hash, encrypted_terms, kem_ciphertext, pqc_seal, entry_hash, status, created_at, activated_at FROM care_contracts WHERE id = ?'
      ).bind(id).first<any>(), 3, 'cc_get');
      if (!row) return new Response(JSON.stringify({ error: 'Unknown contract' }), { status: 404 });
      // Never return plaintext terms — only the holder of the counterparty ML-KEM
      // private key can decrypt. Clients verify integrity via terms_hash + pqc_seal.
      return new Response(JSON.stringify({
        id: row.id,
        author_did: row.author_did,
        counterparty_did: row.counterparty_did,
        title: row.title,
        terms_hash: row.terms_hash,
        encrypted_terms: row.encrypted_terms,
        kem_ciphertext: row.kem_ciphertext,
        pqc_seal: row.pqc_seal,
        entry_hash: row.entry_hash,
        status: row.status,
        created_at: row.created_at,
        activated_at: row.activated_at,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'GET' && url.pathname === '/contracts') {
      const did = url.searchParams.get('did');
      if (!did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400 });
      const rows = await withRetry(() => env.LOVE_DB.prepare(
        'SELECT id, author_did, counterparty_did, title, status, created_at, pqc_seal FROM care_contracts WHERE author_did = ? OR counterparty_did = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(did, did).all<any>(), 3, 'cc_list');
      return new Response(JSON.stringify({ did, count: (rows.results || []).length, contracts: rows.results || [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Genesis activation: GET /genesis/status ────────────────────────────
    if (method === 'GET' && url.pathname === '/genesis/status') {
      try {
        await ensureGenesisState(env);
        const row = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT unlocked, timestamp, did, entry_hash, tx_hash FROM genesis_state WHERE id = 1'
        ).first<any>(), 3, 'genesis_status');
        return new Response(JSON.stringify({
          unlocked: row?.unlocked === 1,
          timestamp: row?.timestamp || null,
          did: row?.did || null,
          entry_hash: row?.entry_hash || null,
          tx_hash: row?.tx_hash || null,
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (err: any) {
        logEvent({ event: 'genesis_status_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // ── Genesis activation: POST /genesis/unlock ───────────────────────────
    if (method === 'POST' && url.pathname === '/genesis/unlock') {
      try {
        await ensureGenesisState(env);
        const body = await request.json() as { did: string; entry_hash?: string; tx_hash?: string };
        if (!body.did) return new Response(JSON.stringify({ error: 'Missing did' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        // Check if already unlocked
        const existing = await withRetry(() => env.LOVE_DB.prepare(
          'SELECT unlocked FROM genesis_state WHERE id = 1'
        ).first<any>(), 3, 'genesis_check');
        if (existing?.unlocked === 1) {
          return new Response(JSON.stringify({ ok: true, already_unlocked: true, timestamp: existing.timestamp }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const now = Date.now();
        await withRetry(() => env.LOVE_DB.prepare(
          'INSERT OR REPLACE INTO genesis_state (id, unlocked, timestamp, did, entry_hash, tx_hash) VALUES (1, 1, ?, ?, ?, ?)'
        ).bind(now, body.did, body.entry_hash || null, body.tx_hash || null).run(), 3, 'genesis_unlock');

        logEvent({ event: 'genesis_unlocked', service: 'love-ledger', did: body.did, success: true, data: { entry_hash: body.entry_hash, tx_hash: body.tx_hash } });
        return new Response(JSON.stringify({ ok: true, unlocked: true, timestamp: now, did: body.did }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        logEvent({ event: 'genesis_unlock_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // ── Arcade Score (CWP-2026-053) ──────────────────────────────────────────
    if (method === 'POST' && url.pathname === '/arcade/score') {
      try {
        const body = await request.json() as {
          did?: string; game_id?: string; score?: number; signature?: string;
        };
        if (!body.did || !body.game_id || typeof body.score !== 'number' || !body.signature) {
          return jsonResp({ error: 'Missing did, game_id, score, or signature' }, 400);
        }

        const pubBytes = didToEd25519Pub(body.did);
        if (!pubBytes || pubBytes.byteLength !== 32) {
          return jsonResp({ error: 'Invalid did' }, 400);
        }

        const msg = `arcade|${body.did}|${body.game_id}|${body.score}`;
        if (!await verifyDidSignature(msg, body.signature, pubBytes)) {
          return jsonResp({ error: 'Invalid signature — DID control not proven' }, 401);
        }

        const gameLimits: Record<string, { min: number; max: number }> = {
          bashball: { min: 0, max: 99 }, smallball: { min: 0, max: 999 },
          gridiron: { min: 0, max: 84 }, cards: { min: 0, max: 999 },
          strategy: { min: 0, max: 999 }, liquid: { min: 0, max: 999 },
          orbital: { min: 0, max: 999 }, poetry: { min: 0, max: 999 },
          resonance: { min: 0, max: 999 },
        };
        const limits = gameLimits[body.game_id] || { min: 0, max: 99999 };
        if (body.score < limits.min || body.score > limits.max) {
          return jsonResp({ error: `Score out of range for ${body.game_id}` }, 400);
        }

        const credits = Math.max(1, Math.floor(body.score / 100));
        const now = Date.now();
        const did = body.did;
        const gameId = body.game_id;
        const score = body.score;

        await withRetry(async () => {
          await env.LOVE_DB.prepare(
            'INSERT INTO arcade_scores (did, game_id, score, credits_earned, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(did, gameId, score, credits, now).run();

          await env.LOVE_DB.prepare(
            'UPDATE love_accounts SET balance = balance + ? WHERE did = ?'
          ).bind(credits, did).run();

          const careWeight = 0.01;
          const current = await env.LOVE_DB.prepare(
            'SELECT care_score FROM love_accounts WHERE did = ?'
          ).bind(did).first() as { care_score: number } | null;
          const currentScore = current?.care_score ?? 0.5;
          const newScore = Math.min(1, currentScore + careWeight * credits);
          await env.LOVE_DB.prepare(
            'UPDATE love_accounts SET care_score = ?, care_score_at = ? WHERE did = ?'
          ).bind(newScore, now, did).run();
        }, 3, 'arcade_score');

        const balance = await env.LOVE_DB.prepare(
          'SELECT balance, care_score FROM love_accounts WHERE did = ?'
        ).bind(did).first() as { balance: number; care_score: number } | null;

        logEvent({ event: 'arcade_score', service: 'love-ledger', did, game_id: gameId, score, credits, success: true });
        return jsonResp({
          ok: true, did, game_id: gameId, score,
          credits_earned: credits,
          new_balance: balance?.balance ?? 0,
          new_care_score: balance?.care_score ?? 0.5,
        });
      } catch (err: any) {
        logEvent({ event: 'arcade_score_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return jsonResp({ error: 'Internal server error' }, 500);
      }
    }

    if (method === 'GET' && url.pathname === '/arcade/leaderboard') {
      const gameId = url.searchParams.get('game');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      try {
        const rows = await withRetry(() =>
          env.LOVE_DB.prepare(
            'SELECT did, game_id, score, credits_earned, created_at FROM arcade_scores WHERE game_id = ? OR ? IS NULL ORDER BY score DESC LIMIT ?'
          ).bind(gameId, gameId, limit).all()
        , 3, 'arcade_leaderboard');
        return jsonResp({ game: gameId, scores: rows.results || [] });
      } catch (err: any) {
        logEvent({ event: 'arcade_leaderboard_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return jsonResp({ error: 'Internal server error' }, 500);
      }
    }

    if (method === 'GET' && url.pathname === '/arcade/scores') {
      const did = url.searchParams.get('did');
      const gameId = url.searchParams.get('game');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      if (!did) return jsonResp({ error: 'did required' }, 400);
      try {
        const rows = await withRetry(() =>
          env.LOVE_DB.prepare(
            'SELECT id, game_id, score, credits_earned, created_at FROM arcade_scores WHERE did = ? AND (game_id = ? OR ? IS NULL) ORDER BY created_at DESC LIMIT ?'
          ).bind(did, gameId, gameId, limit).all()
        , 3, 'arcade_scores_history');
        return jsonResp({ did, scores: rows.results || [] });
      } catch (err: any) {
        logEvent({ event: 'arcade_scores_history_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return jsonResp({ error: 'Internal server error' }, 500);
      }
    }

    // ── Arcade Achievement — ML-DSA-65 SD-JWT VC (CWP-2026-053 Phase 6) ────
    if (method === 'POST' && url.pathname === '/arcade/achievement') {
      try {
        const body = await request.json() as { did?: string; game_id?: string; signature?: string };
        if (!body.did || !body.game_id || !body.signature) {
          return jsonResp({ error: 'Missing did, game_id, or signature' }, 400);
        }

        const pubBytes = didToEd25519Pub(body.did);
        if (!pubBytes || pubBytes.byteLength !== 32) {
          return jsonResp({ error: 'Invalid did' }, 400);
        }
        const msg = `achievement|${body.did}|${body.game_id}`;
        if (!await verifyDidSignature(msg, body.signature, pubBytes)) {
          return jsonResp({ error: 'Invalid signature' }, 401);
        }

        const row = await withRetry(() =>
          env.LOVE_DB.prepare(
            'SELECT score, credits_earned, created_at FROM arcade_scores WHERE did = ? AND game_id = ? ORDER BY score DESC LIMIT 1'
          ).bind(body.did, body.game_id).first()
        , 3, 'arcade_achievement_check');
        if (!row) return jsonResp({ error: 'No score found' }, 404);
        const score = (row as any).score as number;
        if (score < 500) return jsonResp({ error: 'Score does not qualify (min 500)' }, 400);

        const bridgeUrl = env.BRIDGE_URL || 'https://ledger-bridge.trimtab-signal.workers.dev';
        const credRes = await fetch(`${bridgeUrl}/credential/issue`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            did: body.did,
            claims: {
              vct: 'https://p31ca.org/credential-types/arcade-achievement/v1',
              game: body.game_id, score,
              achieved_at: new Date().toISOString(),
            },
            post_quantum: true,
          }),
        });
        if (!credRes.ok) {
          return jsonResp({ error: `ledger-bridge issuance failed: ${await credRes.text()}` }, 502);
        }
        const cred = await credRes.json();
        return jsonResp({
          ok: true, did: body.did, game_id: body.game_id, score,
          sdjwt: cred.sdjwt, algorithm: 'ML-DSA-65',
          note: 'Verifiable achievement — present to prove your high score.',
        });
      } catch (err: any) {
        logEvent({ event: 'arcade_achievement_error', service: 'love-ledger', success: false, error: err?.message || String(err) });
        return jsonResp({ error: 'Internal server error' }, 500);
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
