import { Hono } from 'hono';
import {
  toFhirObservation,
  toFhirPatient,
  toFhirProvenance,
} from './mapping';
import type {
  CareProofInput,
  FhirObservation,
  FhirPatient,
  FhirProvenance,
} from './types';

type Bindings = {
  LOVEDB: D1Database;
  // Optional: verify DID signatures against ledger-bridge. Left unset in tests.
  LEDGER_BRIDGE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ── Health ──────────────────────────────────────────────────────────────

app.get('/health', async (c) => {
  const start = Date.now();
  try {
    await c.env.LOVEDB.prepare('SELECT 1').first();
    return c.json({ ok: true, service: 'fhir-bridge', d1: { status: 'ok' }, total_latency_ms: Date.now() - start });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 503);
  }
});

// ── Schema ───────────────────────────────────────────────────────────────

async function ensureSchema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS fhir_observations (
        id TEXT PRIMARY KEY, did TEXT NOT NULL,
        observation_json TEXT NOT NULL, created_at INTEGER NOT NULL
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS fhir_patients (
        did TEXT PRIMARY KEY, patient_json TEXT NOT NULL, updated_at INTEGER NOT NULL
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS fhir_provenances (
        id TEXT PRIMARY KEY, observation_id TEXT NOT NULL,
        provenance_json TEXT NOT NULL, created_at INTEGER NOT NULL
      )`,
    )
    .run();
}

// ── Patient ──────────────────────────────────────────────────────────────

app.post('/fhir/Patient', async (c) => {
  try {
    const body = await c.req.json<{ did: string }>();
    if (!body?.did) return c.json({ error: 'did required' }, 400);
    const patient: FhirPatient = toFhirPatient(body.did);
    await ensureSchema(c.env.LOVEDB);
    await c.env.LOVEDB.prepare(
      'INSERT OR REPLACE INTO fhir_patients (did, patient_json, updated_at) VALUES (?, ?, ?)',
    )
      .bind(patient.id, JSON.stringify(patient), Date.now())
      .run();
    return c.json(patient, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/fhir/Patient/:id', async (c) => {
  const row = await c.env.LOVEDB.prepare('SELECT patient_json FROM fhir_patients WHERE did = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(JSON.parse((row as any).patient_json));
});

// ── Observation ──────────────────────────────────────────────────────────

app.post('/fhir/Observation', async (c) => {
  try {
    const body = await c.req.json<CareProofInput & { signature?: string }>();
    if (!body?.did || typeof body.tProx !== 'number') {
      return c.json({ error: 'did and tProx required' }, 400);
    }
    const id = `obs-${crypto.randomUUID()}`;
    const obs: FhirObservation = toFhirObservation(body, id);
    await ensureSchema(c.env.LOVEDB);
    await c.env.LOVEDB.prepare(
      'INSERT OR REPLACE INTO fhir_observations (id, did, observation_json, created_at) VALUES (?, ?, ?, ?)',
    )
      .bind(id, body.did, JSON.stringify(obs), Date.now())
      .run();
    if (body.signature) {
      const prov: FhirProvenance = toFhirProvenance(id, body.did, body.signature);
      await c.env.LOVEDB.prepare(
        'INSERT OR REPLACE INTO fhir_provenances (id, observation_id, provenance_json, created_at) VALUES (?, ?, ?, ?)',
      )
        .bind(prov.id, id, JSON.stringify(prov), Date.now())
        .run();
    }
    return c.json(obs, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/fhir/Observation/:id', async (c) => {
  const row = await c.env.LOVEDB.prepare('SELECT observation_json FROM fhir_observations WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(JSON.parse((row as any).observation_json));
});

// ── Provenance ─────────────────────────────────────────────────────────

app.post('/fhir/Provenance', async (c) => {
  try {
    const body = await c.req.json<{ observationId: string; did: string; signature: string }>();
    if (!body?.observationId || !body.signature) {
      return c.json({ error: 'observationId and signature required' }, 400);
    }
    const prov: FhirProvenance = toFhirProvenance(body.observationId, body.did, body.signature);
    await ensureSchema(c.env.LOVEDB);
    await c.env.LOVEDB.prepare(
      'INSERT OR REPLACE INTO fhir_provenances (id, observation_id, provenance_json, created_at) VALUES (?, ?, ?, ?)',
    )
      .bind(prov.id, body.observationId, JSON.stringify(prov), Date.now())
      .run();
    return c.json(prov, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/fhir/Provenance/:id', async (c) => {
  const row = await c.env.LOVEDB.prepare('SELECT provenance_json FROM fhir_provenances WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(JSON.parse((row as any).provenance_json));
});

export default app;
