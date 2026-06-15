#!/bin/bash
# monitor.sh — Health check for all money stream background jobs
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/monitor.log"
mkdir -p "$LOG_DIR"

STREAMS=(
  "bounty-hunter:bounty-hunter.sh"
  "package-assets:package-assets.sh"
  "audit-crawler:audit-crawler.sh"
  "publish-action:publish-action.sh"
  "post-sponsorships:post-sponsorships.sh"
)

while true; do
  echo "[$(date)] === Health check ===" | tee -a "$LOG_FILE"
  all_ok=true

  for entry in "${STREAMS[@]}"; do
    name="${entry%%:*}"
    script="${entry##*:}"
    pid_file="$LOG_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
      pid=$(cat "$pid_file")
      if kill -0 "$pid" 2>/dev/null; then
        echo "[$(date)]  OK  $name (PID $pid)" >> "$LOG_FILE"
      else
        echo "[$(date)]  DEAD $name (PID $pid exited)" | tee -a "$LOG_FILE"
        all_ok=false
        # Auto-restart
        echo "[$(date)]  Restarting $name..." | tee -a "$LOG_FILE"
        nohup "$SCRIPT_DIR/$script" > "$LOG_DIR/$name.log" 2>&1 &
        echo $! > "$pid_file"
        echo "[$(date)]  Restarted $name (PID $(cat "$pid_file"))" | tee -a "$LOG_FILE"
      fi
    else
      echo "[$(date)]  MISSING $name — no pid file" | tee -a "$LOG_FILE"
      all_ok=false
      # Start it
      nohup "$SCRIPT_DIR/$script" > "$LOG_DIR/$name.log" 2>&1 &
      echo $! > "$pid_file"
      echo "[$(date)]  Started $name (PID $(cat "$pid_file"))" | tee -a "$LOG_FILE"
    fi
  done

  if $all_ok; then
    echo "[$(date)] All streams healthy" >> "$LOG_FILE"
  fi

  sleep 300  # check every 5 minutes
done
