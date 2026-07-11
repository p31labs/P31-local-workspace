#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PRIM=$'\033[36m[ℹ]\033[0m'; OK=$'\033[32m[✔]\033[0m'
WARN=$'\033[33m[⚠]\033[0m'; ERR=$'\033[31m[✖]\033[0m'
log(){ printf '%s %s\n' "$PRIM" "$*"; }
ok(){ printf '%s %s\n' "$OK" "$*"; }
warn(){ printf '%s %s\n' "$WARN" "$*"; }
die(){ printf '%s %s\n' "$ERR" "$*" >&2; exit 1; }

ENV_NAME="${ENV_NAME:-production}"
SECRETS_FILE="$ROOT/.l5-secrets.env"
PLACEHOLDER="d281745d-replace-me"
AUTO_KV="${AUTO_KV:-0}"
REGEN="${REGEN_SECRETS:-0}"

[ $# -eq 0 ] || { echo "Usage: $0   (env-tunable: ENV_NAME, AUTO_KV=1, REGEN_SECRETS=1)"; exit 2; }

log "L5 Creation Economy deploy — env=$ENV_NAME"

# ── Preflight: never touch prod without auth ──────────────────────────────
command -v npx >/dev/null 2>&1 || die "npx not found"
npx wrangler whoami >/dev/null 2>&1 || die "wrangler not authenticated — run: npx wrangler login"
ok "wrangler authenticated ($(npx wrangler whoami 2>/dev/null))"

# ── Red-gate: TRIPER 12/12 must be green before any deploy ─────────────
log "Gate: TRIPER 12/12 cert"
node tests/triper/triper-runner.mjs --cert >/tmp/l5-triper.log 2>&1 || die "TRIPER cert FAILED — aborting (see /tmp/l5-triper.log)"
ok "TRIPER cert green"

# ── Axis-1 CBS WASM (prebuilt + verified; rebuild if cargo present) ─────
WASM="software/workers/creation-accountant/src/taler_cs.wasm"
if command -v cargo >/dev/null 2>&1; then
  log "Axis-1: rebuilding taler_cs.wasm (rust + curve25519-dalek)..."
  ( cd software/workers/creation-accountant/taler-cbs && bash build-cbs.sh ) \
    || die "taler_cs.wasm build FAILED"
else
  log "Axis-1: cargo absent — using prebuilt $WASM"
fi
[ -f "$WASM" ] || die "taler_cs.wasm missing — build it (see AXIS-1_FINAL_DELIVERABLE.md §4)"
node software/workers/creation-accountant/taler-cbs/test/vector.mjs >/tmp/l5-cbs.log 2>&1 \
  || die "Axis-1 CBS test vector FAILED (see /tmp/l5-cbs.log)"
node software/workers/creation-accountant/taler-cbs/test/integration.mjs >/tmp/l5-cbs-int.log 2>&1 \
  || die "Axis-1 CBS integration FAILED (see /tmp/l5-cbs-int.log)"
ok "Axis-1 CBS WASM verified (vector + issuer-flow + nonce-reuse proof)"

# ── KV provisioning (idempotent) ──────────────────────────────────────
if grep -q "$PLACEHOLDER" software/workers/intent-resolver/wrangler.toml software/workers/creation-accountant/wrangler.toml; then
  if [ "$AUTO_KV" = "1" ]; then
    log "Creating KV namespaces..."
    PKV=$(npx wrangler kv namespace create passport-kv --env "$ENV_NAME" 2>/dev/null | grep -oE 'id = "[0-9a-f]{32}"' | head -1 | sed 's/id = "//;s/"//')
    CKV=$(npx wrangler kv namespace create creation-kv --env "$ENV_NAME" 2>/dev/null | grep -oE 'id = "[0-9a-f]{32}"' | head -1 | sed 's/id = "//;s/"//')
    [ -n "${PKV:-}" ] && [ -n "${CKV:-}" ] || die "KV create failed — set AUTO_KV=0 and edit wrangler.toml with real ids"
    sed -i "s/$PLACEHOLDER/$PKV/" software/workers/intent-resolver/wrangler.toml
    sed -i "s/$PLACEHOLDER/$CKV/" software/workers/creation-accountant/wrangler.toml
    ok "KV ids injected (passport=$PKV creation=$CKV)"
  else
    die "Placeholder KV id present. Run with AUTO_KV=1 to auto-create, or edit wrangler.toml with real ids, then re-run."
  fi
else
  ok "KV bindings already resolved (no placeholder)"
fi

# ── Secrets (Ed25519 keypair + LOVE_AUTH_SECRET + Axis-1 blind sigs) ─────
if [ "$REGEN" = "1" ] || [ ! -f "$SECRETS_FILE" ]; then
  log "Generating Ed25519 keypair + LOVE_AUTH_SECRET + Axis-1 blind sigs..."
  RECEIPT_SIGNER_PRIVATE_KEY=$(node -e 'const{webcrypto}=require("crypto");(async()=>{const k=await webcrypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);process.stdout.write(Buffer.from(await webcrypto.subtle.exportKey("pkcs8",k.privateKey)).toString("base64"));})()' 2>/dev/null) || die "private key gen failed"
  RECEIPT_SIGNER_PUBLIC_KEY=$(node -e 'const{webcrypto}=require("crypto");(async()=>{const k=await webcrypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);process.stdout.write(Buffer.from(await webcrypto.subtle.exportKey("spki",k.publicKey)).toString("base64"));})()' 2>/dev/null) || die "public key gen failed"
  LOVE_AUTH_SECRET=$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))' 2>/dev/null) || die "LOVE_AUTH_SECRET gen failed"
  # Axis-1 CBS: ONLY the issuer scalar x is a secret. X = base(x) and
  # R = n·G (n = clamp(SHA-512(x ‖ t)), t = fresh per-withdrawal nonce)
  # are DERIVED at runtime — never stored. x is base64 (the worker calls
  # b64ToBytes(secret)). Single secret, single worker (love-ledger).
  BLIND_ISSUER_PRIVATE_KEY=$(node -e 'const{webcrypto}=require("crypto");(async()=>{const k=await webcrypto.subtle.generateKey("Ed25519",true,["sign","verify"]);const j=await webcrypto.subtle.exportKey("jwk",k.privateKey);const s=Buffer.from(j.d,"base64url");const h=new Uint8Array(await webcrypto.subtle.digest("SHA-512",s));const x=h.slice(0,32);x[0]&=248;x[31]&=127;x[31]|=64;process.stdout.write(Buffer.from(x).toString("base64"));})()' 2>/dev/null) || die "blind issuer key gen failed"
  printf 'RECEIPT_SIGNER_PRIVATE_KEY=%s\nRECEIPT_SIGNER_PUBLIC_KEY=%s\nLOVE_AUTH_SECRET=%s\nBLIND_ISSUER_PRIVATE_KEY=%s\n' "$RECEIPT_SIGNER_PRIVATE_KEY" "$RECEIPT_SIGNER_PUBLIC_KEY" "$LOVE_AUTH_SECRET" "$BLIND_ISSUER_PRIVATE_KEY" > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
  ok "secrets generated -> $SECRETS_FILE  (ADD TO .gitignore — NEVER COMMIT)"
