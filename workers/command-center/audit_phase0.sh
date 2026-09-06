#!/bin/bash
# Phase 0 Audit: Map legacy status.json → D1 schema + R2 forensics bucket
# EPCP Command Center Upgrade
set -e

BASE=/home/p31/andromeda/software/cloudflare-worker/command-center
STATUS_JSON=$BASE/status.json
AUDIT_DIR=$BASE/audit_phase0
D1_SCHEMA=$AUDIT_DIR/d1_schema.sql
R2_PLAN=$AUDIT_DIR/r2_buckets_plan.md
MAPPING=$AUDIT_DIR/status_to_d1_mapping.json

echo "=== PHASE 0 AUDIT: Legacy status.json → EPCP D1 Schema ==="
echo ""

# 1. Create audit directory
mkdir -p "$AUDIT_DIR"

# 2. Extract and pretty-print status.json structure
echo "→ Parsing status.json..."
cat "$STATUS_JSON" | python3 -m json.tool > "$AUDIT_DIR/status_pretty.json"

# 3. Analyze top-level keys
echo "→ Analyzing top-level structure..."
python3 << 'PYEOF'
import json, sys

with open('/home/p31/andromeda/software/cloudflare-worker/command-center/status.json') as f:
    status = json.load(f)

print("Top-level keys:", list(status.keys()))
print("")
for key in status:
    val = status[key]
    if isinstance(val, list):
        print(f"  {key}: list[{len(val)}]")
        if len(val) > 0:
            print(f"    Sample item keys: {list(val[0].keys()) if isinstance(val[0], dict) else type(val[0])}")
    elif isinstance(val, dict):
        print(f"  {key}: dict with keys {list(val.keys())}")
    else:
        print(f"  {key}: {type(val).__name__} = {val}")
PYEOF

# 4. Generate D1 schema (events + budgets)
echo ""
echo "→ Generating D1 schema..."
cat > "$D1_SCHEMA" << 'SQLEOF'
-- EPCP D1 Schema — Phase 0 Audit Output
-- Designed for Cloudflare D1 (SQLite at edge)

-- ==========================================
-- TABLE: events (append-only audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,                -- ISO 8601 timestamp
  actor TEXT,                        -- operator ID or system
  action TEXT NOT NULL,                -- deploy, panic, rollback, status_update, etc.
  target TEXT,                         -- worker / page / route
  diff_uri TEXT,                       -- R2 URI for JSON patch diff
  req_uri TEXT,                        -- R2 URI for captured request (masked PII)
  resp_uri TEXT,                       -- R2 URI for captured response (masked PII)
  sig TEXT,                            -- HMAC signature for tamper evidence
  legal_hold BOOLEAN DEFAULT 0,       -- frozen during discovery / litigation
  meta TEXT                            -- JSON blob for extra context
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_target ON events(target);

-- ==========================================
-- TABLE: budgets (dual-track: USD + stablecoin)
-- ==========================================
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  limit_usd REAL,                      -- traditional infra (CF, Twilio, OpenAI)
  limit_stablecoin REAL,               -- x402 agent micro-transactions (USDC)
  spent_usd DEFAULT 0,
  spent_stablecoin DEFAULT 0,
  alert_pct INTEGER DEFAULT 90,
  last_checked TEXT,
  meta TEXT                            -- JSON blob for extra context
);

-- ==========================================
-- TABLE: fleet_status (cached KV replacement)
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_status (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated TEXT NOT NULL
);

-- ==========================================
-- TABLE: forensic_artifacts (R2 object registry)
-- ==========================================
CREATE TABLE IF NOT EXISTS forensic_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,                     -- FK to events.id
  r2_uri TEXT NOT NULL,
  content_type TEXT,                     -- 'diff', 'request', 'response', 'artifact'
  size_bytes INTEGER,
  hmac_sig TEXT,
  retention_cold TEXT,                 -- ISO date when to move to Glacier
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_forensic_event ON forensic_artifacts(event_id);
SQLEOF

# 5. Generate R2 bucket plan
echo "→ Planning R2 buckets..."
cat > "$R2_PLAN" << 'R2EOF'
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
R2EOF

# 6. Generate status.json → D1 mapping
echo "→ Mapping status.json fields to D1 schema..."
python3 << 'PYEOF'
import json

with open('/home/p31/andromeda/software/cloudflare-worker/command-center/status.json') as f:
    status = json.load(f)

mapping = {
    "source_file": "status.json",
    "d1_target_table": "fleet_status",
    "fields": {}
}

# Map top-level keys to fleet_status KV-style entries
for key in status:
    if key == "workers":
        mapping["fields"][key] = {
            "action": "store_as_json",
            "table": "fleet_status",
            "key": f"section:{key}",
            "note": f"Array of {len(status[key])} worker objects; store as JSON blob"
        }
    elif key == "dates":
        mapping["fields"][key] = {
            "action": "store_as_json",
            "table": "fleet_status",
            "key": f"section:{key}",
            "note": f"Array of {len(status[key])} date entries"
        }
    else:
        mapping["fields"][key] = {
            "action": "store_as_json",
            "table": "fleet_status",
            "key": f"section:{key}",
            "note": f"Object with keys {list(status[key].keys()) if isinstance(status[key], dict) else type(status[key])}"
        }

# Sample worker entry → events table mapping
if status.get("workers"):
    sample_worker = status["workers"][0]
    mapping["worker_to_event_example"] = {
        "event_action": "status_update",
        "event_target": sample_worker["name"],
        "event_meta": {
            "status": sample_worker["status"],
            "url": sample_worker["url"]
        }
    }

with open('/home/p31/andromeda/software/cloudflare-worker/command-center/audit_phase0/status_to_d1_mapping.json', 'w') as f:
    json.dump(mapping, f, indent=2)

print("Mapping written to status_to_d1_mapping.json")
print("")
print("Sample D1 insert for worker status:")
print("""
INSERT INTO fleet_status (key, value, updated) VALUES
  ('section:workers', '[...JSON blob...]', '2026-04-23T10:00:00Z');
""")
PYEOF

# 7. Summary
echo ""
echo "=== PHASE 0 AUDIT COMPLETE ==="
echo "Artifacts:"
echo "  - D1 Schema: $D1_SCHEMA"
echo "  - R2 Plan: $R2_PLAN"
echo "  - Status Mapping: $MAPPING"
echo "  - Pretty-printed status: $AUDIT_DIR/status_pretty.json"
echo ""
echo "Next: Review outputs and proceed to Phase 1 (IAM integration)"
