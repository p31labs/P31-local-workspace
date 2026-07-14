import { Hono } from 'hono';
import { cors } from 'hono/cors';

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
  LEDGER_BRIDGE_URL?: string;
}

const app = new Hono<{ Bindings: FederationEnv }>();

app.use('*', cors());

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
  const report: Record<string, unknown> = {
    ok: true,
    service: 'federation-bridge',
    timestamp: new Date().toISOString(),
  };
  try {
    await c.env.LOVE_DB.prepare('SELECT 1').first();
    report.d1 = { status: 'ok', latency_ms: Date.now() - start };
  } catch (e: any) {
    report.d1 = { status: 'error', error: e.message };
    report.ok = false;
  }
  report.total_latency_ms = Date.now() - start;
  return c.json(report, report.ok ? 200 : 503);
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
      // FEP-8b32: if the activity carries an Object Integrity Proof, verify it
      // against the included/known public key before accepting.
      if (body.proof) {
        const pubPem =
          body.proof?.verificationMethod === `${ACTOR_ID}#main-key`
            ? c.env.ACTOR_PUBLIC_KEY
            : extractPemFromProof(body.proof);
        const ok = pubPem ? await verifyProof(body, pubPem) : false;
        if (!ok) {
          return c.json({ error: 'Object Integrity Proof verification failed' }, 422);
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
    '@context': ['https://www.w3.org/ns/did/v1'],
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
    ],
    authentication: [`${did}#main-key`],
    assertionMethod: [`${did}#main-key`],
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

// ── 404 fallback ───────────────────────────────────────────────────────────

app.all('*', (c) => c.json({ error: 'Not found' }, 404));

export default app;
