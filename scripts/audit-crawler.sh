#!/bin/bash
# audit-crawler.sh — Find startups needing ADA compliance help via HN Show HN
source "$(cd "$(dirname "$0")" && pwd)/telegram.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/audit-crawler.log"
LEADS_FILE="$LOG_DIR/audit-leads.json"
mkdir -p "$LOG_DIR"

echo "[$(date)] === Audit Crawler starting ===" | tee -a "$LOG_FILE"

if [ ! -f "$LEADS_FILE" ]; then
  echo '[]' > "$LEADS_FILE"
fi

while true; do
  echo "[$(date)] === Lead gen cycle ===" | tee -a "$LOG_FILE"

  # Fetch latest Show HN posts (top 30)
  posts=$(curl -sf "https://hacker-news.firebaseio.com/v0/showstories.json" 2>/dev/null | jq -r '.[:30][]' 2>/dev/null) || {
    echo "[$(date)] Failed to fetch HN stories" | tee -a "$LOG_FILE"
    sleep 3600
    continue
  }

  new_leads=0
  for id in $posts; do
    item=$(curl -sf "https://hacker-news.firebaseio.com/v0/item/$id.json" 2>/dev/null) || continue
    title=$(echo "$item" | jq -r '.title // empty' 2>/dev/null)
    url=$(echo "$item" | jq -r '.url // empty' 2>/dev/null)
    text=$(echo "$item" | jq -r '.text // empty' 2>/dev/null)
    by=$(echo "$item" | jq -r '.by // empty' 2>/dev/null)

    [ -z "$title" ] && continue

    # Check if it's a web app / SaaS launch (likely needs web compliance)
    needs_audit=false
    for kw in "app" "web" "platform" "saas" "tool" "dashboard" "launch" "show"; do
      if echo "$title" | grep -qi "\b${kw}\b"; then
        needs_audit=true
        break
      fi
    done

    if $needs_audit && [ -n "$url" ]; then
      # Check if already in leads
      existing=$(jq --arg u "$url" '[.[] | select(.url == $u)] | length' "$LEADS_FILE" 2>/dev/null || echo 0)
      if [ "$existing" -eq 0 ]; then
        local ts
        ts=$(date -Iseconds)
        lead=$(python3 -c "import json,sys; print(json.dumps({'title':sys.argv[1],'url':sys.argv[2],'hn_user':sys.argv[3],'found_at':'$ts','status':'new','source':'hackernews'}))" "$title" "$url" "$by" 2>/dev/null) || continue
        tmpf=$(mktemp)
        python3 -c "import json; d=json.load(open('$LEADS_FILE')); d.append($lead); json.dump(d, open('$tmpf','w'))" 2>/dev/null && mv "$tmpf" "$LEADS_FILE" || rm -f "$tmpf"
        new_leads=$((new_leads + 1))
        echo "[$(date)]  New lead: $title ($url)" | tee -a "$LOG_FILE"
      fi
    fi
  done

  total=$(jq length "$LEADS_FILE" 2>/dev/null || echo 0)
  echo "[$(date)] Cycle complete — $new_leads new leads (total: $total)" | tee -a "$LOG_FILE"
  [ "$new_leads" -gt 0 ] && telegram "🎯 *$new_leads* new audit leads found (total: $total)
Latest: $(jq -r '.[-1].title // "none"' "$LEADS_FILE" 2>/dev/null)"

  sleep 3600  # check hourly
done
