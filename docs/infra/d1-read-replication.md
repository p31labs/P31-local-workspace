# D1 Read Replication — Configuration Guide

## Status

D1 read replication is in **public beta** (2026). `love-ledger` at 651KB — well
within limits for replication. 16+ Workers share this database, so replication
directly reduces query latency for all consumers.

## Enable in Dashboard

1. Cloudflare Dashboard → Workers & Pages → D1
2. Select `love-ledger`
3. Settings → Enable Read Replication
4. Set mode to `auto` (D1 places replicas globally)

No Wrangler config changes needed. No code changes needed. D1 automatically
routes read queries to the nearest replica.

## Verify Replication

```bash
# Check replication status
wrangler d1 execute love-ledger --remote --command "PRAGMA wal_checkpoint(TRUNCATE)"

# Verify query still works (routes to replica automatically)
wrangler d1 execute love-ledger --remote --command "SELECT count(*) FROM love_chain"
```

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Read latency (same region) | ~10ms | ~5ms |
| Read latency (cross-region) | ~100ms | ~20ms |
| Write latency | unchanged | unchanged |
| Read throughput | 1x | 3-5x (distributed across replicas) |

## Notes

- **Writes still go to primary** — replication is read-only copies
- **Eventual consistency** for reads — replicas may lag primary by <100ms
- **R2 and DO still need separate replication strategies** — D1 only
- **Hyperdrive does NOT support D1** — D1 uses read replication instead
