# D1 Migration Script — LOVE Ledger Schema v1.1

## Purpose
Migrate the LOVE ledger D1 database from INTEGER to REAL for all LOVE amount columns to support decimal values (e.g., 0.5 LOVE from split pools).

## Current Schema (Broken)

```sql
-- These columns use INTEGER which truncates decimals
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  total_love_earned INTEGER DEFAULT 0,  -- WRONG: should be REAL
  total_spoons_spent INTEGER DEFAULT 0  -- WRONG: should be REAL
);

CREATE TABLE transactions (
  amount INTEGER NOT NULL,  -- WRONG: should be REAL
  ...
);

CREATE TABLE balances (
  balance REAL NOT NULL DEFAULT 0,  -- Already REAL (correct)
);
```

## Migration Script

Run this against your D1 database via `wrangler d1 execute`:

```bash
# Step 1: Create backup table
wrangler d1 execute LOVE_DB --command "
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS transactions_backup AS SELECT * FROM transactions;
CREATE TABLE IF NOT EXISTS balances_backup AS SELECT * FROM balances;
"

# Step 2: Drop and recreate with REAL columns
wrangler d1 execute LOVE_DB --command "
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_love_earned REAL DEFAULT 0,
  total_spoons_spent REAL DEFAULT 0
);

DROP TABLE IF EXISTS transactions;
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

DROP TABLE IF EXISTS balances;
CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"

# Step 3: Recreate indexes
wrangler d1 execute LOVE_DB --command "
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
"

# Step 4: Copy data back with CAST
wrangler d1 execute LOVE_DB --command "
INSERT INTO users (id, wallet_address, created_at, updated_at, total_love_earned, total_spoons_spent)
SELECT id, wallet_address, created_at, updated_at, 
       CAST(total_love_earned AS REAL), 
       CAST(total_spoons_spent AS REAL)
FROM users_backup;

INSERT INTO transactions (id, user_id, type, amount, description, metadata, created_at)
SELECT id, user_id, type, CAST(amount AS REAL), description, metadata, created_at
FROM transactions_backup;

INSERT INTO balances (user_id, balance, updated_at)
SELECT user_id, balance, updated_at
FROM balances_backup;
"

# Step 5: Verify and cleanup
wrangler d1 execute LOVE_DB --command "
-- Check a few rows
SELECT id, total_love_earned FROM users LIMIT 3;
SELECT id, amount FROM transactions LIMIT 3;

-- Drop backup tables
DROP TABLE IF EXISTS users_backup;
DROP TABLE IF EXISTS transactions_backup;
DROP TABLE IF EXISTS balances_backup;
"
```

## Alternative: Zero-Downtime Migration (For Production)

If you can't afford downtime, create new columns with REAL type, migrate data, then swap:

```sql
-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN total_love_earned_new REAL;
ALTER TABLE transactions ADD COLUMN amount_new REAL;

-- Step 2: Migrate data
UPDATE users SET total_love_earned_new = CAST(total_love_earned AS REAL);
UPDATE transactions SET amount_new = CAST(amount AS REAL);

-- Step 3: Verify
SELECT total_love_earned, total_love_earned_new FROM users;

-- Step 4: Swap column names (requires table rebuild in D1)
-- For D1, simpler to use the full migration above

-- Step 5: Drop old columns
ALTER TABLE users DROP COLUMN total_love_earned;
ALTER TABLE transactions DROP COLUMN amount;

-- Step 6: Rename new columns
ALTER TABLE users RENAME COLUMN total_love_earned_new TO total_love_earned;
ALTER TABLE transactions RENAME COLUMN amount_new TO amount;
```

## Verification Query

After migration, verify decimal support:

```sql
SELECT 
  'Users total_love_earned' as test,
  CASE WHEN typeof(total_love_earned) = 'real' THEN 'PASS' ELSE 'FAIL' END as result
UNION ALL
SELECT 
  'Transactions amount' as test,
  CASE WHEN typeof(amount) = 'real' THEN 'PASS' ELSE 'FAIL' END as result
UNION ALL
SELECT 
  'Balances balance' as test,
  CASE WHEN typeof(balance) = 'real' THEN 'PASS' ELSE 'FAIL' END as result;
```

## Rollback Plan

If migration fails:

```bash
# Restore from backup (if backup tables still exist)
wrangler d1 execute LOVE_DB --command "
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS balances;

ALTER TABLE users_backup RENAME TO users;
ALTER TABLE transactions_backup RENAME TO transactions;
ALTER TABLE balances_backup RENAME TO balances;

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
"
```

## Post-Migration

After schema is fixed, implement Two-Pool logic in worker to compute sovereignty/performance split per transaction.

## Notes

- D1 doesn't support `ALTER TABLE` in the same way as Postgres — the full migration creates new tables
- Backup tables provide safety net
- The migration script assumes reasonable table size (<100k rows)
- For large tables, consider batched inserts in Step 4