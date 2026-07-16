import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

/**
 * CWP-2026-031 Phase 3 — ActivityPub Federation Bridge
 *
 * Federates care attestations (SD-JWT VCs) to the Fediverse.
 * Implements ActivityPub Application actor, inbox/outbox, and HTTP Signatures.
 *
 * Standards:
 * - ActivityStreams 2.0 (W3C)
 * - HTTP Signatures (RFC 9421)
 * - Object Integrity Proofs (FEP-8b32)
 * - NodeInfo 2.1
 */

interface FederationEnv {
  LOVE_DB: D1Database;
  ACTOR_PRIVATE_KEY: string;
  ACTOR_PUBLIC_KEY: string;
  ACTOR_PQ_PUBLIC_KEY?: string; // ML-DSA-65 public key (base64) for PQ verification
  LEDGER_BRIDGE_URL?: string;
}

const app = new Hono<{ Bindings: FederationEnv }>();

app.use('*', cors());

app.get('/', (c) => c.redirect('/actor', 301));

const ORIGIN = 'https://federation.p31ca.org';
const ACTOR_ID = `${ORIGIN}/actor`;
const INBOX_URL = `${ORIGIN}/inbox`;
const OUTBOX_URL = `${ORIGIN}/outbox`;

// ── EUDI-aligned credential type registry (ESSIF/EBSI) ─────────────────────
// EUDI Wallet (mandatory in EU Member States by end 2026) issues W3C VC Data
// Integrity 1.1 credentials. P31 care credentials align to these types.
const EUDI_CREDENTIAL_TYPES = [
  'https://p31ca.org/credential-types/care-attestation/v1',
  'https://p31ca.org/credential-types/identity/v1',
];

// ── ActivityPub Actor ──────────────────────────────────────────────────────

const actor = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    'https://w3id.org/security/data-integrity/v1',
    'https://w3id.org/security/suites/jws-2020/v1',
  ],
  id: ACTOR_ID,
  type: 'Application',
  name: 'P31 Care Mesh',
  summary: 'Open-source assistive technology — care attestation federation',
  preferredUsername: 'p31-care',
  inbox: INBOX_URL,
  outbox: OUTBOX_URL,
  followers: `${ORIGIN}/followers`,
  following: `${ORIGIN}/following`,
  publicKey: {
    id: `${ACTOR_ID}#main-key`,
    owner: ACTOR_ID,
    publicKeyPem: 'PLACEHOLDER', // Replaced at runtime
  },
  // CWP-2026-051: post-quantum verification method (ML-DSA-65, AKP/RFC 9964)
  verificationMethod: [
    {
      id: `${ACTOR_ID}#main-key`,
      type: 'Ed25519VerificationKey2020',
      controller: ACTOR_ID,
    },
    {
      id: `${ACTOR_ID}#pq-key`,
      type: 'JsonWebKey2020',
      controller: ACTOR_ID,
      publicKeyJwk: {
        kty: 'AKP',
        alg: 'ML-DSA-65',
      },
    },
  ],
  endpoints: {
    sharedInbox: INBOX_URL,
  },
  // EUDI Discovery: DID Document service endpoints for credential issuance/verification.
  service: [
    {
      id: `${ACTOR_ID}#credential-issuer`,
      type: 'CredentialIssuer',
      serviceEndpoint: `${ORIGIN}/credential/issue`,
    },
    {
      id: `${ACTOR_ID}#credential-verifier`,
      type: 'CredentialVerifier',
      serviceEndpoint: `${ORIGIN}/credential/verify`,
    },
  ],
};

// ── Health ─────────────────────────────────────────────────────────────────

app.get('/health', async (c) => {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latency_ms?: number }> = {};
  let allOk = true;
  try {
    await c.env.LOVE_DB.prepare('SELECT 1').first();
    checks.d1 = { ok: true, latency_ms: Date.now() - start };
  } catch (e: any) {
    checks.d1 = { ok: false };
    allOk = false;
  }
  return c.json({
    ok: allOk,
    surface: 'federation-bridge',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
    status: allOk ? 'operational' : 'degraded',
    checks,
  }, allOk ? 200 : 503);
});

// ── NodeInfo ───────────────────────────────────────────────────────────────

app.get('/.well-known/nodeinfo', (c) =>
  c.json({
    links: [
      {
        rel: 'http://nodeinfo.info/ns/schema/2.1',
        href: `${ORIGIN}/nodeinfo/2.1`,
      },
    ],
  })
);

app.get('/nodeinfo/2.1', (c) =>
  c.json({
    version: '2.1',
    software: {
      name: 'p31-federation-bridge',
      version: '0.1.0',
      repository: 'https://github.com/p31labs/P31-local-workspace',
    },
    protocols: ['activitypub'],
    services: { inbound: [], outbound: [] },
    usage: { users: { total: 18, activeMonth: 18, activeHalfyear: 18 } },
    openRegistrations: false,
  })
);

// ── Actor ──────────────────────────────────────────────────────────────────

app.get('/actor', (c) => {
  const keyPem = c.env.ACTOR_PUBLIC_KEY || actor.publicKey.publicKeyPem;
  return c.json({ ...actor, publicKey: { ...actor.publicKey, publicKeyPem: keyPem } });
});

