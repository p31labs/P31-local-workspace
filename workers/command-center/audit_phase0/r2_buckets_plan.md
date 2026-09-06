# EPCP R2 Bucket Plan — Phase 0 Output

## Bucket: `p31-epcp-forensics-hot`
- **Purpose:** Hot storage for forensic payloads (diffs, request/response dumps)
- **Lifecycle:** 90 days → transition to `p31-epcp-forensics-cold`
- **Naming pattern:** `events/{YYYY}/{MM}/{DD}/{event_id}/{type}.json`
- **Example:** `events/2026/04/23/evt_12345/diff.json`

## Bucket: `p31-epcp-forensics-cold`
- **Purpose:** Cold archive for legal discovery (7 years retention)
- **Lifecycle:** Transition from hot after 90 days; delete after 7 years (2555 days)
- **Encryption:** Server-side encryption with Cloudflare-managed keys

## Bucket: `p31-epcp-artifacts`
- **Purpose:** Immutable deploy artifacts (WASM/JS bundles) for panic rollback
- **Lifecycle:** Keep last N=5 artifacts per worker; delete older
- **Naming pattern:** `artifacts/{worker_name}/{version}/{bundle}.wasm`
- **Example:** `artifacts/p31-ca/v1.2.3/bundle.wasm`

## Bucket: `p31-epcp-audit-exports`
- **Purpose:** Encrypted audit trail exports for discovery (legal hold)
- **Lifecycle:** Keep for 7 years; require legal token to download
- **Format:** JSONL (one event per line) + HMAC signature file
- **Example:** `exports/2026-04-01_to_2026-04-30.jsonl`

## Cost Estimate (per month)
- Hot forensics: ~$0.015/GB stored + $0.01/GB egress
- Cold archive: ~$0.002/GB stored
- Artifacts: Negligible (small WASM bundles)
- Exports: Negligible (generated on-demand)

## Wrangler Commands (Phase 2)
```bash
wrangler r2 bucket create p31-epcp-forensics-hot
wrangler r2 bucket create p31-epcp-forensics-cold
wrangler r2 bucket create p31-epcp-artifacts
wrangler r2 bucket create p31-epcp-audit-exports
```
