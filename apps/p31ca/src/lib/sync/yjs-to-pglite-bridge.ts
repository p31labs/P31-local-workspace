// src/lib/sync/yjs-to-pglite-bridge.ts
// Bridge Yjs CRDT state to PGLite relational store for complex queries
// Supports: biometrics, medications, spoon tracking, accommodations, BONDING data

import * as Y from 'yjs';
import { PGlite } from '@electric-sql/pglite';
import type { Namespace } from './p31-sync';

// Data types that sync from Yjs to PGLite
export interface BiometricReading {
  id: string;
  timestamp: number;
  type: 'calcium_proxy' | 'hrv' | 'sleep_score' | 'activity';
  value: number;
  unit: string;
  source: string; // 'bangle', 'nodezero', 'manual'
  deviceId: string;
}

export interface MedicationDose {
  id: string;
  timestamp: number;
  medication: 'calcitriol' | 'calcium_carbonate' | 'other';
  doseMg: number;
  taken: boolean;
  deviceId: string;
}

export interface SpoonEntry {
  id: string;
  timestamp: number;
  spoonsUsed: number;
  spoonsTotal: number;
  activity: string;
  notes?: string;
  deviceId: string;
}

export interface AccommodationLog {
  id: string;
  timestamp: number;
  context: 'court' | 'work' | 'family' | 'medical';
  accommodation: string;
  outcome: 'successful' | 'partial' | 'failed';
  deviceId: string;
}

/**
 * Initialize PGLite with sync schema
 */
export async function initPGLite(db: PGlite): Promise<void> {
  // Create tables for each data type
  await db.exec(`
    CREATE TABLE IF NOT EXISTS biometrics (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      source TEXT NOT NULL,
      device_id TEXT NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_biometrics_time ON biometrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_biometrics_type ON biometrics(type);

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      medication TEXT NOT NULL,
      dose_mg REAL NOT NULL,
      taken INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_meds_time ON medications(timestamp);

    CREATE TABLE IF NOT EXISTS spoon_entries (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      spoons_used INTEGER NOT NULL,
      spoons_total INTEGER NOT NULL,
      activity TEXT NOT NULL,
      notes TEXT,
      device_id TEXT NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_spoon_time ON spoon_entries(timestamp);

    CREATE TABLE IF NOT EXISTS accommodation_logs (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      context TEXT NOT NULL,
      accommodation TEXT NOT NULL,
      outcome TEXT NOT NULL,
      device_id TEXT NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_accom_time ON accommodation_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_accom_context ON accommodation_logs(context);

    CREATE TABLE IF NOT EXISTS bonding_sessions (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      child_id TEXT NOT NULL,
      molecules_built INTEGER NOT NULL,
      pings_sent INTEGER NOT NULL,
      pings_received INTEGER NOT NULL,
      session_duration_seconds INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      synced_at INTEGER DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_bonding_child ON bonding_sessions(child_id);
    CREATE INDEX IF NOT EXISTS idx_bonding_time ON bonding_sessions(timestamp);

    -- Sync metadata table for tracking last sync per namespace
    CREATE TABLE IF NOT EXISTS sync_metadata (
      namespace TEXT PRIMARY KEY,
      last_sync INTEGER,
      device_id TEXT
    );
  `);
}

/**
 * Sync Yjs map data to PGLite relational tables
 * Called after Yjs updates are applied (from remote or local)
 */
export async function syncYjsToPGLite(
  ydoc: Y.Doc,
  db: PGlite,
  namespace: Namespace,
  deviceId: string
): Promise<void> {
  const map = ydoc.getMap(namespace);

  switch (namespace) {
    case 'p31:operator':
      await syncBiometrics(map, db, deviceId);
      await syncMedications(map, db, deviceId);
      await syncSpoonEntries(map, db, deviceId);
      break;

    case 'p31:family:cage':
      // Family-level data (shared across K4 cage)
      await syncSpoonEntries(map, db, deviceId);
      break;

    case 'p31:child:sj':
    case 'p31:child:wj':
      // Child-specific BONDING data
      await syncBondingData(map, db, namespace, deviceId);
      break;

    case 'p31:legal':
      await syncAccommodationLogs(map, db, deviceId);
      break;
  }

  // Update sync metadata
  await db.query(
    `INSERT INTO sync_metadata (namespace, last_sync, device_id)
     VALUES ($1, $2, $3)
     ON CONFLICT(namespace) DO UPDATE SET
       last_sync = excluded.last_sync,
       device_id = excluded.device_id`,
    [namespace, Date.now(), deviceId]
  );
}

async function syncBiometrics(
  map: Y.Map<unknown>,
  db: PGlite,
  deviceId: string
): Promise<void> {
  const readings = map.get('biometrics') as Y.Array<BiometricReading> | undefined;
  if (!readings) return;

  for (const reading of readings.toArray()) {
    await db.query(
      `INSERT INTO biometrics (id, timestamp, type, value, unit, source, device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET
         value = excluded.value,
         synced_at = unixepoch()`,
      [reading.id, reading.timestamp, reading.type, reading.value,
       reading.unit, reading.source, deviceId]
    );
  }
}