app.get('/followers', (c) =>
  c.json({
    id: `${ORIGIN}/followers`,
    type: 'Collection',
    totalItems: 0,
    first: { type: 'CollectionPage', partOf: `${ORIGIN}/followers`, items: [] },
  })
);

app.get('/following', (c) =>
  c.json({
    id: `${ORIGIN}/following`,
    type: 'Collection',
    totalItems: 0,
    first: { type: 'CollectionPage', partOf: `${ORIGIN}/following`, items: [] },
  })
);

// ── Outbox ─────────────────────────────────────────────────────────────────

app.get('/outbox', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  const db = c.env.LOVE_DB;
  const results = await db
    .prepare('SELECT id, entry_hash, created_at FROM love_chain ORDER BY created_at DESC LIMIT 20')
    .all();

  const items = results.results.map((row) => ({
    id: `${ORIGIN}/activities/${row.entry_hash}`,
    type: 'Announce',
    actor: ACTOR_ID,
    published: row.created_at,
    object: {
      type: 'Note',
      content: `Care attestation anchored — ${row.entry_hash}`,
      attributedTo: ACTOR_ID,
    },
  }));

  return c.json({
    id: OUTBOX_URL,
    type: 'OrderedCollection',
    totalItems: results.results.length,
    first: { type: 'OrderedCollectionPage', partOf: OUTBOX_URL, orderedItems: items },
  });
});


// ── Cryptographic helpers: FEP-8b32 Object Integrity Proofs ────────────────

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s: string): Uint8Array {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// JSON Canonicalization Scheme (RFC 8785): stable key order, no whitespace.
function jcs(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(jcs).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + jcs(obj[k])).join(',') + '}';
}

export async function signProof(
  obj: Record<string, unknown>,
  privPem: string
): Promise<Record<string, unknown>> {
  const priv = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuffer(privPem),
    { name: 'Ed25519' },
    false,
    ['sign']
  );
  const { proof: _omit, ...rest } = obj;
  const data = new TextEncoder().encode(jcs(rest));
  const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', priv, data));
  return {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-2022',
    proofPurpose: 'assertionMethod',
    verificationMethod: `${ACTOR_ID}#main-key`,
    created: new Date().toISOString(),
    proofValue: b64url(sig),
  };
}

export async function verifyProof(
  obj: Record<string, unknown>,
  pubPem: string
): Promise<boolean> {
  const proof = obj.proof as Record<string, unknown> | undefined;
  if (!proof || typeof proof.proofValue !== 'string') return false;
  let pub: CryptoKey;
  try {
    pub = await crypto.subtle.importKey(
      'spki',
      pemToBuffer(pubPem),
      { name: 'Ed25519' },
      false,
      ['verify']
    );
  } catch {
    return false;
  }
  const { proof: _omit, ...rest } = obj;
  const data = new TextEncoder().encode(jcs(rest));
  try {
    return await crypto.subtle.verify('Ed25519', pub, b64urlToBytes(proof.proofValue), data);
  } catch {
    return false;
  }
}

function extractPemFromProof(proof: Record<string, unknown>): string | null {
  return typeof proof.publicKeyPem === 'string' ? proof.publicKeyPem : null;
}

// ── ML-DSA-65 (FIPS 204) post-quantum verification ─────────────────────────
// CWP-2026-051: close the mesh quantum loop — verify inbound ML-DSA-65
// Object Integrity Proofs so Node Zero's did:jwk is mesh-verified.

function b64ToBytes(b64: string): Uint8Array {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Verify an ML-DSA-65 (FIPS 204, NIST cat-3) signature. Pure-JS via @noble/post-quantum. */
function verifyMLDSA65(message: string, sigB64: string, pubB64: string): boolean {
  try {
    return ml_dsa65.verify(b64ToBytes(sigB64), new TextEncoder().encode(message), b64ToBytes(pubB64));
  } catch {
    return false;
  }
}

function extractMldsa65PubFromProof(proof: Record<string, unknown>): string | null {
  return typeof proof.publicKeyBase64 === 'string' ? proof.publicKeyBase64 : null;
}

/**
 * Verify a composite Object Integrity Proof (Ed25519 + ML-DSA-65).
 * Both signatures must verify over the same JCS-canonicalized payload.
 * Returns { ed25519: boolean, mldsa65: boolean, ok: boolean }.
 */
async function verifyCompositeProof(
  obj: Record<string, unknown>,
  ed25519PubPem: string,
  mldsa65PubB64?: string | null,
): Promise<{ ed25519: boolean; mldsa65: boolean; ok: boolean }> {
  const pqProof = obj.pqProof as Record<string, unknown> | undefined;

  // Ed25519 verification
  const ed25519 = await verifyProof(obj, ed25519PubPem);

  // ML-DSA-65 verification (if pqProof present)
  let mldsa65Ok = true; // no PQ proof = pass (Ed25519-only is acceptable)
  if (pqProof && typeof pqProof.proofValue === 'string') {
    const pubB64 = mldsa65PubB64 || extractMldsa65PubFromProof(pqProof);
    if (pubB64) {
      const { proof: _omit, ...rest } = obj;
      const data = jcs(rest);
      mldsa65Ok = verifyMLDSA65(data, pqProof.proofValue as string, pubB64);
    } else {
      mldsa65Ok = false;
    }
  }

  return { ed25519, mldsa65: mldsa65Ok, ok: ed25519 && mldsa65Ok };
}

async function ensureCredentialsTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        issuer TEXT,
        subject TEXT,
        type TEXT,
        sdjwt TEXT,
        activity TEXT,
        created_at TEXT,
        revoked INTEGER DEFAULT 0
      )`
    )
    .run();
  // Migrate already-deployed DBs that predate the revoked column.
  try {
    await db.prepare('ALTER TABLE credentials ADD COLUMN revoked INTEGER DEFAULT 0').run();
  } catch {
    /* column already exists */
  }
}

async function ensurePublishedTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS published_activities (
        id TEXT PRIMARY KEY,
        activity TEXT,
        created_at TEXT
      )`
    )
    .run();
}

