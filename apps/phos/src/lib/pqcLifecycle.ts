/**
 * PQC Key Lifecycle — CWP-2026-029 P5
 *
 * Manages ML-DSA-65 key rotation, expiry, and status tracking.
 * Extends identity_registry with lifecycle fields (applied via manual SQL).
 *
 * Key states: generated → registered → active → expiring → expired | revoked
 */

export interface PQCLifecycleEntry {
  did: string;
  mldsa65_pub: string;
  mldsa65_issued_at: number;   // epoch ms
  mldsa65_expires_at: number;  // epoch ms
  mldsa65_status: KeyStatus;
}

export type KeyStatus = 'active' | 'expiring' | 'expired' | 'revoked';

export interface KeyRotationRecord {
  id: number;
  did: string;
  old_public_key: string | null;
  new_public_key: string;
  rotated_at: number;
  reason: string;
}

// Default key lifetime: 365 days
const DEFAULT_KEY_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

// Expiry warning threshold: 30 days before expiry
const EXPIRY_WARNING_DAYS = 30;

/**
 * Check if a key needs rotation (within 30 days of expiry).
 */
export function needsRotation(entry: PQCLifecycleEntry): boolean {
  if (!entry.mldsa65_expires_at) return false;
  const daysUntilExpiry = (entry.mldsa65_expires_at - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry < EXPIRY_WARNING_DAYS;
}

/**
 * Compute key status from lifecycle fields.
 */
export function computeKeyStatus(entry: { mldsa65_expires_at?: number; mldsa65_status?: string }): KeyStatus {
  if (entry.mldsa65_status === 'revoked') return 'revoked';
  if (!entry.mldsa65_expires_at) return 'active';
  const now = Date.now();
  const daysUntilExpiry = (entry.mldsa65_expires_at - now) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry < EXPIRY_WARNING_DAYS) return 'expiring';
  return 'active';
}

/**
 * Create lifecycle fields for a newly registered key.
 */
export function createLifecycleFields(issuedAt: number = Date.now()) {
  return {
    mldsa65_issued_at: issuedAt,
    mldsa65_expires_at: issuedAt + DEFAULT_KEY_LIFETIME_MS,
    mldsa65_status: 'active' as KeyStatus,
  };
}

/**
 * SQL schema for key rotation logging.
 * Applied manually (D1 migration drift prevents automatic application).
 */
export const ROTATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pqc_key_rotation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL,
  old_public_key TEXT,
  new_public_key TEXT NOT NULL,
  rotated_at INTEGER NOT NULL,
  reason TEXT
);
`;

/**
 * SQL to add lifecycle columns to identity_registry.
 * Run manually: npx wrangler d1 execute love-ledger --remote --command "<SQL>"
 */
export const LIFECYCLE_COLUMNS_SQL = [
  `ALTER TABLE identity_registry ADD COLUMN mldsa65_issued_at INTEGER`,
  `ALTER TABLE identity_registry ADD COLUMN mldsa65_expires_at INTEGER`,
  `ALTER TABLE identity_registry ADD COLUMN mldsa65_status TEXT DEFAULT 'active'`,
];
