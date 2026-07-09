#!/usr/bin/env bash
#
# abdicate.sh — Irreversible ownership renouncement of the P31 Sovereign Chain.
#
# Reads deployed addresses from deploy-info.json (produced by launch-mainnet.sh)
# and transfers ownership of LOVESBT + ProofOfCare (+ optional GenesisSpark) to the
# BURN address. This is ONE-WAY. Run ONLY after the agreed 24h observation buffer.
#
# Usage:
#   export DEPLOYER_PRIVATE_KEY=0x...
#   bash scripts/abdicate.sh            # dry-run: prints the commands, asks for --confirm
#   bash scripts/abdicate.sh --confirm  # executes the casts
#
# Prereqs: forge/cast installed, BASE_RPC reachable, wallet still holds ownership.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFO="${REPO_ROOT}/bonding-soup/packages/p31-sovereign-chain/deploy-info.json"
BURN="0x000000000000000000000000000000000000dEaD"
BASE_RPC="${BASE_RPC:-https://mainnet.base.org}"

if [ ! -f "$INFO" ]; then
  echo "❌ deploy-info.json not found at $INFO — run launch-mainnet.sh first."
  exit 1
fi

LOVESBT="$(grep -oP '"LOVESBT":\s*"\K0x[a-fA-F0-9]{40}' "$INFO" | head -1)"
PROOFOFCARE="$(grep -oP '"ProofOfCare":\s*"\K0x[a-fA-F0-9]{40}' "$INFO" | head -1)"
GENESISSPARK="$(grep -oP '"GenesisSpark":\s*"\K0x[a-fA-F0-9]{40}' "$INFO" | head -1)"

if [ -z "${LOVESBT}" ] || [ -z "${PROOFOFCARE}" ]; then
  echo "❌ Could not parse LOVESBT/ProofOfCare addresses from $INFO"
  exit 1
fi

export DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-${DEPLOYER_PK:-}}"
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "❌ DEPLOYER_PRIVATE_KEY not set."
  exit 1
fi

echo "🔥 ABDICATION PLAN (irreversible)"
echo "   LOVESBT       -> $LOVESBT"
echo "   ProofOfCare   -> $PROOFOFCARE"
echo "   GenesisSpark  -> ${GENESISSPARK:-n/a}"
echo "   Burn address  -> $BURN"
echo "   RPC           -> $BASE_RPC"
echo ""

CMDS=(
  "cast send $LOVESBT \"transferOwnership(address)\" $BURN --rpc-url $BASE_RPC --private-key \$DEPLOYER_PRIVATE_KEY"
  "cast send $PROOFOFCARE \"transferOwnership(address)\" $BURN --rpc-url $BASE_RPC --private-key \$DEPLOYER_PRIVATE_KEY"
)
if [ -n "$GENESISSPARK" ]; then
  CMDS+=("cast send $GENESISSPARK \"transferOwnership(address)\" $BURN --rpc-url $BASE_RPC --private-key \$DEPLOYER_PRIVATE_KEY")
fi

if [ "${1:-}" != "--confirm" ]; then
  echo "⚠️  DRY RUN — the following will execute with --confirm:"
  printf '   %s\n' "${CMDS[@]}"
  echo ""
  echo "Verify the 24h buffer has elapsed and ownership is still yours, then re-run with --confirm."
  exit 0
fi

echo "🚀 Executing abdication..."
for c in "${CMDS[@]}"; do
  echo "→ $c"
  eval "$c"
done

echo ""
echo "✅ Abdication complete. Verify on Basescan that owner == $BURN for each contract."
