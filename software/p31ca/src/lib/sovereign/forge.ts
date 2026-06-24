/**
 * @module sovereign/forge
 * @description Ed25519 key generation + PGLite sovereign identity persistence.
 *
 * Extracted from AbdicationCeremony.astro to be reusable across
 * the Delta Runway Ignition, Passport wizard, and Node Zero pairing.
 *
 * All side effects are contained here. Caller owns the React state FSM.
 */

import { PGlite } from '@electric-sql/pglite';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SovereignKeypair {
  publicKey: string;   // hex-encoded 32-byte Ed25519 public key
  privateKey: string;  // hex-encoded 32-byte private scalar (device-local only)
}

export interface SovereignIdentity {
  id: string;
  alias: string;
  vertex: string;
  publicKey: string;
  genesisHash: string;
  covenantSigned: boolean;
  createdAt: string;
}

export interface ForgeResult {
  keypair: SovereignKeypair;
  identity: SovereignIdentity;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRYPTO — Ed25519 key generation
// ─────────────────────────────────────────────────────────────────────────────

let nobleEd: any = null;

async function loadNoble(): Promise<any> {
  if (nobleEd) return nobleEd;
  try {
    nobleEd = await import('@noble/ed25519');
    return nobleEd;
  } catch (e) {
    throw new Error('@noble/ed25519 is required for sovereign identity forging');
  }
}

/**
 * Generate a real Ed25519 keypair in the browser.
 * Uses WebCrypto-backed randomness via @noble/ed25519.
 */
export async function forgeIdentity(alias: string, vertex: string): Promise<ForgeResult> {
  const ed = await loadNoble();
  const privateKeyBytes = (ed as any).utils.randomSecretKey();
  const publicKeyBytes = await (ed as any).getPublicKeyAsync(privateKeyBytes);

  const privateKeyHex = bytesToHex(privateKeyBytes);
  const publicKeyHex = bytesToHex(publicKeyBytes);

  const genesisHash = await computeGenesisHash({
    alias,
    vertex,
    publicKey: publicKeyHex,
    createdAt: new Date().toISOString(),
  });

  const identity: SovereignIdentity = {
    id: `si_${Date.now()}_${publicKeyHex.slice(0, 8)}`,
    alias,
    vertex,
    publicKey: publicKeyHex,
    genesisHash,
    covenantSigned: false,
    createdAt: new Date().toISOString(),
  };

  return {
    keypair: {
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
    },
    identity,
  };
}

/**
 * Compute deterministic genesis hash over identity payload.
 * Uses SHA-256 via WebCrypto.
 */
async function computeGenesisHash(payload: Record<string, unknown>): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sign an arbitrary payload with the Ed25519 private key.
 */
export async function signCovenant(
  payload: Record<string, unknown>,
  privateKeyHex: string
): Promise<{ signature: string; publicKey: string }> {
  const ed = await loadNoble();
  const privateKeyBytes = hexToBytes(privateKeyHex);

  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const signatureBytes = await (ed as any).signAsync(encoded, privateKeyBytes);
  const signatureHex = bytesToHex(signatureBytes);

  return {
    signature: signatureHex,
    publicKey: bytesToHex(await (ed as any).getPublicKeyAsync(privateKeyBytes)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PGLite PERSISTENCE — sovereign_identity table
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'idb://p31-sovereign-identity';
const DB_VERSION = 1;

let dbInstance: PGlite | null = null;
let dbInitPromise: Promise<PGlite> | null = null;

/**
 * Get or create the sovereign identity PGLite database.
 * Separate from warehouse DB to enforce isolation.
 */
export async function getSovereignDB(): Promise<PGlite> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const db = new PGlite(DB_NAME, {
      debug: import.meta.env.DEV ? 1 : 0,
    });
    await db.waitReady;
    await migrateSovereignSchema(db);
    dbInstance = db;
    return db;
  })();

  return dbInitPromise;
}

async function migrateSovereignSchema(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sovereign_identity (
      id TEXT PRIMARY KEY,
      alias TEXT NOT NULL,
      vertex TEXT NOT NULL,
      public_key TEXT NOT NULL,
      genesis_hash TEXT NOT NULL,
      covenant_signed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sovereign_covenants (
      id TEXT PRIMARY KEY,
      identity_id TEXT NOT NULL REFERENCES sovereign_identity(id),
      payload_json TEXT NOT NULL,
      signature_hex TEXT NOT NULL,
      signed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sovereign_sync_queue (
      id SERIAL PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')),
      payload_json TEXT NOT NULL,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
      retry_count INTEGER DEFAULT 0
    );
  `);
}

/**
 * Persist a newly forged identity to PGLite.
 */
export async function persistIdentity(identity: SovereignIdentity): Promise<void> {
  const db = await getSovereignDB();
  await db.exec(
    `
    INSERT INTO sovereign_identity (id, alias, vertex, public_key, genesis_hash, covenant_signed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      alias = excluded.alias,
      vertex = excluded.vertex,
      public_key = excluded.public_key,
      genesis_hash = excluded.genesis_hash
    `,
    [
      identity.id,
      identity.alias,
      identity.vertex,
      identity.publicKey,
      identity.genesisHash,
      identity.covenantSigned ? 1 : 0,
      identity.createdAt,
    ]
  );
}

/**
 * Mark covenant as signed and store the signed payload.
 */
export async function recordCovenant(
  identityId: string,
  payload: Record<string, unknown>,
  signatureHex: string
): Promise<void> {
  const db = await getSovereignDB();

  const id = `cov_${Date.now()}_${signatureHex.slice(0, 8)}`;
  await db.exec(
    `
    INSERT INTO sovereign_covenants (id, identity_id, payload_json, signature_hex, signed_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [id, identityId, JSON.stringify(payload), signatureHex, new Date().toISOString()]
  );

  await db.exec(
    `UPDATE sovereign_identity SET covenant_signed = 1 WHERE id = ?`,
    [identityId]
  );
}

/**
 * Queue a record for mesh sync (outbox pattern).
 */
export async function queueSync(
  table: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE',
  payload: Record<string, unknown>
): Promise<void> {
  const db = await getSovereignDB();
  await db.exec(
    `
    INSERT INTO sovereign_sync_queue (table_name, record_id, operation, payload_json)
    VALUES (?, ?, ?, ?)
    `,
    [table, recordId, operation, JSON.stringify(payload)]
  );
}

/**
 * Retrieve pending sync items for outbox drain.
 */
export async function getPendingSync(): Promise<
  Array<{ id: number; table: string; recordId: string; payload: Record<string, unknown> }>
> {
  const db = await getSovereignDB();
  const { rows } = await db.query<{
    id: number;
    table_name: string;
    record_id: string;
    payload_json: string;
  }>(`
    SELECT id, table_name, record_id, payload_json
    FROM sovereign_sync_queue
    WHERE retry_count < 5
    ORDER BY created_at ASC
  `);

  return rows.map(r => ({
    id: r.id,
    table: r.table_name,
    recordId: r.record_id,
    payload: JSON.parse(r.payload_json),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Simulation mode for environments where @noble/ed25519 cannot load.
 * Produces deterministic-looking keys (NOT cryptographically secure).
 */
export function simulateForging(alias: string, vertex: string): ForgeResult {
  const privHex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const pubHex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const identity: SovereignIdentity = {
    id: `si_sim_${Date.now()}`,
    alias,
    vertex,
    publicKey: pubHex,
    genesisHash: 'sim_' + pubHex.slice(0, 16),
    covenantSigned: false,
    createdAt: new Date().toISOString(),
  };

  return {
    keypair: { publicKey: pubHex, privateKey: privHex },
    identity,
  };
}
