/**
 * PGLite Warehouse Database — Real Instance
 * WASM SQLite for zero-tap inventory scanner
 * @module
 */

import { PGlite } from '@electric-sql/pglite';
import { InventoryItem, Zone } from '../components/ZeroTapWarehouse';

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

/**
 * Initialize or return existing PGLite instance
 * Creates tables on first run
 */
export async function getWarehouseDB(): Promise<PGlite> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = new PGlite('idb://p31-warehouse-aj', {
      // Debug only in development
      debug: import.meta.env.DEV ? 1 : 0,
    });

    await db.waitReady;
    await migrateSchema(db);

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA MIGRATIONS
// ─────────────────────────────────────────────────────────────────────────────

async function migrateSchema(db: PGlite): Promise<void> {
  // Zones table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      plu_prefix TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
    )
  `);

  // Inventory items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      qr_data TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      zone_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('received', 'sold', 'moved', 'repair')),
      scanned_at INTEGER NOT NULL,
      synced BOOLEAN DEFAULT FALSE,
      synced_at INTEGER,
      description TEXT,
      condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'parts')),
      price_cents INTEGER,
      photos_json TEXT
    )
  `);

  // Scan audit log
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scan_log (
      id SERIAL PRIMARY KEY,
      qr_data TEXT NOT NULL,
      zone_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('received', 'sold', 'moved', 'counted')),
      scanned_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
      synced BOOLEAN DEFAULT FALSE
    )
  `);

  // Sync queue for offline resilience
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id SERIAL PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_qr_data TEXT,
      record_id INTEGER,
      operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')),
      payload_json TEXT NOT NULL,
      created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    )
  `);

  // Seed zones if empty
  const { rows } = await db.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM zones`
  );

  if (rows[0].count === 0) {
    await seedZones(db);
  }
}

async function seedZones(db: PGlite): Promise<void> {
  const zones: Zone[] = [
    { id: 1, name: 'Zone 1: Seating', pluPrefix: '01', count: 0 },
    { id: 2, name: 'Zone 2: Tables', pluPrefix: '02', count: 0 },
    { id: 3, name: 'Zone 3: Hardware/Parts', pluPrefix: '03', count: 0 },
    { id: 4, name: 'Zone 4: Lighting', pluPrefix: '04', count: 0 },
    { id: 5, name: 'Zone 5: Decor', pluPrefix: '05', count: 0 },
    { id: 6, name: 'Zone 6: Storage/Organization', pluPrefix: '06', count: 0 },
    { id: 7, name: 'Zone 7: Appliances', pluPrefix: '07', count: 0 },
    { id: 8, name: 'Zone 8: Outdoor', pluPrefix: '08', count: 0 },
    { id: 9, name: 'Zone 9: Receiving/Staging', pluPrefix: '09', count: 0 },
  ];

  for (const zone of zones) {
    await db.exec(
      `INSERT INTO zones (id, name, plu_prefix) VALUES (?, ?, ?)`,
      [zone.id, zone.name, zone.pluPrefix]
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Log an inventory scan
 */
export async function logInventoryItem(
  db: PGlite,
  item: Omit<InventoryItem, 'synced'>
): Promise<void> {
  await db.exec(
    `
    INSERT INTO inventory_items 
      (qr_data, category, zone_id, status, scanned_at, synced)
    VALUES (?, ?, ?, ?, ?, FALSE)
    ON CONFLICT (qr_data) DO UPDATE SET
      zone_id = EXCLUDED.zone_id,
      status = EXCLUDED.status,
      scanned_at = EXCLUDED.scanned_at,
      synced = FALSE
  `,
    [item.qrData, item.category, item.zoneId, item.status, item.scannedAt]
  );

  // Also log to audit trail
  await db.exec(
    `
    INSERT INTO scan_log (qr_data, zone_id, action, scanned_at, synced)
    VALUES (?, ?, ?, ?, FALSE)
  `,
    [item.qrData, item.zoneId, item.status, item.scannedAt]
  );
}

/**
 * Get zone summary (cycle count view)
 */
export async function getZoneSummary(
  db: PGlite
): Promise<Array<{ id: number; name: string; inStock: number; pending: number }>> {
  const { rows } = await db.query<{
    id: number;
    name: string;
    in_stock: number;
    pending: number;
  }>(`
    SELECT 
      z.id,
      z.name,
      COUNT(i.qr_data) FILTER (WHERE i.status = 'received') as in_stock,
      COUNT(i.qr_data) FILTER (WHERE i.synced = FALSE) as pending
    FROM zones z
    LEFT JOIN inventory_items i ON z.id = i.zone_id
    GROUP BY z.id, z.name
    ORDER BY z.id
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    inStock: Number(r.in_stock),
    pending: Number(r.pending),
  }));
}

