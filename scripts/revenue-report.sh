# Revenue Report — Yardmaster Integration
# Adds revenue summary to yardmaster's existing inspect/cycle commands.
#
# Drop-in addition: source this file from p31-yardmaster.sh
# Or call: yardmaster revenue [summary|daily|products]

revenue_report() {
  local subcmd="${1:-summary}"
  header "Revenue Report — $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  yardmaster_log "revenue_report_start"

  # Try D1 first
  if command -v wrangler >/dev/null 2>&1 && [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    local daily_result
    daily_result=$(wrangler d1 execute p31-revenue-db --remote \
      --command "SELECT date, source, gross, refunds, net, count FROM daily_revenue ORDER BY date DESC LIMIT 7;" 2>/dev/null || echo "[]")

    if [[ "$daily_result" != "[]" && "$daily_result" != *"error"* ]]; then
      echo "  Last 7 days (D1):"
      echo "$daily_result" | python3 -c "
import sys, json
try:
    rows = json.loads(sys.stdin.read())
    for r in rows:
        print(f\"    {r['date']}  {r['source']:>15}  \${r['net']:.2f} net ({r['count']} sales)\")
except: print('    (parse error)')
" 2>/dev/null || echo "    (D1 query failed)"
    fi
  fi

  # Fallback: log files
  echo ""
  echo "  Money Stream Logs (last run):"
  for stream in "${REGISTERED_MONEY_STREAMS[@]}"; do
    local log_path="${REPO_ROOT}/${MONEY_STREAM_LOG[$stream]:-}"
    if [[ -f "$log_path" ]]; then
      local mtime age now
      mtime=$(stat -c %Y "$log_path" 2>/dev/null || echo "0")
      now=$(date +%s)
      age=$((now - mtime))
      local max_age=${MONEY_STREAM_INTERVAL[$stream]:-7200}
      if [[ "$age" -lt "$((max_age * 2))" ]]; then
        pass "$stream: fresh (${age}s)"
      else
        fail "$stream: stale (${age}s)"
      fi
    else
      warn "$stream: no log yet"
    fi
  done

  yardmaster_log "revenue_report_complete"
}

revenue_products() {
  header "Revenue Products — Gumroad + Ko-fi"
  echo ""
  echo "  KO-FI (active):"
  echo "    1. Minimum Enclosing Structure (PDF)  — \$5 PWYW"
  echo "    2. K₄ Convergence Table Print (SVG)  — \$3"
  echo "    3. Floating Neutral Diagram (SVG)     — \$3"
  echo "    4. As Above So Below Print (SVG)      — \$3"
  echo ""
  echo "  GUMROAD (ready to upload):"
  echo "    Products configured in .p31/config.yaml"
  echo "    Run: scripts/package-assets.sh --file <path> --product <id>"
  echo ""
  echo "  PIPELINE:"
  echo "    Ko-fi     → p31-kofi-webhook Worker → Discord + KV node count"
  echo "    Gumroad   → p31-gumroad-webhook Worker → D1 + Queue + Discord"
  echo "    OSC       → Open Collective (pending fiscal sponsorship)"
}
