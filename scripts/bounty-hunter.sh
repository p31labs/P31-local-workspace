#!/bin/bash
# bounty-hunter.sh — Scan Web3/infra protocols for vulnerabilities via nuclei
source "$(cd "$(dirname "$0")" && pwd)/telegram.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/bounty-hunter.log"
FINDINGS_FILE="$LOG_DIR/bounty-findings.json"
mkdir -p "$LOG_DIR"

echo "[$(date)] === Bounty Hunter starting ===" | tee -a "$LOG_FILE"

# Install nuclei via go if missing
if ! command -v nuclei &>/dev/null; then
  echo "[$(date)] Installing nuclei..." | tee -a "$LOG_FILE"
  go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest 2>&1 | tee -a "$LOG_FILE"
  export PATH="$HOME/go/bin:$PATH"
fi

NUCLEI=$(command -v nuclei)
echo "[$(date)] nuclei: $($NUCLEI -version 2>&1 | head -1)" | tee -a "$LOG_FILE"

TARGETS=(
  "https://p31ca.org"
  "https://phos.p31ca.org"
  "https://willow.p31ca.org"
  "https://bonding.p31ca.org"
  "https://phosphorus31.org"
)

findings() {
  local sev="$1" name="$2" url="$3" desc="$4"
  echo "{\"severity\":\"$sev\",\"name\":\"$name\",\"url\":\"$url\",\"description\":\"$desc\",\"found_at\":\"$(date -Iseconds)\"}"
}

while true; do
  echo "[$(date)] === Scan cycle ===" | tee -a "$LOG_FILE"
  : > "$FINDINGS_FILE.tmp"

  for url in "${TARGETS[@]}"; do
    echo "[$(date)] Scanning $url..." | tee -a "$LOG_FILE"
    # nuclei scan for low-hanging vulnerabilities
    $NUCLEI -u "$url" -severity low,medium -silent -json 2>/dev/null \
      | jq -c '{template: .template-id, severity: .info.severity, name: .info.name, url: .host, matched: .matched}' \
      >> "$FINDINGS_FILE.tmp" 2>/dev/null || true

    # Check TLS/SSL cert expiry
    cert_expiry=$(echo | openssl s_client -servername "$(echo "$url" | sed 's|https://||;s|/.*||')" \
      -connect "$(echo "$url" | sed 's|https://||;s|/.*||'):443" 2>/dev/null \
      | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
    if [ -n "$cert_expiry" ]; then
      exp_epoch=$(date -d "$cert_expiry" +%s 2>/dev/null || echo 0)
      now_epoch=$(date +%s)
      days_left=$(( (exp_epoch - now_epoch) / 86400 ))
      if [ "$days_left" -lt 30 ] && [ "$days_left" -gt 0 ]; then
        findings "medium" "TLS cert expiring" "$url" "SSL cert expires in $days_left days ($cert_expiry)" >> "$FINDINGS_FILE.tmp"
      fi
    fi

    # Check security headers
    headers=$(curl -s -I "$url" 2>/dev/null)
    for hdr in "Strict-Transport-Security" "Content-Security-Policy" "X-Frame-Options"; do
      if ! echo "$headers" | grep -qi "$hdr"; then
        findings "low" "Missing security header" "$url" "Response missing $hdr header" >> "$FINDINGS_FILE.tmp"
      fi
    done
  done

  # Replace findings each cycle (current snapshot, not accumulated history)
  jq -s 'unique | sort_by(.severity)' "$FINDINGS_FILE.tmp" > "$FINDINGS_FILE" 2>/dev/null || cp "$FINDINGS_FILE.tmp" "$FINDINGS_FILE"
  rm -f "$FINDINGS_FILE.tmp"

  count=$(jq length "$FINDINGS_FILE" 2>/dev/null || echo 0)
  echo "[$(date)] Scan complete — $count findings logged" | tee -a "$LOG_FILE"
  telegram "🔍 Bounty scan complete — *$count* new findings
Targets: ${TARGETS[*]}
Log: $LOG_FILE"

  sleep 7200  # 2 hours between cycles
done
