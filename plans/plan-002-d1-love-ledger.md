# PLAN-002: Cloudflare D1 — LOVE Ledger Provisioning

## Problem

`software/workers/wrangler.toml` has `LOVE_D1` commented out (L34-37). The `love-ledger.ts` worker is fully implemented — it reads `env.LOVE_D1`, runs migrations, executes all SQL. It just needs a bound D1 database to exist.

## D1 Schema (from `love-ledger.ts` L106-157)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_love_earned REAL DEFAULT 0,
  total_spoons_spent REAL DEFAULT 0
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  total_earned REAL DEFAULT 0,
  sovereignty_pool REAL DEFAULT 0,
  performance_pool REAL DEFAULT 0,
  care_score REAL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE care_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  care_action TEXT NOT NULL,
  intensity REAL DEFAULT 0.5,
  context TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Steps

### Step 1 — Provision D1 Database (CLI)

```bash
cd software/workers

# Create the database
wrangler d1 create love-ledger
# Output: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# Output: database_name = "love-ledger"

# The create command returns the ID. Substitute it below.
```

### Step 2 — Update `wrangler.toml` (automated below)

Uncomment the `LOVE_D1` block in `software/workers/wrangler.toml` and insert the real `database_id`:

```toml
[[d1_databases]]
binding = "LOVE_D1"
database_name = "love-ledger"
database_id = "REPLACE_WITH_ACTUAL_ID"
```

### Step 3 — Apply Schema via Wrangler

```bash
cd software/workers

# Apply the inline schema (tables defined at top of love-ledger.ts)
wrangler d1 execute love-ledger --remote --file=./schema.sql

# Or pipe the CREATE TABLE statements directly:
wrangler d1 execute love-ledger --remote --command="
  CREATE TABLE IF NOT EXISTS users (...);
  CREATE TABLE IF NOT EXISTS transactions (...);
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
  CREATE TABLE IF NOT EXISTS balances (...);
  CREATE TABLE IF NOT EXISTS care_logs (...);
"
```

### Step 4 — Deploy Worker

```bash
cd software/workers
wrangler deploy
```

Worker route is `love-ledger.trimtab-signal.workers.dev`. Test:

```bash
curl https://love-ledger.trimtab-signal.workers.dev/api/health
```

## Frontend Integration (Future)

Once D1 is live, the BONDING iframe can POST LOVE earnings to the ledger via `love-ledger.trimtab-signal.workers.dev/api/love/earn`. The `useBondingHandshake` postMessage hook already exists (WCD-M12) — it just needs a ledger endpoint target.

## Rollback

```bash
wrangler d1 delete love-ledger --remote
# Comment out LOVE_D1 block in wrangler.toml
# wrangler deploy
```

## Priority

**High.** LOVE ledger is the core economic infrastructure. Blocks BONDING ↔ Spaceship Earth token sync. Must be live before the Ko-fi Node Count milestones have real backend backing.
