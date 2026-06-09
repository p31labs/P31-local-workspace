#!/bin/bash
# Phase 2: Apply D1 schema via REST API (workaround for wrangler bug)
set -e

ACCOUNT_ID="ee05f70c889cb6f876b9925257e3a2fa"
DATABASE_ID="12ce6570-839e-431d-a14d-bd6002dc89e8"
API_TOKEN="${CF_API_TOKEN}"

if [ -z "$API_TOKEN" ]; then
  echo "ERROR: CF_API_TOKEN not set"
  exit 1
fi

echo "=== Applying D1 schema via REST API ==="
echo ""

# Read SQL file
SQL_CONTENT=$(cat audit_phase0/d1_schema.sql)

# Execute via API
RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)
  }")

echo "$RESPONSE" | jq .

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "=== ✅ Schema applied successfully ==="
else
  echo ""
  echo "=== ❌ Failed to apply schema ==="
  echo "$RESPONSE" | jq -r '.errors[] | "Error: \(.message) (code: \(.code))"'
  exit 1
fi
