#!/usr/bin/env bash
set -euo pipefail
# PHOS Mobile Bootstrap – run once after desktop build succeeds
# Prerequisites: Android phone with USB debugging enabled, or Android Studio emulator

cd "$(dirname "$0")/.."

echo "[1/4] Adding Rust mobile targets..."
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

echo "[2/4] Installing Tauri Android CLI deps (cargo-ndk, Android SDK)..."
cargo install cargo-ndk 2>/dev/null || true

if ! which apksigner >/dev/null 2>&1; then
    echo "  -> Ensure ANDROID_HOME is set and platform tools are on PATH"
fi

echo "[3/4] Initializing Tauri Android project..."
pnpm tauri android init

echo "[4/4] Updating tauri.conf.json for mobile..."
# Add android-specific permissions and mobile window defaults
cat <<'JSON' > src-tauri/tauri.conf.json
{
  "productName": "PHOS",
  "version": "0.1.0",
  "identifier": "org.p31labs.phos",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:4321"
  },
  "bundle": {
    "active": true,
    "targets": ["appimage", "deb", "apk", "aab"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.png"
    ],
    "copyright": "© 2026 P31 Labs",
    "category": "Utility",
    "shortDescription": "Cognitive prosthetic platform",
    "longDescription": "PHOS – Phosphorus Human Operating Surface. Spoon-aware UI, native 863 Hz audio, offline-first vector database."
  },
  "app": {
    "windows": [
      {
        "title": "PHOS",
        "width": 1280,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "visible": true
      }
    ],
    "security": {
      "csp": null,
      "capabilities": ["updater-permissions"]
    },
    "withGlobalTauri": true
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://updates.p31ca.org/phos/latest.json"],
      "pubkey": "PLACEHOLDER_PUBKEY"
    }
  }
}
JSON

echo ""
echo "Done. Next steps:"
echo " 1. Connect Android phone via USB (developer mode enabled)"
echo " 2. Run:  pnpm tauri android dev"
echo " 3. PHOS will install and launch on your phone"
echo ""
echo "For the first build, Tauri will prompt for Android SDK path if not set."
echo "Set: export ANDROID_HOME=\$HOME/Android/Sdk"
