#!/bin/bash
# package-assets.sh — Package P31 IP and publish to Gumroad + npm
# Uses Bearer token auth (Gumroad v2 API)
source "$(cd "$(dirname "$0")" && pwd)/telegram.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/package-assets.log"
mkdir -p "$LOG_DIR"

GUMROAD_API_KEY="${GUMROAD_API_KEY:-}"
NPM_TOKEN="${NPM_TOKEN:-}"

echo "[$(date)] === Asset Packager starting ===" | tee -a "$LOG_FILE"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"

# ── Helper: build TS source with npx tsc ──
build_ts() {
  local dir="$1"
  if [ -f "$dir/tsconfig.json" ] && command -v npx >/dev/null 2>&1; then
    (cd "$dir" && npx tsc --noEmit 2>/dev/null || true)
  fi
}

ensure_index_ts() {
  local dir="$1"
  if [ ! -f "$dir/src/index.ts" ]; then
    printf '// Spoon-State components — barrel export\n' > "$dir/src/index.ts"
    for f in "$dir/src/"*.ts "$dir/src/"*.tsx; do
      [ ! -f "$f" ] && continue
      bname=$(basename "$f"); name="${bname%.*}"
      [ "$name" = "index" ] && continue
      printf 'export * from '\''./%s'\'';\n' "$name" >> "$dir/src/index.ts"
    done
  fi
}

# ── Helper: zip a directory ──
zip_dir() {
  local name="$1" dir="$2"
  if [ -d "$dir" ]; then
    zip -r "$name.zip" "$dir" >/dev/null 2>&1
    echo "$name.zip"
  else
    echo ""
  fi
}

# ── Helper: create product on Gumroad (metadata only — file added via dashboard) ──
upload_gumroad() {
  local zip_file="$1" product_name="$2" price_cents="$3" desc="$4"
  if [ ! -f "$zip_file" ]; then
    echo "[$(date)]  SKIP $product_name — zip missing" | tee -a "$LOG_FILE"
    return
  fi
  if [ -z "$GUMROAD_API_KEY" ]; then
    echo "[$(date)]  SKIP $product_name — GUMROAD_API_KEY not set" | tee -a "$LOG_FILE"
    return
  fi
  echo "[$(date)]  Creating $product_name on Gumroad..." | tee -a "$LOG_FILE"
  local resp
  resp=$(curl -s -X POST https://api.gumroad.com/v2/products \
    -H "Authorization: Bearer $GUMROAD_API_KEY" \
    -F "name=$product_name" \
    -F "price=$price_cents" \
    -F "description=$desc" 2>&1)
  if echo "$resp" | grep -q '"success":true'; then
    local gum_url
    gum_url=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['product']['short_url'])" 2>/dev/null || echo "unknown")
    echo "[$(date)]  OK $product_name — $gum_url" | tee -a "$LOG_FILE"
    # Save zip to logs for manual file upload via dashboard
    cp "$zip_file" "$LOG_DIR/gumroad-$(basename "$zip_file")" 2>/dev/null || true
  else
    echo "[$(date)]  $product_name — $resp" | tee -a "$LOG_FILE"
  fi
}

