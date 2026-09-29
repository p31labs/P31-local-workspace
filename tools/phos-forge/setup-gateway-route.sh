#!/usr/bin/env bash
# setup-gateway-route.sh — deploy the p31-intent dynamic route to AI Gateway.
#
# Cloudflare's dynamic-route API is THREE calls: create route → save version →
# deploy version. The create endpoint only handles the first deploy; later
# deploys must create a new version and deploy it. This script does the full
# sequence idempotently (by route name).
#
# Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (Workers AI:Read +
# AI Gateway:Edit scope). GATEWAY_ID defaults to p31-model-router.
#
# Usage:
#   CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... ./setup-gateway-route.sh
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}"
GATEWAY_ID="${GATEWAY_ID:-p31-model-router}"
ROUTE_NAME="p31-intent"
ROUTE_JSON="$(cd "$(dirname "$0")" && pwd)/gateway/p31-intent-route.json"
BASE="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai-gateway/gateways/${GATEWAY_ID}"

# 1. Create route (or find existing by name)
ROUTE_RESP=$(curl -s -X POST "${BASE}/routes" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${ROUTE_NAME}\",\"elements\":$(cat "${ROUTE_JSON}")}")
ROUTE_ID=$(echo "${ROUTE_RESP}" | jq -r '.result.id // empty')
if [ -z "${ROUTE_ID}" ]; then
  # Already exists — look it up by name.
  ROUTE_ID=$(curl -s "${BASE}/routes" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    | jq -r --arg n "${ROUTE_NAME}" '.result[] | select(.name == $n) | .id')
  if [ -z "${ROUTE_ID}" ]; then
    echo "ERROR: could not create or find route '${ROUTE_NAME}'"
    echo "${ROUTE_RESP}"
    exit 1
  fi
  echo "route '${ROUTE_NAME}' already exists (id ${ROUTE_ID}) — saving new version"
fi

# 2. Save a version of the route graph
VERSION_RESP=$(curl -s -X POST "${BASE}/routes/${ROUTE_ID}/versions" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"elements\":$(cat "${ROUTE_JSON}")}")
VERSION_ID=$(echo "${VERSION_RESP}" | jq -r '.result.id // empty')
if [ -z "${VERSION_ID}" ]; then
  echo "ERROR: version save failed"
  echo "${VERSION_RESP}"
  exit 1
fi

# 3. Deploy the version (makes it live)
DEPLOY_RESP=$(curl -s -X POST "${BASE}/routes/${ROUTE_ID}/deployments" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"version_id\":\"${VERSION_ID}\"}")
if echo "${DEPLOY_RESP}" | jq -e '.success == true' >/dev/null; then
  echo "✅ route '${ROUTE_NAME}' deployed (route ${ROUTE_ID}, version ${VERSION_ID})"
else
  echo "ERROR: deploy failed"
  echo "${DEPLOY_RESP}"
  exit 1
fi