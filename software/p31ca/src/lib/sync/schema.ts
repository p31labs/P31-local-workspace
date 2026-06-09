export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS ca_log (
    id        TEXT PRIMARY KEY,
    ts        INTEGER NOT NULL,
    level     REAL,
    dose_flag INTEGER DEFAULT 0,
    device_id TEXT NOT NULL,
    conflict_flag INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS spoon_log (
    id        TEXT PRIMARY KEY,
    ts        INTEGER NOT NULL,
    delta     INTEGER NOT NULL,
    reason    TEXT,
    device_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shift_log (
    id        TEXT PRIMARY KEY,
    started   INTEGER NOT NULL,
    ended     INTEGER,
    mode      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id        TEXT PRIMARY KEY,
    ts        INTEGER NOT NULL,
    category  TEXT NOT NULL,
    note      TEXT,
    file_ref  TEXT,
    tags      TEXT,
    device_id TEXT NOT NULL,
    deleted_at INTEGER
  );
`;

export interface CaRow {
  id: string;
  ts: number;
  level: number | null;
  dose_flag: 0 | 1;
  device_id: string;
  conflict_flag: 0 | 1;
}

export interface SpoonRow {
  id: string;
  ts: number;
  delta: number;
  reason: string | null;
  device_id: string;
}

export interface ShiftRow {
  id: string;
  started: number;
  ended: number | null;
  mode: 'normal' | 'hyperfocus' | 'lowspoon';
}

export interface EvidenceRow {
  id: string;
  ts: number;
  category: 'medical' | 'legal' | 'comms' | 'financial';
  note: string | null;
  file_ref: string | null;
  tags: string | null;
  device_id: string;
  deleted_at: number | null;
}
