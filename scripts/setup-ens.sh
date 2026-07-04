#!/usr/bin/env bash
set -euo pipefail

# ENS Bootstrap for P31 Labs
# Points classicwilly.eth → deployer wallet for donation-triggered Genesis deploy
# Then post-deploy: classicwilly.eth → Safe multisig
#
# ENS two-contract architecture (verified):
#   Registry (0x0...2e1e) : maps name → resolver
#   Resolver (0xF2...AC15) : stores address records
#
# Prerequisites:
#   1. Wallet that OWNS classicwilly.eth (connected in browser or private key)
#   2. ETH on Ethereum L1 for gas (~$5-10 at current base fee)
#
# Usage:
#   # Step 1 — Point classicwilly.eth → deployer wallet (bootstrap)
#   ./scripts/setup-ens.sh bootstrap --private-key 0x...
#
#   # Step 2 — After Safe deployed, map to Safe (post-Genesis)
#   ./scripts/setup-ens.sh finalize --private-key 0x... --safe 0x...

# ── Constants ──────────────────────────────────────────────────────────────
ENS_REGISTRY="0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
ENS_PUBLIC_RESOLVER="0xF29100983E058B709F3D539b0c765937B804AC15"
DEPLOYER="0x51c285Df171C76bE36252e32679F098d90768413"
ETH_RPC="${ETH_RPC:-https://ethereum-rpc.publicnode.com}"
BASE_RPC="${BASE_RPC:-https://mainnet.base.org}"

# ── Help ───────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
P31 Labs — ENS Bootstrap

Usage:
  $0 bootstrap [--private-key <key>]
      Point classicwilly.eth → deployer wallet (${DEPLOYER})

  $0 finalize [--private-key <key>] --safe <address>
      Point classicwilly.eth → Safe multisig

  $0 check
      Verify current ENS resolution for classicwilly.eth

  $0 subdomain <name> <target>
      Set a subdomain (e.g. andromeda → andromeda-gateway.trimtab-signal.workers.dev)

Flags:
  --private-key <key>    Signing wallet private key (only use in secure env)
  --safe <address>       Safe multisig address (finalize only)
  --rpc <url>            Ethereum L1 RPC (default: publicnode)
EOF
  exit 0
}

# ── Bootstrap: classicwilly.eth → deployer wallet ─────────────────────────
cmd_bootstrap() {
  local pk="$1"
  local node
  node=$(cast namehash "classicwilly.eth")

  echo "🚀 Setting classicwilly.eth → ${DEPLOYER}"
  echo "   Namehash: ${node}"
  echo "   Resolver: ${ENS_PUBLIC_RESOLVER}"
  echo "   Network:  Ethereum L1"
  echo ""

  # Execute setAddr on the Public Resolver
  cast send "${ENS_PUBLIC_RESOLVER}" \
    "setAddr(bytes32,address)" \
    "${node}" "${DEPLOYER}" \
    --rpc-url "${ETH_RPC}" \
    --private-key "${pk}"

  echo ""
  echo "✅ Done. classicwilly.eth now resolves to deployer wallet."
  echo "   Verify: https://etherscan.io/enslookup?q=classicwilly.eth"
  echo ""
  echo "📡 Awaiting donation ≥0.01 Base ETH → classicwilly.eth"
  echo "   Then run: cd bonding-soup/packages/p31-sovereign-chain && ./deploy-base.sh --verify"
}

# ── Finalize: classicwilly.eth → Safe multisig ────────────────────────────
cmd_finalize() {
  local pk="$1"
  local safe="$2"
  local node
  node=$(cast namehash "classicwilly.eth")

  echo "🏛️  Updating classicwilly.eth → Safe multisig: ${safe}"
  echo "   Namehash: ${node}"
  echo ""

  cast send "${ENS_PUBLIC_RESOLVER}" \
    "setAddr(bytes32,address)" \
    "${node}" "${safe}" \
    --rpc-url "${ETH_RPC}" \
    --private-key "${pk}"

  echo ""
  echo "✅ Done. classicwilly.eth now points to Safe multisig."
  echo "   Verify: https://etherscan.io/enslookup?q=classicwilly.eth"
}

# ── Check ──────────────────────────────────────────────────────────────────
cmd_check() {
  echo "🔍 Checking ENS resolution for classicwilly.eth..."
  echo ""

  local resolver_addr
  resolver_addr=$(cast call "${ENS_REGISTRY}" \
    "resolver(bytes32)(address)" \
    "$(cast namehash "classicwilly.eth")" \
    --rpc-url "${ETH_RPC}" 2>/dev/null || echo "unresolved")

  local addr
  if [[ "${resolver_addr}" != "unresolved" ]] && [[ "${resolver_addr}" != "0x0000000000000000000000000000000000000000" ]]; then
    addr=$(cast call "${resolver_addr}" \
      "addr(bytes32)(address)" \
      "$(cast namehash "classicwilly.eth")" \
      --rpc-url "${ETH_RPC}" 2>/dev/null || echo "unset")
  else
    addr="unset"
    resolver_addr="unset"
  fi

  echo "   Registry:    ${ENS_REGISTRY}"
  echo "   Resolver:    ${resolver_addr}"
  echo "   Resolves to: ${addr}"
  echo "   Expected:    ${DEPLOYER}"
  echo ""
  if [[ "${addr}" == "${DEPLOYER}" ]]; then
    echo "✅ classicwilly.eth is correctly pointed at deployer wallet."
  else
    echo "⚠️  classicwilly.eth does NOT resolve to deployer wallet."
    echo "   Run: $0 bootstrap"
  fi
}

# ── Subdomain ──────────────────────────────────────────────────────────────
cmd_subdomain() {
  local name="$1"
  local target="$2"
  echo "⏳ Subdomain setup (${name}.classicwilly.eth → ${target})"
  echo "   Requires ENS owner wallet and L1 ETH for gas."
  echo ""
  echo "   Manual steps via ENS App (https://app.ens.domains):"
  echo "     1. Connect owner wallet"
  echo "     2. Search classicwilly.eth → Edit Profile → Subdomains"
  echo "     3. Add '${name}' → set address to ${target}"
  echo "     4. Sign + broadcast (L1 ETH needed for gas)"
}

# ── Main ───────────────────────────────────────────────────────────────────
main() {
  local cmd="${1:-help}"
  shift 2>/dev/null || true

  case "${cmd}" in
    bootstrap)
      local pk=""
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --private-key) pk="$2"; shift 2 ;;
          *) echo "Unknown: $1"; exit 1 ;;
        esac
      done
      if [[ -z "${pk}" ]]; then
        read -s -p "Enter private key for ENS owner wallet: " pk
        echo ""
      fi
      cmd_bootstrap "${pk}"
      ;;

    finalize)
      local pk="" safe=""
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --private-key) pk="$2"; shift 2 ;;
          --safe) safe="$2"; shift 2 ;;
          *) echo "Unknown: $1"; exit 1 ;;
        esac
      done
      if [[ -z "${safe}" ]]; then echo "Error: --safe required"; exit 1; fi
      if [[ -z "${pk}" ]]; then
        read -s -p "Enter private key for ENS owner wallet: " pk
        echo ""
      fi
      cmd_finalize "${pk}" "${safe}"
      ;;

    check)
      cmd_check
      ;;

    subdomain)
      if [[ $# -lt 2 ]]; then echo "Usage: $0 subdomain <name> <target>"; exit 1; fi
      cmd_subdomain "$1" "$2"
      ;;

    help|--help|-h)
      usage
      ;;

    *)
      usage
      ;;
  esac
}

main "$@"
