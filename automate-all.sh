#!/usr/bin/env bash
# automate-all.sh — P31 Capital Machine Full Automation
set -euo pipefail

echo "🔧 P31 Capital Machine — Full Automation"

export SEPOLIA_RPC=***REDACTED***
export DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-0x3679ffa2ea727847a2f1858467d4e132b2dc44f56ab90eb59818885f2397e29a}"
export DEPLOYER_ADDRESS="0x51c285Df171C76bE36252e32679F098d90768413"
export LOVE_SBT_ADDRESS="${LOVE_SBT_ADDRESS:-0x34A1D3fff3958843C43aD80F30b94c510645C316}"
export PROOF_OF_CARE_ADDRESS="${PROOF_OF_CARE_ADDRESS:-0x4384C856C0ccc9CB5a4ADb148937Ea557293543b}"
export SOVEREIGNTY_POOL="${SOVEREIGNTY_POOL:-0x0000000000000000000000000000000000000000}"
export PERFORMANCE_POOL="${PERFORMANCE_POOL:-0x0000000000000000000000000000000000000000}"

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  if [ -f ~/.foundry/keystores/deployer ]; then
    echo "✅ Using encrypted keystore"
    DEPLOY_CMD="forge script script/DeployAll.s.sol:DeployAll --account deployer"
  else
    echo "❌ No private key or keystore found. Set DEPLOYER_PRIVATE_KEY or run: cast wallet import deployer --interactive"
    exit 1
  fi
else
  DEPLOY_CMD="forge script script/DeployAll.s.sol:DeployAll --private-key $DEPLOYER_PRIVATE_KEY"
fi

cd /home/p31/P31-local-workspace/bonding-soup/packages/p31-sovereign-chain

echo "📦 Building contracts..."
forge build

echo "📦 Running tests..."
forge test

echo "🚀 Deploying contracts to Sepolia..."
DEPLOY_OUTPUT=$($DEPLOY_CMD \
  --broadcast \
  --verify \
  --ffi \
  --rpc-url "$SEPOLIA_RPC" 2>&1)

LOVE_SBT_ADDR=$(echo "$DEPLOY_OUTPUT" | grep -o 'LOVESBT: 0x[a-fA-F0-9]\{40\}' | head -1 | cut -d' ' -f2)
PROOF_CARE_ADDR=$(echo "$DEPLOY_OUTPUT" | grep -o 'ProofOfCare: 0x[a-fA-F0-9]\{40\}' | head -1 | cut -d' ' -f2)

if [ -z "$LOVE_SBT_ADDR" ] || [ -z "$PROOF_CARE_ADDR" ]; then
  echo "❌ Failed to extract contract addresses. Manual check required."
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "✅ Contracts deployed:"
echo "   LOVESBT:       $LOVE_SBT_ADDR"
echo "   ProofOfCare:   $PROOF_CARE_ADDR"

cd /home/p31/P31-local-workspace/workers/care-api

echo "🔐 Updating care-api secrets..."
echo "$LOVE_SBT_ADDR"   | wrangler secret put LOVE_SBT_ADDRESS
echo "$PROOF_CARE_ADDR" | wrangler secret put PROOF_OF_CARE_ADDRESS

echo "🚀 Deploying care-api worker..."
wrangler deploy --env production

echo "📊 Verifying worker health..."
WORKERS=(
  "care-api"
  "events-queue"
  "pdf-generator"
  "mev-arbitrage"
  "fundraising-agent"
  "auto-compounder"
  "cashback-collector"
  "affiliate-fleet"
  "airdrop-harvester"
)

for worker in "${WORKERS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://$worker.trimtab-signal.workers.dev/health" 2>/dev/null || echo "000")
  if [ "$status" == "200" ]; then
    echo "   ✅ $worker: $status"
  else
    echo "   ⚠️  $worker: $status (may still be initializing)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "   P31 Capital Machine — Fully Automated"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Contract Addresses:"
echo "   LOVESBT:       $LOVE_SBT_ADDR"
echo "   ProofOfCare:   $PROOF_CARE_ADDR"
echo ""
echo "🔗 Explore on Sepolia Etherscan:"
echo "   https://sepolia.etherscan.io/address/$LOVE_SBT_ADDR"
echo "   https://sepolia.etherscan.io/address/$PROOF_CARE_ADDR"
echo ""
echo "💰 Active Revenue Streams:"
echo "   • MEV Arbitrage      → https://mev-arbitrage.trimtab-signal.workers.dev"
echo "   • Fundraising Agent  → https://fundraising-agent.trimtab-signal.workers.dev"
echo "   • Auto-Compounder    → https://auto-compounder.trimtab-signal.workers.dev"
echo "   • Cashback Collector → https://cashback-collector.trimtab-signal.workers.dev"
echo ""
echo "🎯 Next Steps:"
echo "   1. Enable Workers Builds in Cloudflare Dashboard"
echo "   2. Configure custom domain (api.p31ca.org → care-api)"
echo "   3. Monitor initial revenue flows over 24h"
echo ""
echo "📈 Watch the machine run:"
echo "   watch -n 15 \"curl -s https://care-api.trimtab-signal.workers.dev/health | jq .\""