/**
 * Get unsynced items for batch push
 */
export async function getUnsyncedItems(db: PGlite): Promise<InventoryItem[]> {
  const { rows } = await db.query<{
    qr_data: string;
    category: string;
    zone_id: number;
    status: 'received' | 'sold' | 'moved';
    scanned_at: number;
  }>(`
    SELECT qr_data, category, zone_id, status, scanned_at
    FROM inventory_items
    WHERE synced = FALSE
    ORDER BY scanned_at ASC
  `);

  return rows.map((r) => ({
    qrData: r.qr_data,
    category: r.category,
    zoneId: r.zone_id,
    status: r.status,
    scannedAt: r.scanned_at,
    synced: false,
  }));
}

/**
 * Mark items as synced after successful push
 */
export async function markItemsSynced(
  db: PGlite,
  qrDataList: string[]
): Promise<void> {
  if (qrDataList.length === 0) return;

  // PGlite doesn't support IN (?) with arrays directly
  // Build parameterized query
  const placeholders = qrDataList.map((_, i) => `?`).join(',');
  await db.exec(
    `
    UPDATE inventory_items 
    SET synced = TRUE, synced_at = (EXTRACT(EPOCH FROM NOW()) * 1000)
    WHERE qr_data IN (${placeholders})
  `,
    qrDataList
  );
}

/**
 * Get recent activity (last 50 scans)
 */
export async function getRecentActivity(
  db: PGlite,
  limit: number = 50
): Promise<
  Array<{
    scannedAt: number;
    qrData: string;
    action: string;
    zoneName: string;
    category: string;
  }>
> {
  const { rows } = await db.query<{
    scanned_at: number;
    qr_data: string;
    action: string;
    zone_name: string;
    category: string;
  }>(`
    SELECT
      s.scanned_at,
      s.qr_data,
      s.action,
      z.name as zone_name,
      COALESCE(i.category, 'Unknown') as category
    FROM scan_log s
    JOIN zones z ON s.zone_id = z.id
    LEFT JOIN inventory_items i ON s.qr_data = i.qr_data
    ORDER BY s.scanned_at DESC
    LIMIT ?
  `, [limit]);

  return rows.map((r) => ({
    scannedAt: r.scanned_at,
    qrData: r.qr_data,
    action: r.action,
    zoneName: r.zone_name,
    category: r.category,
  }));
}

/**
 * Clear all data (nuclear option for testing)
 */
export async function clearAllData(db: PGlite): Promise<void> {
  await db.exec(`DELETE FROM inventory_items`);
  await db.exec(`DELETE FROM scan_log`);
  await db.exec(`DELETE FROM sync_queue`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC QUEUE (Offline resilience)
// ─────────────────────────────────────────────────────────────────────────────

export async function queueForSync(
  db: PGlite,
  table: string,
  operation: 'INSERT' | 'UPDATE',
  payload: Record<string, unknown>,
  qrData?: string
): Promise<void> {
  await db.exec(
    `
    INSERT INTO sync_queue (table_name, record_qr_data, operation, payload_json)
    VALUES (?, ?, ?, ?)
  `,
    [table, qrData || null, operation, JSON.stringify(payload)]
  );
}

export async function getPendingSyncQueue(
  db: PGlite
): Promise<Array<{ id: number; payload: Record<string, unknown> }>> {
  const { rows } = await db.query<{
    id: number;
    payload_json: string;
  }>(`
    SELECT id, payload_json
    FROM sync_queue
    WHERE retry_count < 5
    ORDER BY created_at ASC
  `);

  return rows.map((r) => ({
    id: r.id,
    payload: JSON.parse(r.payload_json),
  }));
}

export async function markSyncSuccess(db: PGlite, id: number): Promise<void> {
  await db.exec(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

export async function markSyncError(
  db: PGlite,
  id: number,
  error: string
): Promise<void> {
  await db.exec(
    `
    UPDATE sync_queue 
    SET retry_count = retry_count + 1, last_error = ?
    WHERE id = ?
  `,
    [error, id]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type { PGlite };
export default getWarehouseDB;
