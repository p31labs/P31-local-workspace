#!/usr/bin/env bash
set -euo pipefail

# abdicate-contracts.sh — Smart Contract Abdication Protocol
# Transfers ownership of deployed contracts to 0x000...dEaD burn address
# Per PAPER-XXV: "permanently transfers ownership of foundational smart contracts
# to an unrecoverable burn address, transitioning the project into a headless,
# unbreakable utility governed by mathematical law"
#
# Usage:
#   ./abdicate-contracts.sh [--network base|sepolia]
#
# Requirements:
#   - Foundry cast CLI
#   - Deployer account with owner privileges
#   - Addresses file at .deployed-addresses.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK="${1:-base}"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"

# Load deployed addresses
ADDRESSES_FILE="${SCRIPT_DIR}/.deployed-addresses.json"
if [[ ! -f "${ADDRESSES_FILE}" ]]; then
    echo "❌ Error: ${ADDRESSES_FILE} not found. Run deploy-base.sh first."
    exit 1
fi

# Parse addresses using python or jq
if command -v python3 &> /dev/null; then
    LOVE_SBT=$(python3 -c "import json; print(json.load(open('${ADDRESSES_FILE}'))['contracts']['LOVESBT'])")
    PROOF_OF_CARE=$(python3 -c "import json; print(json.load(open('${ADDRESSES_FILE}'))['contracts']['ProofOfCare'])")
else
    echo "❌ python3 required to parse addresses file"
    exit 1
fi

RPC_FLAG=""
case "${NETWORK}" in
    base)
        RPC_URL="${BASE_RPC:-https://mainnet.base.org}"
        CHAIN_ID=8453
        ;;
    sepolia)
        RPC_URL="${SEPOLIA_RPC=***REDACTED***
        CHAIN_ID=11155111
        ;;
    *)
        echo "❌ Unknown network: ${NETWORK}. Use 'base' or 'sepolia'."
        exit 1
        ;;
esac

# Determine signing method
SIGNER=""
if [[ -n "${DEPLOYER_PK:-}" ]]; then
    SIGNER="--private-key ${DEPLOYER_PK}"
    echo "🔑 Using DEPLOYER_PK environment variable"
else
    echo "🔑 No DEPLOYER_PK env var set."
    echo "   Options: --private-key <key> or --interactive"
    echo ""
    read -s -p "Enter deployer private key (or press Enter for interactive): " pk
    echo ""
    if [[ -n "${pk}" ]]; then
        SIGNER="--private-key ${pk}"
    else
        SIGNER="--interactive"
    fi
fi

echo ""
echo "🔥 EXECUTING ABDICATION PROTOCOL"
echo "   Network: ${NETWORK} (chain ${CHAIN_ID})"
echo "   Burn Address: ${BURN_ADDRESS}"
echo "   Contracts:"
echo "     LOVESBT:        ${LOVE_SBT}"
echo "     ProofOfCare:    ${PROOF_OF_CARE}"
echo ""
echo "⚠️  This is IRREVERSIBLE. Ownership will be permanently transferred."
echo "   Press Ctrl+C within 10 seconds to abort..."
sleep 10
echo ""

abdicate() {
    local name="$1"
    local addr="$2"
    echo "Transferring ${name} ownership..."
    cast send "${addr}" "transferOwnership(address)" "${BURN_ADDRESS}" \
        --rpc-url "${RPC_URL}" \
        ${SIGNER} \
        --yes
    # Verify
    local owner
    owner=$(cast call "${addr}" "owner()(address)" --rpc-url "${RPC_URL}")
    if [[ "${owner,,}" == "${BURN_ADDRESS,,}" ]]; then
        echo "   ✅ ${name}: ownership verified at burn address"
    else
        echo "   ⚠️  ${name}: ownership is ${owner} (not yet burned)"
    fi
}

abdicate "LOVESBT" "${LOVE_SBT}"
abdicate "ProofOfCare" "${PROOF_OF_CARE}"

echo ""
echo "✅ ABDICATION COMPLETE"
echo "   All contracts transferred to ${BURN_ADDRESS}"
echo "   The Genesis Gate is now autonomous."