else
  log "Reusing existing $SECRETS_FILE (REGEN_SECRETS=1 to regenerate)"
  set -a; . "$SECRETS_FILE"; set +a
fi

put_secret(){ local dir="$1" name="$2" val="$3"
  ( cd "$ROOT/$dir" && printf '%s' "$val" | npx wrangler secret put "$name" --env "$ENV_NAME" >/dev/null 2>&1 ) || die "secret put failed: $dir/$name"
}
log "Putting secrets..."
put_secret software/workers/creation-accountant RECEIPT_SIGNER_PRIVATE_KEY "$RECEIPT_SIGNER_PRIVATE_KEY"
put_secret apps/phos/src/workers/love-ledger        RECEIPT_SIGNER_PUBLIC_KEY  "$RECEIPT_SIGNER_PUBLIC_KEY"
put_secret apps/phos/src/workers/love-ledger        LOVE_AUTH_SECRET            "$LOVE_AUTH_SECRET"
put_secret software/workers/mcp-x402-gateway    LOVE_AUTH_SECRET            "$LOVE_AUTH_SECRET"
# Axis-1 CBS: single secret on love-ledger (consolidated issuer).
put_secret apps/phos/src/workers/love-ledger        BLIND_ISSUER_PRIVATE_KEY  "$BLIND_ISSUER_PRIVATE_KEY"
ok "secrets put"

# ── Axis-1 WASM copy to love-ledger (idempotent) ───────────────────
log "Copying taler_cs.wasm to love-ledger..."
cp -f "$WASM" "$ROOT/apps/phos/src/workers/love-ledger/taler_cs.wasm" || die "wasm copy failed"
ok "wasm copied to love-ledger"

# ── Migrations (idempotent: CREATE TABLE IF NOT EXISTS) ──────────────
log "Applying D1 migrations (incl. 005_cbs_nonce)..."
( cd "$ROOT/apps/phos/src/workers/love-ledger" && npx wrangler d1 migrations apply love-ledger --env "$ENV_NAME" --remote ) || die "migrations apply failed"
ok "migrations applied"

# ── Per-worker: dry-run gate, then live deploy ────────────────────────
deploy_worker(){ local dir="$1" name="$2"
  log "Dry-run gate: $name"
  ( cd "$ROOT/$dir" && npx wrangler deploy --dry-run --env "$ENV_NAME" ) >/tmp/l5-dry.log 2>&1 || die "dry-run FAILED: $name (see /tmp/l5-dry.log)"
  ok "dry-run: $name"
  log "Deploying: $name"
  ( cd "$ROOT/$dir" && npx wrangler deploy --env "$ENV_NAME" 2>&1 | tee /tmp/l5-deploy-"$name".log ) || die "deploy FAILED: $name"
  ok "deployed: $name"
}
deploy_worker software/workers/intent-resolver   intent-resolver
deploy_worker software/workers/creation-accountant creation-accountant
deploy_worker software/workers/mcp-x402-gateway mcp-x402
deploy_worker apps/phos/src/workers/love-ledger love-ledger

# ── Post-deploy verify ──────────────────────────────────────────────────
log "Post-deploy gate: TRIPER cert"
node tests/triper/triper-runner.mjs --cert >/tmp/l5-triper-post.log 2>&1 || warn "post-deploy TRIPER cert FAILED — investigate"
ok "deploy complete"
log "New worker URLs (from deploy output):"
grep -hoE 'https://[a-z0-9.-]+\.workers\.dev' /tmp/l5-deploy-*.log 2>/dev/null | sort -u || true
log "Manual check: curl https://<worker>.workers.dev/health for each"
