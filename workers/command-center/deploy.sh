#!/bin/bash
set -e

echo "🏗️  Deploying EPCP Command Center..."

# Run D1 migrations before deploy
echo "🔄 Running D1 migrations..."
npx wrangler d1 execute epcp-audit --remote --file=src/migrations.sql 2>/dev/null || echo "(Migrations may already be applied)"

# Deploy the worker
echo "🚀 Deploying Worker..."
npx wrangler@4 deploy

echo ""
echo "✅ Deployment complete!"
echo "   Dashboard: https://command-center.trimtab-signal.workers.dev"
echo "   Health:    https://command-center.trimtab-signal.workers.dev/api/health"
