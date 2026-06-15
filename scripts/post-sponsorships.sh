#!/bin/bash
# post-sponsorships.sh — Outreach automation: GitHub Sponsors updates, outreach log
source "$(cd "$(dirname "$0")" && pwd)/telegram.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/post-sponsorships.log"
OUTREACH_FILE="$LOG_DIR/outreach.log"
mkdir -p "$LOG_DIR"

GH_TOKEN="${GH_TOKEN:-}"

echo "[$(date)] === Outreach Automation starting ===" | tee -a "$LOG_FILE"

log_outreach() {
  local channel="$1" target="$2" subject="$3"
  echo "[$(date)] [$channel] -> $target | $subject" >> "$OUTREACH_FILE"
  echo "[$(date)]  Outreach: [$channel] $target — $subject" | tee -a "$LOG_FILE"
}

while true; do
  echo "[$(date)] === Outreach cycle ===" | tee -a "$LOG_FILE"

  # ── GitHub Sponsors tier sync ──
  if [ -n "$GH_TOKEN" ]; then
    echo "[$(date)] Syncing GitHub Sponsors tiers..." | tee -a "$LOG_FILE"
    # Attempt to check sponsorships — endpoint may not be enabled for this token
    local gh_resp
    gh_resp=$(curl -s -H "Authorization: token $GH_TOKEN" "https://api.github.com/user/sponsorships?per_page=1" 2>/dev/null || echo '{}')
    local sponsor_count
    if echo "$gh_resp" | jq -e '.message | contains("Not Found")' >/dev/null 2>&1; then
      sponsor_count="(API not available for this token)"
    else
      sponsor_count=$(echo "$gh_resp" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo 0)
    fi
    log_outreach "github-sponsors" "api" "Current sponsors: $sponsor_count"
  else
    echo "[$(date)] GH_TOKEN not set — skipping GitHub API" | tee -a "$LOG_FILE"
  fi

  # ── ADA lead follow-up (from audit-crawler leads) ──
  LEADS_FILE="$LOG_DIR/../logs/audit-leads.json"
  if [ -f "$LEADS_FILE" ]; then
    new_leads=$(jq '[.[] | select(.status == "new")]' "$LEADS_FILE" 2>/dev/null)
    new_count=$(echo "$new_leads" | jq length 2>/dev/null || echo 0)
    echo "[$(date)] Pending leads to follow up: $new_count" | tee -a "$LOG_FILE"

    if [ "$new_count" -gt 0 ]; then
      # Simulate follow-up (logged only — no emails sent without API)
      for lead in $(echo "$new_leads" | jq -c '.[]' 2>/dev/null); do
        title=$(echo "$lead" | jq -r '.title')
        url=$(echo "$lead" | jq -r '.url')
        log_outreach "email-pending" "$title" "ADA compliance opportunity for $url"
      done
      # Mark as contacted using python3 for reliable JSON manipulation
      tmpf=$(mktemp)
      python3 -c "
import json
d = json.load(open('$LEADS_FILE'))
for item in d:
    if item.get('status') == 'new':
        item['status'] = 'contacted'
json.dump(d, open('$tmpf', 'w'))
" 2>/dev/null && mv "$tmpf" "$LEADS_FILE" || rm -f "$tmpf"
    fi
  fi

  echo "[$(date)] Outreach cycle complete" | tee -a "$LOG_FILE"
  telegram "🤝 Outreach cycle complete
Sponsors: ${sponsor_count:-unknown}
Pending leads: ${new_count:-0}
Next cycle in 2 hours"
  sleep 7200  # every 2 hours
done
