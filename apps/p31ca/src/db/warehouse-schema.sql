-- P31 Warehouse — PGLite Schema (WASM SQLite)
-- For AJ's used furniture warehouse (pick-a-part style)
-- Operational model: Grocery store logic (SKU/PLU/Zone)

-- ─────────────────────────────────────────────────────────────────────────────
-- ZONES (The "Aisles")
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,           -- e.g., "Zone 1: Seating"
    plu_prefix TEXT NOT NULL,     -- e.g., "01" for quick visual reference
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000)
);

-- Seed AJ's 9 zones
INSERT INTO zones (id, name, plu_prefix, description) VALUES
    (1, 'Zone 1: Seating', '01', 'Chairs, sofas, couches, stools'),
    (2, 'Zone 2: Tables', '02', 'Dining tables, desks, coffee tables, end tables'),
    (3, 'Zone 3: Hardware/Parts', '03', 'Knobs, hinges, screws, legs, casters, brackets'),
    (4, 'Zone 4: Lighting', '04', 'Lamps, fixtures, shades, bulbs'),
    (5, 'Zone 5: Decor', '05', 'Art, mirrors, vases, rugs, wall decor'),
    (6, 'Zone 6: Storage/Organization', '06', 'Shelves, bins, racks, cabinets, dressers'),
    (7, 'Zone 7: Appliances', '07', 'Fridges, stoves, washers, small appliances'),
    (8, 'Zone 8: Outdoor', '08', 'Patio furniture, grills, planters, outdoor decor'),
    (9, 'Zone 9: Receiving/Staging', '09', 'New intake, uncategorized, repair queue')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- INVENTORY ITEMS (The "SKUs")
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory_items (
    qr_data TEXT PRIMARY KEY,           -- QR code payload (unique SKU)
    category TEXT NOT NULL,             -- "Seating", "Tables", etc.
    zone_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('received', 'sold', 'moved', 'repair')),
    scanned_at INTEGER NOT NULL,        -- Unix ms
    synced BOOLEAN DEFAULT FALSE,       -- False until pushed to p31-state
    synced_at INTEGER,                  -- When successfully synced

    -- Optional metadata (can be empty for MVP)
    description TEXT,
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'parts')),
    price_cents INTEGER,                -- Nullable until priced
    photos_json TEXT,                   -- JSON array of photo URLs

    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_zone ON inventory_items(zone_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_items_synced ON inventory_items(synced);
CREATE INDEX IF NOT EXISTS idx_items_scanned ON inventory_items(scanned_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- SCAN LOG (Audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_data TEXT NOT NULL,
    zone_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('received', 'sold', 'moved', 'counted')),
    scanned_at INTEGER DEFAULT (unixepoch() * 1000),
    synced BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (qr_data) REFERENCES inventory_items(qr_data),
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

CREATE INDEX IF NOT EXISTS idx_scan_log_qr ON scan_log(qr_data);
CREATE INDEX IF NOT EXISTS idx_scan_log_time ON scan_log(scanned_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- SYNC QUEUE (Outbound to p31-state Worker)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,           -- 'inventory_items' or 'scan_log'
    record_qr_data TEXT,                -- For inventory_items
    record_id INTEGER,                  -- For scan_log
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE')),
    payload_json TEXT NOT NULL,         -- Full record as JSON
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(retry_count);

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS (Operational dashboards)
-- ─────────────────────────────────────────────────────────────────────────────

-- Zone summary (cycle count view)
CREATE VIEW IF NOT EXISTS zone_summary AS
SELECT
    z.id,
    z.name,
    z.plu_prefix,
    COUNT(i.qr_data) FILTER (WHERE i.status = 'received') as in_stock,
    COUNT(i.qr_data) FILTER (WHERE i.status = 'sold') as sold_today,
    COUNT(i.qr_data) FILTER (WHERE i.synced = FALSE) as pending_sync
FROM zones z
LEFT JOIN inventory_items i ON z.id = i.zone_id
GROUP BY z.id, z.name, z.plu_prefix;

-- Unsynced items (for batch push)
CREATE VIEW IF NOT EXISTS unsynced_items AS
SELECT * FROM inventory_items WHERE synced = FALSE ORDER BY scanned_at ASC;

-- Recent activity (last 50 scans)
CREATE VIEW IF NOT EXISTS recent_activity AS
SELECT
    s.scanned_at,
    s.qr_data,
    s.action,
    z.name as zone_name,
    i.category
FROM scan_log s
JOIN zones z ON s.zone_id = z.id
LEFT JOIN inventory_items i ON s.qr_data = i.qr_data
ORDER BY s.scanned_at DESC
LIMIT 50;
