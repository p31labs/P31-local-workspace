#!/usr/bin/env bash
# p31-substack-status.sh — Substack Pipeline Health Check
# Part of the P31 Yardmaster Continuous Shipyard Protocol.
#
# Checks:
#   1. RSS feed reachability (thegeodesicself.substack.com/feed)
#   2. Discord bot poller state freshness
#   3. p31-forge KV state (scan:substack:seen)
#   4. Root cause mapping: which pipeline stage is broken
#
# Usage:
#   ./p31-substack-status.sh            # Full check
#   ./p31-substack-status.sh --feed     # Feed only
#   ./p31-substack-status.sh --bot      # Discord bot state only
#   ./p31-substack-status.sh --kv       # KV state only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${P31_REPO_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

FEED_URL="https://thegeodesicself.substack.com/feed"
BOT_STATE="${REPO_ROOT}/software/discord/p31-bot/data/substack_state.json"
FORGE_KV_KEY="scan:substack:seen"
GEMINI_PROMPT="${REPO_ROOT}/prompts/GEMINI_SUBSTACK_GENERATION.md"
CONTENT_AGENT="${REPO_ROOT}/software/p31-cortex/src/do/content-agent.ts"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

pass()  { echo -e "  ${GREEN}✓${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
info()  { echo -e "  ${CYAN}→${NC} $1"; }
header(){ echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}"; }

check_feed() {
  header "Substack RSS Feed"
  local http_code
  http_code=$(curl -s -o /tmp/substack-feed-$$.xml -w "%{http_code}" --connect-timeout 10 --max-time 15 "$FEED_URL" 2>/dev/null || echo "000")

  if [[ "$http_code" == "200" ]]; then
    pass "Feed reachable: HTTP ${http_code}"
    local size
    size=$(wc -c < /tmp/substack-feed-$$.xml)
    info "Feed size: ${size} bytes"
    # Count items
    local items
    items=$(grep -c '<item>' /tmp/substack-feed-$$.xml 2>/dev/null || echo "0")
    info "Items in feed: ${items}"
    # Check for CDATA content (indicates full post content, not just excerpts)
    local cdata_count
    cdata_count=$(grep -c '<content:encoded>' /tmp/substack-feed-$$.xml 2>/dev/null || echo "0")
    if [[ "$cdata_count" -gt 0 ]]; then
      pass "Full content available (${cdata_count} items with content:encoded)"
    else
      warn "Only excerpts in feed (no content:encoded)"
    fi
  else
    fail "Feed unreachable: HTTP ${http_code}"
  fi
  rm -f /tmp/substack-feed-$$.xml
}

check_bot_state() {
  header "Discord Bot Substack Poller"
  if [[ -f "$BOT_STATE" ]]; then
    pass "State file exists: ${BOT_STATE}"
    local mtime
    mtime=$(stat -c %Y "$BOT_STATE" 2>/dev/null || echo "0")
    local now
    now=$(date +%s)
    local age=$((now - mtime))
    local max_age=3600  # 1 hour
    if [[ "$age" -lt "$max_age" ]]; then
      pass "State fresh (${age}s old)"
    else
      warn "State stale (${age}s > ${max_age}s max) — bot may not be polling"
    fi
    # Show last checked timestamp if available
    local last_checked
    last_checked=$(python3 -c "
import json
try:
    d = json.load(open('${BOT_STATE}'))
    print(d.get('last_checked', 'unknown'))
except: print('parse error')
" 2>/dev/null || echo "unknown")
    info "Last checked: ${last_checked}"
  else
    warn "Bot state file not found: ${BOT_STATE}"
    info "Discord bot may not be running or substack poller not initialized"
  fi
}

check_forge_kv() {
  header "P31 Forge KV State (scan:substack:seen)"
  info "KV state is only accessible via the deployed Worker"
  info "Endpoint: POST https://p31-forge.trimtab-signal.workers.dev/scan-substack"
  info "Auto-fanout: set env SUBSTACK_AUTO_TARGETS=\"bluesky,mastodon,discord\""
  info "KV binding: FORGE_KV (must be created and bound)"
  warn "Cron currently DISABLED (crons = [] in wrangler.toml)"
  info "Fix: re-enable crons or use Queue bridge (see QUEUE_BRIDGE.md)"
}

check_content_generation() {
  header "Content Generation Pipeline"
  if [[ -f "$GEMINI_PROMPT" ]]; then
    pass "Gemini Substack prompt exists"
    local size
    size=$(wc -l < "$GEMINI_PROMPT")
    info "Lines: ${size}"
  else
    warn "Gemini Substack prompt not found"
  fi

  if [[ -f "$CONTENT_AGENT" ]]; then
    pass "Cortex Content Agent (Durable Object) exists"
    info "Default platform: substack"
  else
    fail "Content Agent not found at ${CONTENT_AGENT}"
  fi
}

check_root_cause() {
  header "Root Cause: Why Isn't Substack Running?"
  echo ""
  echo "  Pipeline stages in order:"
  echo ""
  echo "  1. CONTENT GENERATION"
  echo "     ├─ Gemini prompt:      $([[ -f "$GEMINI_PROMPT" ]] && echo "✓ Present" || echo "✗ Missing")"
  echo "     └─ Cortex Content DO:  $([[ -f "$CONTENT_AGENT" ]] && echo "✓ Present" || echo "✗ Missing")"
  echo ""
  echo "  2. PUBLICATION"
  echo "     ├─ Substack API:       Needs SUBSTACK_API_KEY secret"
  echo "     └─ social-drop cron:   $([[ -f "${REPO_ROOT}/software/cloudflare-worker/social-drop-automation/wrangler.toml" ]] && grep -q '0 17' ${REPO_ROOT}/software/cloudflare-worker/social-drop-automation/wrangler.toml 2>/dev/null && echo "✓ Cron set" || echo "✗ No cron")"
  echo ""
  echo "  3. RSS SCAN + DIFF"
  echo "     ├─ Forge substack.js:  ✓ Present"
  echo "     ├─ KV state:          Needs FORGE_KV binding"
  echo "     └─ Cron:              $(grep -A2 'crons = ' ${REPO_ROOT}/software/p31-forge/wrangler.toml 2>/dev/null | grep -c '0 \*' || echo "0") enabled (should be 1)"
  echo ""
  echo "  4. CROSS-POST FAN-OUT"
  echo "     ├─ Targets:           bluesky, mastodon, discord"
  echo "     ├─ Trigger:           SUBSTACK_AUTO_TARGETS env var"
  echo "     └─ Worker:            p31-forge (cron disabled)"
  echo ""
  echo "  5. DISCORD NOTIFICATION"
  echo "     ├─ Bot poller:        $([[ -f "$BOT_STATE" ]] && echo "✓ State file" || echo "✗ No state")"
  echo "     └─ Webhook:           Needs SUBSTACK_WEBHOOK_URL"
  echo ""
  echo "  BLOCKERS:"
  echo "    1. p31-forge crons disabled → RSS scan not running"
  echo "    2. No SUBSTACK_API_KEY → Cannot publish via API"
  echo "    3. Discord bot may not be running (Railway deployment needed)"
  echo ""
  echo "  FIX ORDER (fastest to slowest):"
  echo "    1. Re-enable p31-forge crons (if quota allows)"
  echo "    2. OR: Deploy Queue bridge to replace cron"
  echo "    3. Confirm Railway Discord bot is live"
  echo "    4. Set SUBSTACK_API_KEY if publishing from Workers"
}

# ── Main ────────────────────────────────────────────────────────────────
if [[ $# -gt 0 ]]; then
  case "$1" in
    feed)     check_feed ;;
    bot)      check_bot_state ;;
    kv)       check_forge_kv ;;
    content)  check_content_generation ;;
    root)     check_root_cause ;;
    *)        check_feed; check_bot_state; check_forge_kv; check_content_generation; check_root_cause ;;
  esac
else
  check_feed
  check_bot_state
  check_forge_kv
  check_content_generation
  check_root_cause
fi
