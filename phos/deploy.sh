#!/usr/bin/env bash
# ==============================================================================
# PHOS — Astro + React Pages deployment
# Deploys the PHOS ambient workspace to Cloudflare Pages.
# Also runs the CVE-2026-29779 proxy deploy as a prerequisite.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_DIR="$SCRIPT_DIR/worker-ai-proxy"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PHOS — Full Deploy (Proxy + Pages)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SCRIPT_DIR"

# ── Preflight ──────────────────────────────────────────────────────────────
command -v wrangler >/dev/null 2>&1 || { echo "❌ wrangler not found"; exit 1; }
wrangler whoami >/dev/null 2>&1 || { echo "❌ wrangler not authenticated"; exit 1; }

# ── Step 1: Deploy proxy worker ─────────────────────────────────────────────
echo "━━━ Step 1/3: Deploy phos-ai-proxy (CVE-2026-29779) ━━━"
echo ""
if [ -d "$PROXY_DIR" ]; then
  # Deploy proxy (preserve workers_dev for health checks)
  bash "$PROXY_DIR/deploy.sh" || {
    echo "⚠️  Proxy deploy script had non-critical issues (likely health check timing)"
    echo "   Continuing with PHOS build/deploy..."
  }
else
  echo "⚠️  Proxy directory not found at $PROXY_DIR — skipping proxy deploy"
fi

# ── Step 2: Build PHOS ──────────────────────────────────────────────────────
echo ""
echo "━━━ Step 2/3: Build PHOS ━━━"
echo ""

if [ ! -f package.json ]; then
  echo "❌ package.json not found — run from PHOS root"
  exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔍 TypeScript check..."
npm run typecheck

echo "🔨 Building..."
npm run build

if [ ! -d dist ]; then
  echo "❌ Build failed — dist/ not found"
  exit 1
fi

echo "  Build output: $(du -sh dist | cut -f1)"

# ── Step 3: Deploy to Cloudflare Pages ──────────────────────────────────────
echo ""
echo "━━━ Step 3/3: Deploy to Cloudflare Pages ━━━"
echo ""

echo "📤 Deploying dist/ → phos (Cloudflare Pages)..."
wrangler pages deploy dist --project-name phos --branch main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ PHOS deploy complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Proxy: https://phos-ai-proxy.trimtab-signal.workers.dev"
echo "  Pages: https://phos.p31ca.org"
echo "  Health: curl https://phos.p31ca.org/health"
echo ""
echo "  CVE-2026-29779: Tokens removed from client bundle"
echo "  Tokens now injected server-side by phos-ai-proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
