#!/usr/bin/env bash
#
# launch-mainnet.sh — One-button P31 Sovereign Chain deployment to Base mainnet.
#
# CODE-ONLY / NO BROADCAST unless DEPLOYER_PRIVATE_KEY is set AND funded.
# Abdication (transferOwnership -> burn address) is intentionally LEFT MANUAL
# and irreversible — run it only after a 24h observation buffer.

set -euo pipefail

# Script lives in <repo>/scripts/, so go up one level to the repo root,
# then into the contract package.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}/bonding-soup/packages/p31-sovereign-chain"

export BASE_RPC="${BASE_RPC:-https://mainnet.base.org}"
export DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-${DEPLOYER_PK:-}}"

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "❌ DEPLOYER_PRIVATE_KEY not set — aborting (no broadcast)."
  exit 1
fi

# Check balance (warn, don't hard-crash on decimal formatting).
DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY" 2>/dev/null || echo "")"
if [ -n "$DEPLOYER_ADDR" ]; then
  BALANCE="$(cast balance "$DEPLOYER_ADDR" --rpc-url "$BASE_RPC" 2>/dev/null || echo "0")"
  echo "💰 Deployer ($DEPLOYER_ADDR) balance: $BALANCE ETH"
  if [[ "$BALANCE" == "0" || "$BALANCE" == "0.0" ]]; then
    echo "❌ Deployer has no ETH on Base mainnet — aborting."
    exit 1
  fi
fi

echo "🧹 forge clean && forge build"
forge clean && forge build

echo "🚀 Deploying to Base mainnet..."
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url "$BASE_RPC" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast \
  --verify

# Extract addresses from the console.log output.
OUTPUT="$(forge script script/DeployAll.s.sol:DeployAll --rpc-url "$BASE_RPC" --private-key "$DEPLOYER_PRIVATE_KEY" 2>&1)"
LOVESBT="$(echo "$OUTPUT" | grep -oP 'LOVESBT:\s*\K0x[a-fA-F0-9]{40}' | head -1)"
PROOFOFCARE="$(echo "$OUTPUT" | grep -oP 'ProofOfCare:\s*\K0x[a-fA-F0-9]{40}' | head -1)"
GENESISSPARK="$(echo "$OUTPUT" | grep -oP 'GenesisSpark:\s*\K0x[a-fA-F0-9]{40}' | head -1)"

cat > deploy-info.json <<EOF
{
  "network": "base-mainnet",
  "chainId": 8453,
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "$DEPLOYER_ADDR",
  "contracts": {
    "LOVESBT": "$LOVESBT",
    "ProofOfCare": "$PROOFOFCARE",
    "GenesisSpark": "$GENESISSPARK"
  }
}
EOF

echo "✅ Deployment complete:"
cat deploy-info.json
echo ""
echo "⚠️  Abdication is MANUAL and irreversible. After a 24h buffer, run:"
echo "    cast send $LOVESBT \"transferOwnership(address)\" 0x000000000000000000000000000000000000dEaD --rpc-url $BASE_RPC --private-key \$DEPLOYER_PRIVATE_KEY"
echo "    cast send $PROOFOFCARE \"transferOwnership(address)\" 0x000000000000000000000000000000000000dEaD --rpc-url $BASE_RPC --private-key \$DEPLOYER_PRIVATE_KEY"
