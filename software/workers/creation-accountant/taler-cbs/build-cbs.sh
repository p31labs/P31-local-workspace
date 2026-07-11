#!/usr/bin/env bash
# build-cbs.sh — build taler_cs.wasm (Clause Blind Schnorr over Ed25519).
#
# Real, audited primitives only: curve25519-dalek + sha2 (no hand-rolled
# curve math, no libsodium cross-compile). Targets wasm32-unknown-unknown.
#
# Reference: AXIS-1_FINAL_DELIVERABLE.md §2 (protocol) / §4 (build).
set -euo pipefail
cd "$(dirname "$0")"

OUT="../src/taler_cs.wasm"
TARGET="wasm32-unknown-unknown"

command -v cargo >/dev/null 2>&1 || { echo "cargo not found"; exit 1; }

echo "Building taler_cbs -> $OUT"
cargo build --target "$TARGET" --release

cp "target/$TARGET/release/taler_cbs.wasm" "$OUT"
echo "Built $OUT ($(wc -c < "$OUT") bytes raw, $(gzip -c "$OUT" | wc -c) bytes gzipped)"

# Copy the wasm next to the love-ledger Worker loader so it can be
# imported via ?module (esbuild compiles at build time — the only
# Worker-supported way; [wasm_modules] and runtime instantiate are
# both blocked). See AXIS-1 §6.1.
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
WORKER_WASM="$ROOT/apps/phos/src/workers/love-ledger/taler-cbs/taler_cs.wasm"
cp "$OUT" "$WORKER_WASM"
echo "Copied wasm -> $WORKER_WASM ($(wc -c < "$WORKER_WASM") bytes)"

echo "Running known-answer vector (cross-checked vs Node Web Crypto)..."
node test/vector.mjs

echo "CBS WASM build + verify OK"
