#!/bin/bash
# Logs efficiency metrics hourly - to be run via cron
LOG_FILE="/home/p31/P31-local-workspace/logs/efficiency.log"
mkdir -p "$(dirname "$LOG_FILE")"
TIMESTAMP=$(date -Iseconds)

# Worker health check
WORKER_TTFB=$(curl -o /dev/null -s -w "%{time_starttransfer}" -m 5 https://p31-spoon-bridge.trimtab-signal.workers.dev/ 2>/dev/null || echo "fail")

# Stream health check - are our PID processes alive
STREAMS_ALIVE=0
STREAMS_TOTAL=0
for pidfile in /home/p31/P31-local-workspace/logs/*.pid; do
  [ -f "$pidfile" ] || continue
  STREAMS_TOTAL=$((STREAMS_TOTAL + 1))
  pid=$(cat "$pidfile")
  if ps -p $pid > /dev/null 2>&1; then
    STREAMS_ALIVE=$((STREAMS_ALIVE + 1))
  fi
done

echo "$TIMESTAMP | TTFB:${WORKER_TTFB}s | Streams:${STREAMS_ALIVE}/${STREAMS_TOTAL} | Leads:$(wc -l < /home/p31/P31-local-workspace/logs/audit-leads.json 2>/dev/null || echo 0)" >> "$LOG_FILE"
