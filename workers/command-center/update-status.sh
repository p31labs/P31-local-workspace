#!/bin/bash
# P31 Labs — Status Update Script (CWP-043)
# Usage: ./update-status.sh [path/to/status.json]
#
# Tries HTTP POST first (requires Access session or service token).
# Falls back to wrangler KV direct write if POST returns 301/302/401/403.
#
# Token (first match wins):
#   1) Environment variable COMMAND_CENTER_STATUS_TOKEN
#   2) ENV_FILE (default: repo-root .env.master)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_FILE="${1:-$SCRIPT_DIR/status.json}"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
DEFAULT_ENV="${REPO_ROOT:+$REPO_ROOT/}.env.master"
ENV_FILE="${ENV_FILE:-$DEFAULT_ENV}"

# Resolve wrangler: prefer p31ca local install, then global
WRANGLER=""
for candidate in \
  "$REPO_ROOT/software/p31ca/node_modules/.bin/wrangler" \
  "$(command -v wrangler 2>/dev/null || true)"; do
  [ -x "$candidate" ] && { WRANGLER="$candidate"; break; }
done

KV_NAMESPACE_ID="ff890e80e7e64ae8b8afb59870f1a0f6"
KV_KEY="status"

if [ ! -f "$STATUS_FILE" ]; then
  echo "Error: $STATUS_FILE not found"
  exit 1
fi

# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('$STATUS_FILE','utf8'))" 2>/dev/null || {
  echo "Error: Invalid JSON in $STATUS_FILE"
  exit 1
}

# Extract token (optional — only needed for HTTP path)
TOKEN=""
if [ -n "${COMMAND_CENTER_STATUS_TOKEN:-}" ]; then
  TOKEN="$COMMAND_CENTER_STATUS_TOKEN"
elif [ -f "$ENV_FILE" ]; then
  TOKEN=$(grep '^COMMAND_CENTER_STATUS_TOKEN=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)
fi

# ── Try HTTP POST ────────────────────────────────────────────────────────────
HTTP_OK=false
if [ -n "$TOKEN" ]; then
  echo "Trying HTTP POST to command-center…"
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    https://command-center.trimtab-signal.workers.dev/api/status \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$STATUS_FILE")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ HTTP POST succeeded (HTTP 200)"
    HTTP_OK=true
  else
    echo "  HTTP returned $HTTP_CODE — falling back to wrangler KV write"
  fi
else
  echo "No token available — skipping HTTP POST, using wrangler KV write directly"
fi

# ── Fallback: wrangler KV direct write ───────────────────────────────────────
if [ "$HTTP_OK" = "false" ]; then
  if [ -z "$WRANGLER" ]; then
    echo "Error: wrangler not found. Install with: npm i -g wrangler && wrangler login"
    exit 1
  fi
  echo "Writing $STATUS_FILE → KV '$KV_KEY' (ns: $KV_NAMESPACE_ID) via wrangler…"
  "$WRANGLER" kv key put \
    --namespace-id "$KV_NAMESPACE_ID" \
    "$KV_KEY" \
    --path "$STATUS_FILE" \
    --remote
  echo "✓ KV write succeeded"
fi

echo "  Dashboard: https://command-center.trimtab-signal.workers.dev"