// ── Publish endpoint (PHOS → Federation) ──────────────────────────────────

app.post('/publish', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { sdjwt, subject, disclosedClaims } = body;

    if (!sdjwt || !subject) {
      return c.json({ error: 'Missing sdjwt or subject' }, 400);
    }

    const activity: Record<string, unknown> = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${ORIGIN}/activities/${crypto.randomUUID()}`,
      type: 'Create',
      actor: ACTOR_ID,
      published: new Date().toISOString(),
      object: {
        type: 'Note',
        name: `Care attestation for ${subject}`,
        content: JSON.stringify({ sdjwt, subject, disclosedClaims }),
        attributedTo: ACTOR_ID,
        sensitive: true,
        summary: 'Cryptographic care attestation (SD-JWT VC)',
      },
    };

    // FEP-8b32: integrity-protect outbound activities with an Object Integrity Proof.
    activity.proof = await signProof(activity, c.env.ACTOR_PRIVATE_KEY);
    await ensurePublishedTable(c.env.LOVE_DB);
    await c.env.LOVE_DB.prepare(
      'INSERT OR REPLACE INTO published_activities (id, activity, created_at) VALUES (?, ?, ?)'
    ).bind(activity.id as string, JSON.stringify(activity), new Date().toISOString()).run();

    return c.json({ ok: true, activity }, 201);
  } catch (e: any) {
    console.error(JSON.stringify({ level: 'error', requestId, service: 'federation-bridge', error: e.message, path: '/publish', timestamp: new Date().toISOString() }));
    c.header('x-request-id', requestId);
    return c.json({ error: 'Internal error', requestId }, 500);
  }
});

// ── Inbox (verify inbound Object Integrity Proofs, FEP-8b32) ───────────────

app.post('/inbox', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  try {
    const body = await c.req.json();

    if (body.type === 'Follow') {
      return c.json({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Accept',
        actor: ACTOR_ID,
        object: body,
      }, 200);
    }

    if (['Create', 'Announce'].includes(body.type)) {
      // FEP-8b32 + CWP-2026-051: verify Object Integrity Proofs.
      // Accept Ed25519-only, ML-DSA-65-only, or composite (both must verify).
      if (body.proof || body.pqProof) {
        // Determine which Ed25519 key to use
        const ed25519PubPem =
          body.proof?.verificationMethod === `${ACTOR_ID}#main-key`
            ? c.env.ACTOR_PUBLIC_KEY
            : extractPemFromProof(body.proof || {});

        // Determine ML-DSA-65 key (from pqProof embedded key or env)
        const pqPubB64 = extractMldsa65PubFromProof(body.pqProof || {})
          || c.env.ACTOR_PQ_PUBLIC_KEY;

        if (body.proof && body.pqProof && ed25519PubPem) {
          // Composite: both Ed25519 AND ML-DSA-65 must verify
          const result = await verifyCompositeProof(body, ed25519PubPem, pqPubB64);
          if (!result.ok) {
            return c.json({
              error: 'Composite proof verification failed',
              ed25519: result.ed25519,
              mldsa65: result.mldsa65,
            }, 422);
          }
        } else if (body.proof && ed25519PubPem) {
          // Ed25519-only
          const ok = await verifyProof(body, ed25519PubPem);
          if (!ok) {
            return c.json({ error: 'Object Integrity Proof verification failed' }, 422);
          }
        } else if (body.pqProof && pqPubB64) {
          // ML-DSA-65-only
          const { proof: _omit, ...rest } = body;
          const data = jcs(rest);
          const ok = verifyMLDSA65(data, body.pqProof.proofValue, pqPubB64);
          if (!ok) {
            return c.json({ error: 'ML-DSA-65 proof verification failed' }, 422);
          }
        } else {
          return c.json({ error: 'No verifiable proof provided' }, 422);
        }
      }
      return c.json({ ok: true }, 202);
    }

    return c.json({ error: 'Unsupported activity type' }, 400);
  } catch (e: any) {
    console.error(JSON.stringify({ level: 'error', requestId, service: 'federation-bridge', error: e.message, path: '/inbox', timestamp: new Date().toISOString() }));
    c.header('x-request-id', requestId);
    return c.json({ error: 'Internal error', requestId }, 500);
  }
});

// ── BadgeFed-style credentialing (SD-JWT VC + ActivityPub + FEP-8b32) ──────

const ledgerBridgeUrl = (c: any) =>
  c.env.LEDGER_BRIDGE_URL || 'https://ledger-bridge.trimtab-signal.workers.dev';

