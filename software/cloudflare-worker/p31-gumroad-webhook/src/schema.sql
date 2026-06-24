-- P31 Revenue D1 Schema
-- Deploy: npx wrangler d1 execute p31-revenue-db --remote --file=src/schema.sql

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'gumroad',         -- gumroad | kofi | open_collective
  event_type TEXT NOT NULL,                       -- sale.created | sale.refunded | subscription.updated
  product_id TEXT,
  product_name TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  email TEXT,
  buyer_name TEXT,
  sale_id TEXT,                                   -- Gumroad sale ID or Ko-fi order ID
  license_key TEXT,
  refunded INTEGER DEFAULT 0,
  subscription_id TEXT,
  timestamp TEXT NOT NULL,
  raw JSON,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_source ON sales(source);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_name);

CREATE TABLE IF NOT EXISTS daily_revenue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,                      -- YYYY-MM-DD
  source TEXT NOT NULL,
  gross REAL NOT NULL DEFAULT 0,
  refunds REAL NOT NULL DEFAULT 0,
  net REAL NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  milestone_type TEXT NOT NULL,                   -- bundle_sale | subscriber_100 | etc
  value TEXT NOT NULL,
  reached_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed initial daily rows for current month (D1-compatible)
-- Note: D1 SQLite does not support generate_series; use a fixed seed window or insert manually
-- Keeping this section as a comment; uncomment and adjust if needed in future
-- INSERT OR IGNORE INTO daily_revenue (date, source, gross, refunds, net, count)
-- VALUES
--   (date('now', '-0 days'), 'gumroad', 0, 0, 0, 0),
--   (date('now', '-1 days'), 'gumroad', 0, 0, 0, 0),
--   (date('now', '-2 days'), 'gumroad', 0, 0, 0, 0);
