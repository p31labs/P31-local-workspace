# Phase 2: D1 Migration + R2 Routing (Infrastructure)

**Status:** In Progress (D1 schema applied locally; remote pending API token)  
**Owner:** Platform  
**ETA:** 3 days  

---

## 1. Completed

### 1.1 D1 Database Provisioned
- **Database name:** `epcp-audit`
- **Database ID:** `12ce6570-839e-431d-a14d-bd6002dc89e8`
- **Binding:** `EPCP_DB` (in wrangler.toml)
- **Schema applied locally:** `audit_phase0/d1_schema.sql`
  - Tables: `events`, `budgets`, `fleet_status`, `forensic_artifacts`
  - Indexes: `idx_events_ts`, `idx_events_action`, `idx_events_target`, `idx_forensic_event`

### 1.2 Worker Integration
- `handleStatusWrite` now writes to D1 `fleet_status` table when `env.EPCP_DB` is available
- Logs actor (`auth.sub`) from Cloudflare Access JWT
- Graceful fallback if D1 is not yet bound

### 1.3 Wrangler Config Updated
- `wrangler.toml` now has:
  ```toml
  [[d1_databases]]
  binding = "EPCP_DB"
  database_name = "epcp-audit"
  database_id = "12ce6570-839e-431d-a14d-bd6002dc89e8"
  ```
- `CF_TEAM_DOMAIN = "trimtab-signal"` added for JWT validation

---

## 2. Blocking Issues

### 2.1 R2 Not Enabled
- R2 storage requires enabling via Cloudflare Dashboard
- **Action:** Go to Cloudflare Dashboard → R2 → Enable
- **Cost:** $0.015/GB stored + $0.01/GB egress (negligible for forensics)

### 2.2 D1 Remote API Error
- `wrangler d1 execute epcp-audit --remote` fails with code 7404
- **Workaround:** Use REST API directly once `CF_API_TOKEN` is set via `wrangler secret put CF_API_TOKEN`
- **Script ready:** `apply_schema_api.sh` (uses REST API)

### 2.3 Missing CF_API_TOKEN Secret
- `CF_API_TOKEN` needed for:
  - D1 remote schema application
  - Cloud Hub summary (`/api/cf/summary`)
- **Action:** `wrangler secret put CF_API_TOKEN` (requires Cloudflare API token with edit permissions)

---

## 3. Next Steps

### 3.1 Enable R2 (Day 1)
1. Dashboard → R2 → Enable
2. Run:
   ```bash
   npx wrangler r2 bucket create p31-epcp-forensics-hot
   npx wrangler r2 bucket create p31-epcp-forensics-cold
   npx wrangler r2 bucket create p31-epcp-artifacts
   npx wrangler r2 bucket create p31-epcp-audit-exports
   ```

### 3.2 Set CF_API_TOKEN (Day 1)
```bash
npx wrangler secret put CF_API_TOKEN
# Paste Cloudflare API token (with Account:Edit permissions)
```

### 3.3 Apply D1 Schema Remotely (Day 2)
```bash
# Once CF_API_TOKEN is set:
export CF_API_TOKEN="..."
bash apply_schema_api.sh
```

### 3.4 Update Worker for R2 (Day 3)
- Add R2 bindings to wrangler.toml:
  ```toml
  [[r2_buckets]]
  binding = "FORENSICS_HOT"
  bucket_name = "p31-epcp-forensics-hot"
  ```
- Update `handleStatusWrite` to store large diffs in R2 (return URI, store in D1 `events.diff_uri`)

---

## 4. Verification Checklist

- [ ] R2 enabled in Dashboard
- [ ] 4 R2 buckets created
- [ ] `CF_API_TOKEN` secret set
- [ ] D1 schema applied remotely (verify via `wrangler d1 execute epcp-audit --remote --command "SELECT name FROM sqlite_master WHERE type='table';"`)
- [ ] Worker can write to D1 `fleet_status` table
- [ ] Worker can write to R2 `p31-epcp-forensics-hot`
- [ ] Cloud Hub summary works (`curl -H "Authorization: Bearer ..." /api/cf/summary`)

---

## 5. Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| D1 (epcp-audit) | Free tier (1 GB DB, 100K reads, 1K writes) |
| R2 (forensics) | ~$0.015/GB stored (est. <1GB → ~$0.02/mo) |
| R2 (artifacts) | Negligible (small WASM bundles) |
| Worker invocations | Free tier (100K requests/day) |
| **Total** | **~$0.02/month** |

---

**Phase 2 Status:** Blocked on R2 enablement + CF_API_TOKEN. Ready to proceed once secrets are set.