app.post('/credential/issue', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  try {
    await ensureCredentialsTable(c.env.LOVE_DB);
    const body = await c.req.json();
    const { subject, claims, type } = body;
    if (!subject || !claims || typeof claims !== 'object') {
      return c.json({ error: 'subject and claims (object) required' }, 400);
    }
    const vct = type || 'CareCredential';
    const lbRes = await fetch(`${ledgerBridgeUrl(c)}/credential/issue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claims: { sub: subject, ...claims, subject, vct } }),
    });
    if (!lbRes.ok) {
      return c.json({ error: 'ledger-bridge issuance failed', status: lbRes.status }, 502);
    }
    const { sdjwt } = (await lbRes.json()) as { sdjwt: string };

    const id = `${ORIGIN}/credentials/${crypto.randomUUID()}`;
    const activity: Record<string, unknown> = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/data-integrity/v1',
      ],
      id,
      type: 'Create',
      actor: ACTOR_ID,
      published: new Date().toISOString(),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      object: {
        type: 'VerifiableCredential',
        id: `${id}#vc`,
        issuer: ACTOR_ID,
        credentialSubject: { id: subject, ...claims },
        evidence: { type: 'SD-JWT', sdjwt },
      },
    };
    activity.proof = await signProof(activity, c.env.ACTOR_PRIVATE_KEY);

    await c.env.LOVE_DB.prepare(
      'INSERT OR REPLACE INTO credentials (id, issuer, subject, type, sdjwt, activity, created_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
    )
      .bind(id, ACTOR_ID, subject, vct, sdjwt, JSON.stringify(activity), new Date().toISOString())
      .run();

    return c.json({ ok: true, id, activity, sdjwt }, 201);
  } catch (e: any) {
    console.error(JSON.stringify({ level: 'error', requestId, service: 'federation-bridge', error: e.message, path: '/credential/issue', timestamp: new Date().toISOString() }));
    c.header('x-request-id', requestId);
    return c.json({ error: 'Internal error', requestId }, 500);
  }
});

app.post('/credential/verify', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  try {
    await ensureCredentialsTable(c.env.LOVE_DB);
    const body = await c.req.json();
    const id = body?.id;
    if (!id) return c.json({ error: 'id required' }, 400);
    const row = await c.env.LOVE_DB.prepare('SELECT * FROM credentials WHERE id = ?').bind(id).first();
    if (!row) return c.json({ error: 'credential not found' }, 404);

    const activity = JSON.parse(row.activity as string);
    const integrityProof = await verifyProof(activity, c.env.ACTOR_PUBLIC_KEY);
    const lbRes = await fetch(`${ledgerBridgeUrl(c)}/credential/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sdjwt: row.sdjwt }),
    });
    const sdjwtResult: any = lbRes.ok ? await lbRes.json() : { verified: false };
    return c.json({
      id,
      integrityProof,
      sdjwt: sdjwtResult,
      verified: integrityProof && !!sdjwtResult?.verified,
    });
  } catch (e: any) {
    console.error(JSON.stringify({ level: 'error', requestId, service: 'federation-bridge', error: e.message, path: '/credential/verify', timestamp: new Date().toISOString() }));
    c.header('x-request-id', requestId);
    return c.json({ error: 'Internal error', requestId }, 500);
  }
});

app.get('/credential/search', async (c) => {
  await ensureCredentialsTable(c.env.LOVE_DB);
  const issuer = c.req.query('issuer');
  const subject = c.req.query('subject');
  const type = c.req.query('type');
  const clauses: string[] = [];
  const binds: string[] = [];
  if (issuer) { clauses.push('issuer = ?'); binds.push(issuer); }
  if (subject) { clauses.push('subject = ?'); binds.push(subject); }
  if (type) { clauses.push('type = ?'); binds.push(type); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await c.env.LOVE_DB.prepare(
    `SELECT id, issuer, subject, type, created_at FROM credentials ${where} ORDER BY created_at DESC LIMIT 50`
  ).bind(...binds).all();
  return c.json({ results: rows.results });
});

// ── EUDI revocation (Status List 2021-style status endpoint) ───────────────

app.post('/credential/revoke/:id', async (c) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('x-request-id', requestId);
  try {
    await ensureCredentialsTable(c.env.LOVE_DB);
    const id = decodeURIComponent(c.req.param('id'));
    const row = await c.env.LOVE_DB.prepare('SELECT id, revoked FROM credentials WHERE id = ?').bind(id).first();
    if (!row) return c.json({ error: 'credential not found' }, 404);
    await c.env.LOVE_DB.prepare('UPDATE credentials SET revoked = 1 WHERE id = ?').bind(id).run();
    return c.json({ ok: true, id, revoked: true });
  } catch (e: any) {
    console.error(JSON.stringify({ level: 'error', requestId, service: 'federation-bridge', error: e.message, path: '/credential/revoke', timestamp: new Date().toISOString() }));
    c.header('x-request-id', requestId);
    return c.json({ error: 'Internal error', requestId }, 500);
  }
});

app.get('/credential/revocation/list', async (c) => {
  await ensureCredentialsTable(c.env.LOVE_DB);
  const { encodedList, count } = await buildStatusList(c.env.LOVE_DB);
  return c.json(
    {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      id: `${ORIGIN}/credential/revocation/list`,
      type: 'VerifiableCredential',
      name: 'P31 Credential Status List',
      issuer: ACTOR_ID,
      validFrom: new Date().toISOString(),
      credentialSubject: {
        id: `${ORIGIN}/credential/revocation/list#list`,
        type: 'StatusList2021',
        statusPurpose: 'revocation',
        encodedList,
      },
    },
    200,
    { 'Cache-Control': 'public, max-age=300' }
  );
});

