#!/usr/bin/env bash
set -euo pipefail

# P31 Genesis Gate — Base Mainnet Deployment Script
# Deploys LOVESBT, ProofOfCare, GenesisSpark to Base (chain ID 8453)
# (LOVEToken archived in Phase 1 — no on-chain LOVE ERC20)
# 
# Prerequisites:
#   - Base ETH in deployer wallet (0x51c285...8413) — ≥0.01 ETH sufficient
#   - Foundry installed with Base RPC configured in foundry.toml
#   - BASESCAN_API_KEY in environment or foundry.toml (for --verify)
#   - One of: --private-key, --interactive, or DEPLOYER_PK env var
#
# Usage:
#   ./deploy-base.sh [--verify] [--private-key <key>]
#   DEPLOYER_PK=0x... ./deploy-base.sh --verify
#
# The script captures contract addresses and saves them to .deployed-addresses.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHAIN_ID=8453

# DeployAll.s.sol reads DEPLOYER_PRIVATE_KEY; reconcile the DEPLOYER_PK alias
# so both the Forge script (env) and the --private-key flag resolve to the same key.
export DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-${DEPLOYER_PK:-}}"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"
OUTPUT_FILE="${SCRIPT_DIR}/.deployed-addresses.json"

VERIFY_FLAG=""
SIGNER_FLAG=""
for arg in "$@"; do
    case "${arg}" in
        --verify) VERIFY_FLAG="--verify" ;;
        --private-key=*) SIGNER_FLAG="--private-key ${arg#*=}" ;;
        --interactive) SIGNER_FLAG="--interactive" ;;
    esac
done

# Fallback to env var or interactive prompt
if [[ -z "${SIGNER_FLAG}" ]]; then
    if [[ -n "${DEPLOYER_PK:-}" ]]; then
        SIGNER_FLAG="--private-key ${DEPLOYER_PK}"
        echo "🔑 Using DEPLOYER_PK environment variable"
    else
        echo "🔑 No signing method specified."
        echo "   Options:"
        echo "     1) --private-key 0x... (paste key)"
        echo "     2) DEPLOYER_PK=0x... ./deploy-base.sh (env var)"
        echo "     3) --interactive (prompt)"
        echo ""
        read -p "Choose method (1/2/3, or enter private key directly): " choice
        if [[ "${choice}" == "1" || "${choice}" == "--private-key" ]]; then
            read -s -p "Enter deployer private key: " pk
            echo ""
            SIGNER_FLAG="--private-key ${pk}"
        elif [[ "${choice}" == "3" || "${choice}" == "--interactive" ]]; then
            SIGNER_FLAG="--interactive"
        else
            SIGNER_FLAG="--private-key ${choice}"
        fi
    fi
fi

if [[ -n "${VERIFY_FLAG}" ]]; then
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
    ${SIGNER_FLAG} \
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
LOVE_SBT=$(echo "${OUTPUT}" | grep -oP 'LOVESBT:\s*\K0x[a-fA-F0-9]{40}' || true)
PROOF_OF_CARE=$(echo "${OUTPUT}" | grep -oP 'ProofOfCare:\s*\K0x[a-fA-F0-9]{40}' || true)
GENESIS_SPARK=$(echo "${OUTPUT}" | grep -oP 'GenesisSpark:\s*\K0x[a-fA-F0-9]{40}' || true)

if [[ -n "${LOVE_SBT}" && -n "${PROOF_OF_CARE}" ]]; then
    cat > "${OUTPUT_FILE}" <<EOF
{
  "network": "base",
  "chainId": ${CHAIN_ID},
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "0x51c285Df171C76bE36252e32679F098d90768413",
  "contracts": {
    "LOVESBT": "${LOVE_SBT}",
    "ProofOfCare": "${PROOF_OF_CARE}",
    "GenesisSpark": "${GENESIS_SPARK:-not deployed}"
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
    echo "     https://basescan.org/address/${LOVE_SBT}#code"
    echo "     https://basescan.org/address/${PROOF_OF_CARE}#code"
    if [[ -n "${GENESIS_SPARK}" ]]; then
    echo "     https://basescan.org/address/${GENESIS_SPARK}#code"
    fi
    echo ""
    echo "  2. Update care-api worker secrets:"
    echo "     cd /home/p31/P31-local-workspace/workers/care-api"
    echo "     wrangler secret put LOVE_SBT_ADDRESS --value ${LOVE_SBT}"
    echo "     wrangler secret put PROOF_OF_CARE_ADDRESS --value ${PROOF_OF_CARE}"
    echo "     wrangler deploy"
    echo ""
    echo "  3. After 24h buffer, execute abdication:"
    echo "     cast send ${LOVE_SBT} \"transferOwnership(address)\" ${BURN_ADDRESS} --rpc-url https://mainnet.base.org --account default"
    echo "     cast send ${PROOF_OF_CARE} \"transferOwnership(address)\" ${BURN_ADDRESS} --rpc-url https://mainnet.base.org --account default"
    echo ""
    echo "  4. Mint Genesis Spark to first donor (after funding threshold met):"
    echo "     cast send ${GENESIS_SPARK} \"ignite(address,string)\" <DONOR_WALLET> <TX_HASH> --rpc-url https://mainnet.base.org --private-key <KEY>"
else
    echo "⚠️  Could not auto-extract addresses. Parse manually from output above."
fi