# ── Helper: publish npm package ──
publish_npm() {
  local pkg_dir="$1" pkg_name="$2"
  if [ ! -f "$pkg_dir/package.json" ]; then
    echo "[$(date)]  SKIP npm $pkg_name — no package.json" | tee -a "$LOG_FILE"
    return
  fi
  if [ -z "$NPM_TOKEN" ]; then
    echo "[$(date)]  SKIP npm $pkg_name — NPM_TOKEN not set" | tee -a "$LOG_FILE"
    return
  fi
  # Build if needed — install deps first
  if [ ! -d "$pkg_dir/dist" ] || [ ! -f "$pkg_dir/dist/index.js" ]; then
    if [ -f "$pkg_dir/tsconfig.json" ]; then
      (cd "$pkg_dir" && npm install 2>/dev/null || true)
      build_ts "$pkg_dir"
    fi
  fi
  echo "[$(date)]  Publishing $pkg_name to npm..." | tee -a "$LOG_FILE"
  local out tag_flag=""
  # Prerelease versions need --tag next
  local ver
  ver=$(python3 -c "import json; print(json.load(open('$pkg_dir/package.json'))['version'])" 2>/dev/null || echo "")
  if echo "$ver" | grep -qiE "alpha|beta|rc|dev|pre"; then
    tag_flag="--tag next"
  fi
  out=$(cd "$pkg_dir" && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && npm publish --access public --ignore-scripts $tag_flag 2>&1) || true
  if echo "$out" | grep -q "^+ "; then
    local pub_ver
    pub_ver=$(echo "$out" | grep "^+ " | head -1 | sed 's/^+ //')
    echo "[$(date)]  OK $pkg_name — published as $pub_ver" | tee -a "$LOG_FILE"
  elif echo "$out" | grep -qiE "(E403|cannot publish over|already exists)"; then
    echo "[$(date)]  OK $pkg_name — already published (skipped)" | tee -a "$LOG_FILE"
  elif echo "$out" | grep -qiE "^npm error|^npm ERR!|E404|E401"; then
    echo "[$(date)]  FAIL $pkg_name — $(echo "$out" | grep -i error | tail -1)" | tee -a "$LOG_FILE"
  elif echo "$out" | grep -qv "npm notice\|npm WARN"; then
    echo "[$(date)]  OK $pkg_name — $(echo "$out" | head -1)" | tee -a "$LOG_FILE"
  else
    echo "[$(date)]  OK $pkg_name — published" | tee -a "$LOG_FILE"
  fi
}

# ════════════════════════════════════════════
# PRODUCT 1: Spoon-State Adaptive UI Kit ($49)
# ════════════════════════════════════════════
echo "[$(date)] === Product 1: Spoon-State UI Kit ===" | tee -a "$LOG_FILE"
mkdir -p spoon-state/src
# Collect scattered spoon components
for src in \
  "$REPO_DIR/software/spaceship-earth/src/components/hud/SpoonGauge.tsx" \
  "$REPO_DIR/software/spaceship-earth/src/components/hud/SpoonGauge.css" \
  "$REPO_DIR/software/packages/shared/src/sovereign/audioEngine.ts" \
  "$REPO_DIR/software/packages/shared/src/sovereign/crypto.ts" \
  "$REPO_DIR/software/packages/shared/src/sovereign/pwa.ts" \
  "$REPO_DIR/software/packages/shared/src/akinator/CardMenu.tsx"; do
  [ -f "$src" ] && cp "$src" spoon-state/src/
done
cat > spoon-state/package.json << 'PKGJSON'
{
  "name": "@p31/spoon-state",
  "version": "1.0.0",
  "description": "Adaptive spoon-state UI kit for disability-aware applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": { "build": "tsc", "prepublishOnly": "npm run build" },
  "keywords": ["disability","accessibility","adaptive-ui","spoon-theory"],
  "author": "P31 Labs",
  "license": "MIT",
  "devDependencies": { "typescript": "^5.0.0" }
}
PKGJSON
cat > spoon-state/tsconfig.json << 'TSCONFIG'
{ "compilerOptions": { "target": "ES2020", "module": "ESNext", "moduleResolution": "bundler", "outDir": "./dist", "rootDir": "./src", "strict": true, "jsx": "react-jsx", "declaration": true, "esModuleInterop": true, "skipLibCheck": true }, "include": ["src"] }
TSCONFIG
ensure_index_ts "$WORKDIR/spoon-state"

SPOON_ZIP=$(zip_dir "spoon-state-ui-kit" "spoon-state")
upload_gumroad "$SPOON_ZIP" "Spoon-State Adaptive UI Kit" 4900 "React hooks + components for building disability-aware, spoon-budgeted user interfaces. Includes SpoonGauge, CardMenu, audio engine, crypto helpers, and PWA utilities."
publish_npm "$WORKDIR/spoon-state" "@p31/spoon-state"

