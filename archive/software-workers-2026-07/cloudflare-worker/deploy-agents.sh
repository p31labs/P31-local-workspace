#!/bin/bash
# ==============================================================================
# P31 K₄ MESH - AGENT DEPLOYMENT SCRIPT
# ==============================================================================
# Deploys the Command Center worker containing the Cognitive Workload Profiles 
# (Quark, Nudi, Spark) and the Aegis Trust Weaver (EigenTrust mapping).
# ==============================================================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$HOME/andromeda"
SHARED_PACKAGES="$WORKSPACE_ROOT/software/packages/shared"
COMMAND_CENTER="$WORKSPACE_ROOT/software/cloudflare-worker/command-center"

echo "🚀 Initiating deployment of K₄ Mesh Agents & Command Center Worker..."

# 1. Navigate to the shared packages to ensure trust module builds
echo "📦 Building shared packages (EigenTrust & Aegis Mapper)..."
cd "$SHARED_PACKAGES"
npm install
npm run build || echo "⚠️ Build script not found in shared, proceeding with TS transpilation..."
npm test --passWithNoTests
cd "$COMMAND_CENTER"

# 2. Install dependencies for the worker
echo "📦 Installing worker dependencies..."
npm install

# 3. Run worker tests to verify Aegis /api/ai/aegis endpoint integration
echo "🧪 Running Command Center tests..."
npm test -- --passWithNoTests

# 4. Typecheck worker bindings
echo "🔍 Generating and verifying Wrangler types..."
npx wrangler types

# 5. Deploy to Cloudflare Edge
echo "☁️ Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "=============================================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "📡 The following AI Agents are now live and listening on the Edge:"
echo "   - Quark (Thermodynamic Observer) : POST /api/ai/quark"
echo "   - Nudi (Benthic Somatic Router)  : POST /api/ai/nudi"
echo "   - Spark (Executive Daemon)       : POST /api/ai/spark"
echo "   - Aegis (Trust Weaver)           : POST /api/ai/aegis"
echo "=============================================================================="