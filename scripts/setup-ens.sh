#!/usr/bin/env bash
set -euo pipefail

# ENS Identity Setup for P31 Labs
# Configures classicwilly.eth and subdomains
#
# Prerequisites:
#   - ENS ownership of classicwilly.eth
#   - Etherscan API key for reverse resolution
#   - IPFS node for contenthash uploads (optional)
#
# Usage:
#   ./scripts/setup-ens.sh [--network mainnet|sepolia]

NETWORK="${1:-mainnet}"
RESOLVER="0x4976fb03C32e5B8cfe2b6cCB31c09dA78E64c3d2"

echo "🌐 P31 Labs — ENS Identity Setup"
echo "   Network: ${NETWORK}"
echo "   Resolver: ${RESOLVER}"
echo ""

# Step 1: Verify ownership
echo "📋 Step 1: Verify ENS ownership"
if command -v cast &> /dev/null; then
    echo "   Run: cast lookup-address classicwilly.eth --rpc-url https://mainnet.base.org"
else
    echo "   Verify at: https://etherscan.io/enslookup?q=classicwilly.eth"
fi

# Step 2: Configure resolver
echo ""
echo "📋 Step 2: Configure resolver (if not already set)"
echo "   Run: cast send 0x00000000000...  --rpc-url https://mainnet.base.org setResolver('classicwilly.eth', ${RESOLVER})"

# Step 3: Point root to Safe multisig
echo ""
echo "📋 Step 3: Point classicwilly.eth to Safe multisig"
echo "   Once Safe is deployed on Base:"
echo "   cast send ${RESOLVER} setAddr(bytes32,uint256,address) --rpc-url https://mainnet.base.org"
echo "   Parameters:"
echo "     node: 0x... (keccak256('classicwilly.eth'))"
echo "     coinType: 60 (ETH)"
echo "     address: <SAFE_ADDRESS>"

# Step 4: Configure andromeda subdomain
echo ""
echo "📋 Step 4: Configure andromeda.classicwilly.eth"
echo "   Options:"
echo "     A) DNS: Point to Cloudflare Workers endpoint"
echo "     B) Contenthash: IPFS CID for decentralized hosting"
echo "     C) Both: DNS fallback + contenthash primary"
echo ""
echo "   DNS target: andromeda.trimtab-signal.workers.dev"
echo "   Or contenthash: ipfs://<CID>"

# Step 5: Create additional subdomains
echo ""
echo "📋 Step 5: Create subdomain tree"
SUBDOMAINS=("mesh" "node-zero" "agent" "jitterbug" "care-api")
for sub in "${SUBDOMAINS[@]}"; do
    echo "   - ${sub}.classicwilly.eth"
done

echo ""
echo "✅ Setup guide complete."
echo "   Execute the cast commands above with your ENS owner wallet."
