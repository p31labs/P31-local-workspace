# D1 Migration Rollback Procedures

**Date:** 2026-07-15

---

## Overview

30 migration SQL files exist across 6 D1 databases. For each migration, a rollback procedure exists:

| Complexity | Count | Procedure |
|-----------|-------|-----------|
| **SIMPLE** | 14 | Run companion `_down.sql` via `wrangler d1 execute` |
| **MEDIUM** | 12 | Manual export-then-drop documented below |
| **HARD** | 4 | Restore from R2 cold archive — NEVER auto-drop |

---

## SIMPLE Rollback (14 migrations)

Run the companion `_down.sql` file:

```bash
wrangler d1 execute {DB_NAME} --remote --file={migration_name}_down.sql
```

Companion files exist at each migration's path:
- `love-ledger/migrations/004_replay_telemetry_down.sql` through `014_arcade_scores_down.sql` (7 files)
- `sovereign-justice/migrations/0001_rag_corpus_down.sql`
- `sovereign-justice/migrations/002_auth_registry_down.sql`
- `p31-cortex/migrations/0002_seed_legal_deadlines_down.sql`
- `personal-swarm/migrations/0001_fractal_down.sql`
- `jitterbug-api/migrations/001_usertest_down.sql`
- `migrations/001_initial_down.sql`
- `migrations/003_add_ephemeralization_down.sql`

---

## MEDIUM Rollback (12 migrations)

### Column-drop rollbacks (5 migrations)

These migrations added columns via `ALTER TABLE ADD COLUMN`. Rollback drops those columns:

```bash
# 003_creation_accounting — love-ledger
wrangler d1 execute LOVE_DB --remote --command "ALTER TABLE love_chain DROP COLUMN metadata;"

# 007_pqc_sig — love-ledger
wrangler d1 execute LOVE_DB --remote --command "ALTER TABLE love_chain DROP COLUMN signature_pqc;"

# 0005_phase3_odr — sovereign-justice-db
wrangler d1 execute JUSTICE_D1 --remote --command "ALTER TABLE agency_submissions DROP COLUMN jurisdiction_id;"
wrangler d1 execute JUSTICE_D1 --remote --command "ALTER TABLE agency_submissions DROP COLUMN service_request_id;"

# 002_add_recursive_fields — jitterbug-db
wrangler d1 execute {jitterbug_db} --remote --command "ALTER TABLE brain_dumps DROP COLUMN max_depth;"
# ... (6 columns total — run DROP COLUMN for each)

# 003_add_ephemeralization — jitterbug-db
wrangler d1 execute {jitterbug_db} --remote --command "ALTER TABLE brain_dumps DROP COLUMN purge_at;"
```

### Table-drop rollbacks (7 migrations)

**WARNING: These drops destroy all data in the table.** Export before running:

```bash
# Export data first
wrangler d1 execute {DB_NAME} --remote --json \
  --command "SELECT * FROM {table_name};" > /tmp/{table_name}_backup.json

# Then drop (in FK order — children before parents)
wrangler d1 execute {DB_NAME} --remote \
  --command "DROP TABLE IF EXISTS {child}; DROP TABLE IF EXISTS {parent};"
```

Affected migrations: `001_initial` (love-ledger), `001_care_mesh_aggregates`, `001_contracts`, `001_initial` (governance-engine), `0001_initial` (p31-cortex), `0003_escrow_engine`, `0005_phase3_odr` (tables only).

---

## HARD Rollback (4 migrations)

**These tables contain court-admissible legal evidence. NEVER auto-drop them.**

1. `002_love_chain` — Hash-chained care attestation records. Restore from R2 cold archive (`LOVE_ARCHIVE` bucket).
2. `010_care_contracts` — PQC-encrypted care contracts. Restore from backup; encrypted terms cannot be recreated without counterparty keys.
3. `0002_evidence_vault` — Dual-signed evidence with hash chain-of-custody. Restore `evidence_chain` and `evidence_items` from backup.
4. `0004_civicroute_domains` — **Destructive migration (DO NOT RE-RUN).** Creates and drops tables; if re-run, data in original tables is lost. If mid-migration failure: restore from pre-migration backup.

### Recovery procedure for HARD migrations:

```bash
# 1. Verify R2 cold archive is current
wrangler d1 execute LOVE_DB --remote --command "SELECT id, created_at FROM love_chain ORDER BY created_at DESC LIMIT 1;"

# 2. Restore from R2 (love-ledger example)
# The love-ledger R2 bucket stores per-DID WORM archives.
# Contact P31 ops for manual R2 restore.

# 3. Rebuild indexes after restore
wrangler d1 execute LOVE_DB --remote --command "CREATE INDEX IF NOT EXISTS idx_love_chain_did ON love_chain(from_did);"
wrangler d1 execute LOVE_DB --remote --command "CREATE INDEX IF NOT EXISTS idx_love_chain_type ON love_chain(type);"
```

---

## Before Any Migration

```
1. wrangler d1 execute {DB_NAME} --remote --json --command "SELECT * FROM {table_name};" > /tmp/backup_{table_name}.json
2. Verify the backup file is non-empty: wc -l /tmp/backup_{table_name}.json
3. Run the migration
4. Verify: wrangler d1 execute {DB_NAME} --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' ORDER BY name;"
```
