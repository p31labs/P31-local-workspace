#!/usr/bin/env bash
set -euo pipefail

# P31 Genesis Gate — Base Mainnet Deployment Script
# Deploys LOVEToken, LOVESBT, ProofOfCare to Base (chain ID 8453)
# 
# Prerequisites:
#   - Base ETH in deployer wallet (0x01...8413) — ~0.01 ETH sufficient
#   - Foundry installed with Base RPC configured in foundry.toml
#   - BASESCAN_API_KEY in environment or foundry.toml
#
# Usage:
#   ./deploy-base.sh [--verify]
#
# The script captures contract addresses and saves them to .deployed-addresses.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHAIN_ID=8453
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"
OUTPUT_FILE="${SCRIPT_DIR}/.deployed-addresses.json"

VERIFY_FLAG=""
if [[ "${1:-}" == "--verify" ]]; then
    VERIFY_FLAG="--verify"
    echo "🔍 Verification enabled — Basescan API key required"
fi

echo "🚀 Deploying P31 Capital Machine to Base Mainnet..."
echo "   Chain ID: ${CHAIN_ID}"
echo "   RPC: \${BASE_RPC} or https://mainnet.base.org"
echo ""

cd "${SCRIPT_DIR}"

# Run forge script and capture output
OUTPUT=$(forge script script/DeployAll.s.sol:DeployAll \
    --rpc-url "${BASE_RPC:-https://mainnet.base.org}" \
    --account default \
    --broadcast \
    ${VERIFY_FLAG} \
    --ffi 2>&1) || {
    echo "❌ Deployment failed:"
    echo "${OUTPUT}"
    exit 1
}

echo "${OUTPUT}"
echo ""
echo "✅ Deployment complete!"

# Extract addresses from output
LOVE_TOKEN=$(echo "${OUTPUT}" | grep -oP 'LOVEToken:\s*\K0x[a-fA-F0-9]{40}' || true)
LOVE_SBT=$(echo "${OUTPUT}" | grep -oP 'LOVESBT:\s*\K0x[a-fA-F0-9]{40}' || true)
PROOF_OF_CARE=$(echo "${OUTPUT}" | grep -oP 'ProofOfCare:\s*\K0x[a-fA-F0-9]{40}' || true)

if [[ -n "${LOVE_TOKEN}" && -n "${LOVE_SBT}" && -n "${PROOF_OF_CARE}" ]]; then
    cat > "${OUTPUT_FILE}" <<EOF
{
  "network": "base",
  "chainId": ${CHAIN_ID},
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "0x51c285Df171C76bE36252e32679F098d90768413",
  "contracts": {
    "LOVEToken": "${LOVE_TOKEN}",
    "LOVESBT": "${LOVE_SBT}",
    "ProofOfCare": "${PROOF_OF_CARE}"
  },
  "burnAddress": "${BURN_ADDRESS}",
  "abdicationStatus": "pending"
}
EOF
    echo ""
    echo "📄 Addresses saved to ${OUTPUT_FILE}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify contracts on Basescan:"
    echo "     https://basescan.org/address/${LOVE_TOKEN}#code"
    echo "     https://basescan.org/address/${LOVE_SBT}#code"
    echo "     https://basescan.org/address/${PROOF_OF_CARE}#code"
    echo ""
    echo "  2. Update care-api worker secrets:"
    echo "     cd /home/p31/P31-local-workspace/workers/care-api"
    echo "     wrangler secret put LOVE_TOKEN_ADDRESS --value ${LOVE_TOKEN}"
    echo "     wrangler secret put LOVE_SBT_ADDRESS --value ${LOVE_SBT}"
    echo "     wrangler secret put PROOF_OF_CARE_ADDRESS --value ${PROOF_OF_CARE}"
    echo "     wrangler deploy"
    echo ""
    echo "  3. After 24h buffer, execute abdication:"
    echo "     cast send ${LOVE_TOKEN} \"transferOwnership(address)\" ${BURN_ADDRESS} --rpc-url https://mainnet.base.org --account default"
    echo "     cast send ${LOVE_SBT} \"transferOwnership(address)\" ${BURN_ADDRESS} --rpc-url https://mainnet.base.org --account default"
    echo "     cast send ${PROOF_OF_CARE} \"transferOwnership(address)\" ${BURN_ADDRESS} --rpc-url https://mainnet.base.org --account default"
else
    echo "⚠️  Could not auto-extract addresses. Parse manually from output above."
fi