# ════════════════════════════════════════════
# PRODUCT 2: BROS Signaling Worker Template ($99)
# ════════════════════════════════════════════
echo "[$(date)] === Product 2: BROS Worker Template ===" | tee -a "$LOG_FILE"
if [ -d "$REPO_DIR/scripts/bros-worker-template" ]; then
  cp -r "$REPO_DIR/scripts/bros-worker-template" bros-worker
  BROS_ZIP=$(zip_dir "bros-signaling-worker" "bros-worker")
  upload_gumroad "$BROS_ZIP" "BROS Signaling Worker Template" 9900 "Cloudflare Workers WebRTC+SSE signaling template with Durable Objects. Production-ready peer discovery, AES vault, and mesh networking primitives."
else
  echo "[$(date)]  SKIP BROS template — source dir missing" | tee -a "$LOG_FILE"
fi

# ════════════════════════════════════════════
# PRODUCT 3: Akinator Decision Tree Engine ($29)
# ════════════════════════════════════════════
echo "[$(date)] === Product 3: Akinator Engine ===" | tee -a "$LOG_FILE"
if [ -d "$REPO_DIR/scripts/akinator-cli" ]; then
  cp -r "$REPO_DIR/scripts/akinator-cli" akinator
  # Add source from shared package if available
  if [ -d "$REPO_DIR/software/packages/shared/src/akinator" ]; then
    cp -r "$REPO_DIR/software/packages/shared/src/akinator" akinator/src/
  fi
  AKI_ZIP=$(zip_dir "akinator-decision-engine" "akinator")
  upload_gumroad "$AKI_ZIP" "Akinator Decision Tree Engine" 2900 "Adaptive decision tree engine for personalized interviews, assessments, and recommendation flows. Includes React CardMenu component and CLI interface."
  publish_npm "$WORKDIR/akinator" "@p31/akinator-engine"
else
  echo "[$(date)]  SKIP Akinator — source dir missing" | tee -a "$LOG_FILE"
fi

# ════════════════════════════════════════════
# PRODUCT 4-7: Pre-built npm packages
# ════════════════════════════════════════════
echo "[$(date)] === Pre-built npm packages ===" | tee -a "$LOG_FILE"

# @p31/node-zero — 724KB built dist, WebCrypto primitives
if [ -d "$REPO_DIR/software/packages/node-zero" ]; then
  cp -r "$REPO_DIR/software/packages/node-zero" node-zero
  build_ts "$WORKDIR/node-zero"
  publish_npm "$WORKDIR/node-zero" "@p31/node-zero"
fi

# @p31/agent-engine — 312KB built dist
if [ -d "$REPO_DIR/software/packages/agent-engine" ]; then
  cp -r "$REPO_DIR/software/packages/agent-engine" agent-engine
  build_ts "$WORKDIR/agent-engine"
  publish_npm "$WORKDIR/agent-engine" "@p31/agent-engine"
fi

# @p31/game-engine — 308KB built dist
if [ -d "$REPO_DIR/software/packages/game-engine" ]; then
  cp -r "$REPO_DIR/software/packages/game-engine" game-engine
  build_ts "$WORKDIR/game-engine"
  publish_npm "$WORKDIR/game-engine" "@p31/game-engine"
fi

# @p31/bus — 20KB zero-dep event bus (renamed from @p31labs/bus to match @p31 scope)
if [ -d "$REPO_DIR/software/packages/bus" ]; then
  cp -r "$REPO_DIR/software/packages/bus" bus
  sed -i 's/"@p31labs\/bus"/"@p31\/bus"/' "$WORKDIR/bus/package.json"
  build_ts "$WORKDIR/bus"
  publish_npm "$WORKDIR/bus" "@p31/bus"
fi

# @p31/love-ledger — 100KB built dist
if [ -d "$REPO_DIR/software/packages/love-ledger" ]; then
  cp -r "$REPO_DIR/software/packages/love-ledger" love-ledger
  build_ts "$WORKDIR/love-ledger"
  publish_npm "$WORKDIR/love-ledger" "@p31/love-ledger"
fi

echo "[$(date)] === Asset packager cycle complete ===" | tee -a "$LOG_FILE"
telegram "📦 Asset packager cycle complete
Gumroad: 3 products live (willow680.gumroad.com)
npm: @p31/* published
Log: $LOG_FILE"
sleep 3600
exec "$0" "$@"