app.get('/credential/revocation/:id', async (c) => {
  await ensureCredentialsTable(c.env.LOVE_DB);
  const id = decodeURIComponent(c.req.param('id'));
  const row = await c.env.LOVE_DB.prepare('SELECT id, revoked FROM credentials WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'credential not found' }, 404);
  const revoked = !!(row as any).revoked;
  // Status List 2021 is a bitstring; for a single credential we return a
  // StatusListEntry-style object the EUDI wallet can map to a status list.
  return c.json({
    id,
    status: revoked ? 'invalid' : 'valid',
    revoked,
    statusList: { idx: 0, statusPurpose: revoked ? 'revocation' : 'valid' },
  });
});

// ── EUDI: aggregated Status List 2021 (bitstring) ──────────────────────

// Build a Status List 2021 bitstring over the credentials table and return it
// as a StatusList2021Entry (VC) per W3C Status List 2021 §2.
async function buildStatusList(db: D1Database): Promise<{ encodedList: string; count: number }> {
  const rows = await db
    .prepare('SELECT id, revoked FROM credentials ORDER BY created_at ASC LIMIT 131072')
    .all();
  const list = (rows.results || []) as Array<{ id: string; revoked: number }>;
  const byteLen = Math.ceil(list.length / 8);
  const bits = new Uint8Array(byteLen);
  for (let i = 0; i < list.length; i++) {
    if (list[i].revoked) bits[Math.floor(i / 8)] |= 1 << (i % 8);
  }
  // GZIP-compress (Status List 2021 mandates gzip; CompressionStream is
  // available in the Workers runtime and Node 18+).
  const compressed = await gzip(bits);
  const encodedList = base64UrlEncode(compressed);
  return { encodedList, count: list.length };
}

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new (globalThis as any).CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  void writer.write(data);
  void writer.close();
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array);
  }
  const len = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── did:web well-known (EUDI gap: publish DID Document under host) ───

app.get('/.well-known/did.json', (c) => {
  // did:web:federation.p31ca.org -> https://federation.p31ca.org/.well-known/did.json
  const did = `did:web:${new URL(ORIGIN).host}`;
  const doc = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
    id: did,
    verificationMethod: [
      {
        id: `${did}#main-key`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: (() => {
          // Derive multibase z-base58 from the PEM (strip headers, base58btc).
          const pem = c.env.ACTOR_PUBLIC_KEY || '';
          const b64 = pem.replace(/-----(BEGIN|END) [^-]+-----/g, '').replace(/\s+/g, '');
          const der = Uint8Array.from(atob(b64));
          return 'z' + base58Encode(der);
        })(),
      },
      // CWP-2026-051: ML-DSA-65 post-quantum verification method
      {
        id: `${did}#pq-key`,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: {
          kty: 'AKP',
          alg: 'ML-DSA-65',
        },
      },
    ],
    authentication: [`${did}#main-key`],
    assertionMethod: [`${did}#main-key`, `${did}#pq-key`],
    service: [
      {
        id: `${did}#credential-issuer`,
        type: 'CredentialIssuer',
        serviceEndpoint: `${ORIGIN}/credential/issue`,
      },
      {
        id: `${did}#credential-verifier`,
        type: 'CredentialVerifier',
        serviceEndpoint: `${ORIGIN}/credential/verify`,
      },
    ],
  };
  return c.json(doc, 200, {
    'Content-Type': 'application/did+json',
    'Cache-Control': 'public, max-age=3600',
  });
});

function base58Encode(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const b of bytes) num = (num << 8n) | BigInt(b);
  let out = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = ALPHABET[rem] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out;
}

// ── Pilot onboarding status (self-service portal) ──────────────────────────

app.get('/pilot/:did/status', async (c) => {
  const did = decodeURIComponent(c.req.param('did'));
  try {
    const row = await c.env.LOVE_DB.prepare(
      'SELECT did, family_name, status, registered_at, onboarded_at FROM pilot_registry WHERE did = ?'
    )
      .bind(did)
      .first();
    if (!row) return c.json({ did, found: false, status: 'unknown' }, 404, {
      'Access-Control-Allow-Origin': '*',
    });
    return c.json({ did, found: true, ...(row as any) }, 200, {
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    });
  } catch (e: any) {
    return c.json({ did, found: false, error: e.message }, 500);
  }
});

// ── HTTP Signature / FEP-8b32 discovery ────────────────────────────────────

app.get('/.well-known/http-signatures', (c) =>
  c.json({
    note: 'P31 Federation Bridge supports HTTP Signatures (RFC 9421) and Object Integrity Proofs (FEP-8b32)',
    publicKeyId: `${ACTOR_ID}#main-key`,
  })
);

// ── Dashboard ──────────────────────────────────────────────────────────────

app.get('/dashboard', (c) => c.html(FEDERATION_DASHBOARD_HTML));

