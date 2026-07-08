CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_love_earned REAL DEFAULT 0,
  total_spoons_spent REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS balances (
  user_id TEXT PRIMARY KEY,
  total_earned REAL NOT NULL DEFAULT 0,
  sovereignty_pool REAL NOT NULL DEFAULT 0,
  performance_pool REAL NOT NULL DEFAULT 0,
  care_score REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
