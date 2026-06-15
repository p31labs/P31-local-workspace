#!/usr/bin/env bash
# Telegram alert helper — sourced by stream scripts.
# Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.master
# Usage: telegram "message text"

telegram() {
  local msg="$1"
  local token="${TELEGRAM_BOT_TOKEN:-}"
  local chat="${TELEGRAM_CHAT_ID:-}"
  if [ -z "$token" ] || [ -z "$chat" ]; then
    return 0  # silently skip if not configured
  fi
  curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -d "chat_id=${chat}" \
    -d "text=${msg}" \
    -d "parse_mode=Markdown" \
    -o /dev/null 2>/dev/null
}

# If sourced, just define the function.
# If executed directly, send the first argument.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  telegram "$1"
fi