async function syncMedications(
  map: Y.Map<unknown>,
  db: PGlite,
  deviceId: string
): Promise<void> {
  const doses = map.get('medications') as Y.Array<MedicationDose> | undefined;
  if (!doses) return;

  for (const dose of doses.toArray()) {
    await db.query(
      `INSERT INTO medications (id, timestamp, medication, dose_mg, taken, device_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(id) DO UPDATE SET
         taken = excluded.taken,
         synced_at = unixepoch()`,
      [dose.id, dose.timestamp, dose.medication, dose.doseMg,
       dose.taken ? 1 : 0, deviceId]
    );
  }
}

async function syncSpoonEntries(
  map: Y.Map<unknown>,
  db: PGlite,
  deviceId: string
): Promise<void> {
  const entries = map.get('spoons') as Y.Array<SpoonEntry> | undefined;
  if (!entries) return;

  for (const entry of entries.toArray()) {
    await db.query(
      `INSERT INTO spoon_entries (id, timestamp, spoons_used, spoons_total, activity, notes, device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET
         spoons_used = excluded.spoons_used,
         notes = excluded.notes,
         synced_at = unixepoch()`,
      [entry.id, entry.timestamp, entry.spoonsUsed, entry.spoonsTotal,
       entry.activity, entry.notes || null, deviceId]
    );
  }
}

async function syncAccommodationLogs(
  map: Y.Map<unknown>,
  db: PGlite,
  deviceId: string
): Promise<void> {
  const logs = map.get('accommodations') as Y.Array<AccommodationLog> | undefined;
  if (!logs) return;

  for (const log of logs.toArray()) {
    await db.query(
      `INSERT INTO accommodation_logs (id, timestamp, context, accommodation, outcome, device_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(id) DO UPDATE SET
         outcome = excluded.outcome,
         synced_at = unixepoch()`,
      [log.id, log.timestamp, log.context, log.accommodation,
       log.outcome, deviceId]
    );
  }
}

// BONDING game data structure
interface BondingSession {
  id: string;
  timestamp: number;
  childId: string;
  moleculesBuilt: number;
  pingsSent: number;
  pingsReceived: number;
  sessionDurationSeconds: number;
  deviceId: string;
}

async function syncBondingData(
  map: Y.Map<unknown>,
  db: PGlite,
  namespace: 'p31:child:sj' | 'p31:child:wj',
  deviceId: string
): Promise<void> {
  const sessions = map.get('bonding_sessions') as Y.Array<BondingSession> | undefined;
  if (!sessions) return;

  const childId = namespace === 'p31:child:sj' ? 'sj' : 'wj';

  for (const session of sessions.toArray()) {
    await db.query(
      `INSERT INTO bonding_sessions
       (id, timestamp, child_id, molecules_built, pings_sent, pings_received, session_duration_seconds, device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT(id) DO UPDATE SET
         molecules_built = excluded.molecules_built,
         pings_sent = excluded.pings_sent,
         pings_received = excluded.pings_received,
         synced_at = unixepoch()`,
      [session.id, session.timestamp, childId, session.moleculesBuilt,
       session.pingsSent, session.pingsReceived, session.sessionDurationSeconds,
       deviceId]
    );
  }
}

/**
 * Query calcium levels for safety monitoring (Gap C integration)
 */
export async function getLatestCalciumReading(db: PGlite): Promise<BiometricReading | null> {
  const result = await db.query(
    `SELECT * FROM biometrics
     WHERE type = 'calcium_proxy'
     ORDER BY timestamp DESC
     LIMIT 1`,
    []
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    timestamp: Number(row.timestamp),
    type: String(row.type) as BiometricReading['type'],
    value: Number(row.value),
    unit: String(row.unit),
    source: String(row.source),
    deviceId: String(row.device_id),
  };
}

/**
 * Get estimated calcium based on last lab + medication timing
 * Simple model for Gap C medical integration
 */
export async function estimateCalciumLevel(
  db: PGlite,
  hoursSinceLastLab: number
): Promise<number | null> {
  const lastLab = await db.query(
    `SELECT * FROM biometrics
     WHERE type = 'calcium_proxy'
     ORDER BY timestamp DESC
     LIMIT 1`,
    []
  );

  if (lastLab.rows.length === 0) return null;

  const lastReading = Number((lastLab.rows[0] as Record<string, unknown>).value);

  // Count calcitriol doses in last 24 hours
  const doses = await db.query(
    `SELECT COUNT(*) as count FROM medications
     WHERE medication = 'calcitriol'
       AND taken = 1
       AND timestamp > $1`,
    [Date.now() - 86400000]
  );

  const calcitriolCount = Number((doses.rows[0] as Record<string, unknown> | undefined)?.count || 0);

  // Simple estimation: calcitriol raises calcium by ~0.5 mg/dL per dose (within therapeutic window)
  // Without calcitriol, calcium drops ~0.1 mg/dL per hour
  const baselineDrop = hoursSinceLastLab * 0.1;
  const calcitriolBoost = calcitriolCount * 0.5;

  return Math.max(7.0, lastReading - baselineDrop + calcitriolBoost);
}