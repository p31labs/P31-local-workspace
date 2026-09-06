#!/bin/bash
# K₄ CAGE — Deploy (CWP-30 unified Worker)
# P31 Labs, Inc.
#
# Prerequisites (once):
#   - wrangler.toml: set [[d1_databases]] database_id (npx wrangler d1 create p31-telemetry)
#   - npx wrangler d1 execute p31-telemetry --remote --file=../unified-k4-cage/schema.sql
#   - npx wrangler secret put ADMIN_TOKEN
#   - Optional: npx wrangler secret put INTERNAL_FANOUT_TOKEN (HTTP ping → WS broadcast)
#   - KV id already in wrangler.toml (K4_MESH); create only if missing.

set -euo pipefail
echo "K4 CAGE — deploy (unified topology + WebSocket room DOs)"
npx wrangler deploy
echo "Done. GET /api/mesh  WS /ws/family-mesh?node=demo  GET /health"
