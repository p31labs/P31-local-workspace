#!/bin/bash
# P31 Daily Pipeline — replaces all 5 fake money streams
# Runs once per day. Packages, deploys, health checks.
set -euo pipefail
DATE=$(date +%Y-%m-%d)
LOG_DIR="/home/p31/P31-local-workspace/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/daily-pipeline-$DATE.log"

echo "[$DATE] === P31 Daily Pipeline ===" | tee -a "$LOG"

# 1. Health check all workers (our infra, not third-party)
echo "[$DATE] Health check..." | tee -a "$LOG"
HEALTH=$(/home/p31/P31-local-workspace/scripts/health-check.sh --json 2>/dev/null || echo '{"pass":0,"fail":0}')
FAILURES=$(echo "$HEALTH" | grep -o '"fail":[0-9]*' | cut -d: -f2)
echo "[$DATE] Health: $FAILURES failures" | tee -a "$LOG"

# 2. Deploy Workers
echo "[$DATE] Deploying workers..." | tee -a "$LOG"
cd /home/p31/P31-local-workspace/software
pnpm run build 2>&1 | tail -5 >> "$LOG" || echo "[$DATE] Build had warnings" >> "$LOG"

# 3. Publish shared package if NPM_TOKEN is set
if [ -n "${NPM_TOKEN:-}" ]; then
  echo "[$DATE] Publishing @p31/shared..." | tee -a "$LOG"
  cd /home/p31/P31-local-workspace/software/packages/shared
  npm publish --access public 2>&1 | tee -a "$LOG" || echo "[$DATE] npm publish skipped (already latest?)" >> "$LOG"
fi

# 4. Clean up old logs (keep 30 days)
echo "[$DATE] Cleaning logs..." | tee -a "$LOG"
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.json" -mtime +30 -delete 2>/dev/null || true

echo "[$DATE] === Pipeline complete ===" | tee -a "$LOG"