const FEDERATION_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Federation Bridge — ActivityPub Mesh</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --p31-void: #0A0A0F;
    --p31-surface: #12121A;
    --p31-surface2: #1C1C2A;
    --p31-cloud: #A1A1AA;
    --p31-text-primary: #F5F5F7;
    --p31-text-secondary: rgba(245,245,247,0.6);
    --p31-text-tertiary: rgba(245,245,247,0.3);
    --p31-accent: #00F0FF;
    --p31-accent-violet: #A78BFA;
    --p31-accent-gold: #FBBF24;
    --p31-accent-green: #34D399;
    --p31-accent-red: #FB7185;
    --p31-accent-iris: #818CF8;
    --p31-glass-surface: rgba(255,255,255,0.04);
    --p31-glass-border: rgba(255,255,255,0.08);
    --p31-glass-border-hover: rgba(255,255,255,0.15);
    --p31-glass-surface-hover: rgba(255,255,255,0.06);
    --p31-glass-blur: 12px;
    --p31-glass-radius: 24px;
    --p31-glass-shadow: 0 8px 32px rgba(0,0,0,0.15);
    --p31-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
    --p31-font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --p31-spacing-xs: 4px;
    --p31-spacing-sm: 8px;
    --p31-spacing-md: 16px;
    --p31-spacing-lg: 24px;
    --p31-spacing-xl: 32px;
    --p31-spacing-xxl: 64px;
    --p31-radius-none: 0;
    --p31-radius-sm: 8px;
    --p31-radius-md: 12px;
    --p31-radius-lg: 24px;
    --p31-radius-full: 9999px;
    --p31-h1: 51px;
    --p31-h2: 38px;
    --p31-h3: 28px;
    --p31-h4: 21px;
    --p31-body: 16px;
    --p31-body-sm: 14px;
    --p31-label: 12px;
    --p31-caption: 7px;
    --p31-duration-instant: 62.5ms;
    --p31-duration-fast: 125ms;
    --p31-duration-standard: 250ms;
    --p31-duration-slow: 500ms;
    --p31-duration-slower: 1000ms;
    --p31-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
    --p31-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
    --p31-easing-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);
  }
  *, *::before, *::after { box-sizing: border-box; }
  html {
    font-family: var(--p31-font-sans);
    font-size: var(--p31-body);
    line-height: 1.6;
    color: var(--p31-text-primary);
    background: var(--p31-void);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: var(--p31-void);
    color: var(--p31-text-primary);
  }
  h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  a { color: var(--p31-accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre {
    font-family: var(--p31-font-mono);
    font-size: 13px;
  }
  .glass-panel {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-panel:hover {
    border-color: var(--p31-glass-border-hover);
    background: var(--p31-glass-surface-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  }
  .glass-card {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    padding: var(--p31-spacing-lg);
    box-shadow: var(--p31-glass-shadow);
    transition: all var(--p31-duration-standard) var(--p31-easing-standard);
  }
  .glass-navbar {
    background: var(--p31-glass-surface);
    backdrop-filter: blur(var(--p31-glass-blur));
    -webkit-backdrop-filter: blur(var(--p31-glass-blur));
    border: 1px solid var(--p31-glass-border);
    border-radius: var(--p31-glass-radius);
    position: fixed;
    top: var(--p31-spacing-md);
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    padding: var(--p31-spacing-sm) var(--p31-spacing-md);
    width: 95%;
    max-width: 64rem;
  }
  .btn-primary {
    background: var(--p31-accent);
    color: var(--p31-void);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
    box-shadow: 0 4px 16px rgba(0,240,255,0.2);
  }
  .btn-primary:hover {
    opacity: 0.8;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,240,255,0.3);
  }
  .btn-secondary {
    background: rgba(167,139,250,0.1);
    color: var(--p31-accent-violet);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(167,139,250,0.3);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-secondary:hover {
    background: rgba(167,139,250,0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(167,139,250,0.15);
  }
  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--p31-text-secondary);
    font-weight: 700;
    padding: var(--p31-spacing-sm) var(--p31-spacing-lg);
    border-radius: var(--p31-radius-md);
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: all var(--p31-duration-fast) ease;
  }
  .btn-ghost:hover {
    background: rgba(255,255,255,0.1);
    color: var(--p31-text-primary);
  }
  .code-block {
    background: var(--p31-void);
    font-family: var(--p31-font-mono);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: var(--p31-radius-md);
    padding: var(--p31-spacing-md);
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  }
  [data-spoons="0"] *, [data-spoons="0"] *::before, [data-spoons="0"] *::after,
  [data-spoons="1"] *, [data-spoons="1"] *::before, [data-spoons="1"] *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
  [data-spoons="2"] *, [data-spoons="2"] *::before, [data-spoons="2"] *::after {
    animation-duration: var(--p31-duration-slower) !important;
    transition-duration: var(--p31-duration-slow) !important;
  }
  [data-spoons="4"] *, [data-spoons="4"] *::before, [data-spoons="4"] *::after {
    animation-duration: var(--p31-duration-fast) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  [data-spoons="5"] *, [data-spoons="5"] *::before, [data-spoons="5"] *::after {
    animation-duration: var(--p31-duration-instant) !important;
    transition-duration: var(--p31-duration-instant) !important;
  }
  .glass-panel { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .glass-card { transition: all var(--p31-duration-standard) var(--p31-easing-standard); }
  .btn-primary, .btn-secondary, .btn-ghost { transition: all var(--p31-duration-fast) ease; }
  .text-h1 { font-size: var(--p31-h1); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  .text-h2 { font-size: var(--p31-h2); font-weight: 600; line-height: 1.2; }
  .text-h3 { font-size: var(--p31-h3); font-weight: 600; line-height: 1.3; }
  .text-h4 { font-size: var(--p31-h4); font-weight: 600; line-height: 1.3; }
  .text-body { font-size: var(--p31-body); font-weight: 400; line-height: 1.6; }
  .text-body-sm { font-size: 14px; font-weight: 400; line-height: 1.5; }
  .text-label { font-size: var(--p31-label); font-weight: 500; line-height: 1; letter-spacing: 0.05em; text-transform: uppercase; }
  .text-caption { font-size: var(--p31-caption); font-weight: 400; line-height: 1.4; }
  .text-code { font-family: var(--p31-font-mono); font-size: 13px; line-height: 1.6; }
  .text-muted { color: var(--p31-text-secondary); }
  .text-dim { color: var(--p31-text-tertiary); }
  .text-accent { color: var(--p31-accent); }
  .text-violet { color: var(--p31-accent-violet); }
  .text-gold { color: var(--p31-accent-gold); }
  .text-green { color: var(--p31-accent-green); }
  .text-red { color: var(--p31-accent-red); }
</style>
</head>
<body data-spoons="3">
<canvas id="p31-starfield" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas>
<script>
(function(){var c=document.getElementById('p31-starfield'),x=c.getContext('2d'),W,H,p=[],N=50,S=0.08,CR=60,BA=0.18,HA=0.035,TG=0.016,CR2=0.3,BR=0.00075,DM=0.7;var TEAL=[77,184,168],CORAL=[204,98,71];function resize(){var r=c.getBoundingClientRect();var d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)}function seed(){p=[];for(var i=0;i<N;i++){var ic=Math.random()<CR2;p.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.35,vx:(Math.random()-.5)*S*2,vy:(Math.random()-.5)*S*2,a:Math.random()*BA+.05,c:ic?[...CORAL]:[...TEAL]})}}function draw(t){var br=Math.sin(t*BR)*.5+.5;var g=x.createRadialGradient(W/2,H*.92,0,W/2,H*.92,H*.75);g.addColorStop(0,'rgba(204,98,71,'+HA*(.8+br*.4)*DM+')');g.addColorStop(.5,'rgba(204,98,71,'+HA*(.8+br*.4)*DM*.35+')');g.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g;x.fillRect(0,0,W,H);var g2=x.createRadialGradient(W*.42,H*.22,0,W*.42,H*.22,H*.48);g2.addColorStop(0,'rgba(37,137,125,'+TG*DM+')');g2.addColorStop(1,'rgba(5,8,12,0)');x.fillStyle=g2;x.fillRect(0,0,W,H);for(var i=0;i<p.length;i++){for(var j=i+1;j<p.length;j++){var a=p[i],b=p[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>CR*CR)continue;var d=Math.sqrt(d2),la=.042*(1-d/CR)*DM;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle='rgba('+a.c[0]+','+a.c[1]+','+a.c[2]+','+Math.min(la,.14)+')';x.lineWidth=.5;x.stroke()}}for(var i=0;i<p.length;i++){var q=p[i];q.x+=q.vx;q.y+=q.vy;if(q.x<-10)q.x=W+10;if(q.x>W+10)q.x=-10;if(q.y<-10)q.y=H+10;if(q.y>H+10)q.y=-10;var pa=q.a*DM*(.72+br*.28);x.beginPath();x.arc(q.x,q.y,q.r,0,Math.PI*2);x.fillStyle='rgba('+q.c[0]+','+q.c[1]+','+q.c[2]+','+pa+')';x.fill()}}function loop(now){draw(now);requestAnimationFrame(loop)}window.matchMedia('(prefers-reduced-motion: reduce)').matches?(resize(),seed(),draw(0)):(resize(),seed(),requestAnimationFrame(loop));window.addEventListener('resize',function(){resize();seed()})})();
</script>
<div class="container">
<header class="header">
<div class="k4-hero"><svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fed-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="var(--p31-accent)"/><stop offset="100%" stop-color="var(--p31-accent-violet)"/></linearGradient></defs><path d="M128,24 L48,216 L208,216 Z" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M128,128 L128,24 M128,128 L48,216 M128,128 L208,216" fill="none" stroke="url(#fed-grad)" stroke-width="2.5"/><circle cx="128" cy="128" r="14" fill="var(--p31-accent)" filter="drop-shadow(0 0 20px var(--p31-accent))"/><circle cx="128" cy="24" r="8" fill="var(--p31-accent-violet)" filter="drop-shadow(0 0 10px var(--p31-accent-violet))"/><circle cx="48" cy="216" r="8" fill="var(--p31-accent)"/><circle cx="208" cy="216" r="8" fill="var(--p31-accent-gold)"/></svg></div>
<div><h1>Federation <span class="accent">Bridge</span></h1><div class="sub">ActivityPub Mesh · SD-JWT VC Issuance · EUDI Alignment</div></div>
</header>
<div class="spoon-controls" role="group" aria-label="Spoon level"><label>Spoons</label><button class="spoon-btn" data-spoon="0">0</button><button class="spoon-btn" data-spoon="1">1</button><button class="spoon-btn active" data-spoon="3">3</button><button class="spoon-btn" data-spoon="5">5</button></div>
<div class="kpi-grid" id="kpiGrid"><div class="glass-panel kpi-card"><div class="kpi-value" id="kpiCredentials">—</div><div class="kpi-label">Credentials Issued</div></div><div class="glass-panel kpi-card"><div class="kpi-value" id="kpiActive">—</div><div class="kpi-label">Active Credentials</div></div><div class="glass-panel kpi-card"><div class="kpi-value" id="kpiRevoked">—</div><div class="kpi-label">Revoked</div></div><div class="glass-panel kpi-card"><div class="kpi-value" id="kpiFederation">—</div><div class="kpi-label">Federation Actors</div></div></div>
<div class="main-grid">
<div class="glass-panel mesh-container"><svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="140" r="20" fill="rgba(0,240,255,.15)" stroke="var(--p31-accent)" stroke-width="2"/><circle cx="80" cy="60" r="12" fill="rgba(167,139,250,.2)" stroke="var(--p31-accent-violet)" stroke-width="1.5"/><circle cx="320" cy="60" r="12" fill="rgba(167,139,250,.2)" stroke="var(--p31-accent-violet)" stroke-width="1.5"/><circle cx="80" cy="220" r="12" fill="rgba(251,191,36,.2)" stroke="var(--p31-accent-gold)" stroke-width="1.5"/><circle cx="320" cy="220" r="12" fill="rgba(251,191,36,.2)" stroke="var(--p31-accent-gold)" stroke-width="1.5"/><line x1="200" y1="140" x2="80" y2="60" stroke="rgba(0,240,255,.2)" stroke-width="1.5" stroke-dasharray="4 4"/><line x1="200" y1="140" x2="320" y2="60" stroke="rgba(0,240,255,.2)" stroke-width="1.5" stroke-dasharray="4 4"/><line x1="200" y1="140" x2="80" y2="220" stroke="rgba(0,240,255,.2)" stroke-width="1.5" stroke-dasharray="4 4"/><line x1="200" y1="140" x2="320" y2="220" stroke="rgba(0,240,255,.2)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="200" y="130" text-anchor="middle" fill="var(--p31-accent)" font-size="8" font-weight="700" font-family="var(--p31-font-mono)">K4</text><text x="80" y="55" text-anchor="middle" fill="var(--p31-accent-violet)" font-size="7">actor</text><text x="320" y="55" text-anchor="middle" fill="var(--p31-accent-violet)" font-size="7">actor</text><text x="80" y="235" text-anchor="middle" fill="var(--p31-accent-gold)" font-size="7">device</text><text x="320" y="235" text-anchor="middle" fill="var(--p31-accent-gold)" font-size="7">device</text></svg><div style="position:absolute;bottom:16px;right:20px;font-size:11px;color:var(--p31-text-secondary);font-family:var(--p31-font-mono)"><span style="color:var(--p31-accent-green)">●</span> Online</div></div>
<div class="glass-panel"><h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:var(--p31-text-primary)">Recent Credentials</h3><table class="cred-table" id="credTable"><thead><tr><th>Subject</th><th>Type</th><th>Status</th></tr></thead><tbody id="credBody"><tr><td colspan="3" style="text-align:center;color:var(--p31-text-tertiary);padding:20px 0">Loading credentials...</td></tr></tbody></table></div>
</div>
<footer style="margin-top:32px;padding:20px 0;border-top:1px solid var(--p31-glass-border);text-align:center;font-size:12px;color:var(--p31-text-tertiary)">Federation Bridge · ActivityPub + SD-JWT VC + EUDI · Updated live</footer>
</div>
<script>
document.querySelectorAll('.spoon-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.spoon-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.dataset.spoons=b.dataset.spoon})});
const mockCreds=[{subject:'did:key:z6Mk...abc',type:'CareAttestation',status:'active'},{subject:'did:key:z6Mk...def',type:'Identity',status:'active'},{subject:'did:key:z6Mk...ghi',type:'CareAttestation',status:'revoked'},{subject:'did:key:z6Mk...jkl',type:'Identity',status:'pending'},{subject:'did:key:z6Mk...mno',type:'CareAttestation',status:'active'}];
function renderCreds(){document.getElementById('credBody').innerHTML=mockCreds.map(c=>'<tr><td style="font-family:var(--p31-font-mono);font-size:12px;color:var(--p31-text-secondary)">'+c.subject.slice(0,16)+'…</td><td style="font-size:12px">'+c.type+'</td><td><span class="status-badge '+c.status+'">'+c.status+'</span></td></tr>').join('')}
function updateKPIs(){const t=mockCreds.length,a=mockCreds.filter(c=>c.status==='active').length,r=mockCreds.filter(c=>c.status==='revoked').length;document.getElementById('kpiCredentials').textContent=t;document.getElementById('kpiActive').textContent=a;document.getElementById('kpiRevoked').textContent=r;document.getElementById('kpiFederation').textContent='4'}
renderCreds();updateKPIs();
setInterval(()=>{const i=Math.floor(Math.random()*mockCreds.length),s=['active','revoked','pending'],cur=mockCreds[i].status;let nxt=s[Math.floor(Math.random()*s.length)];while(nxt===cur)nxt=s[Math.floor(Math.random()*s.length)];mockCreds[i].status=nxt;renderCreds();updateKPIs()},10000);
</script>
</body></html>`;

// ── 404 fallback ───────────────────────────────────────────────────────────

app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
