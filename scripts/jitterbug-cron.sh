#!/usr/bin/env bash
# Jitterbug cron runner — grades, oscillates, commits every 6 hours.
# Called from user crontab: 0 */6 * * *
set -euo pipefail

REPO="/home/p31/andromeda"
LOG="/tmp/jitterbug-cron.log"

cd "$REPO"

echo "=== Jitterbug cron $(date -Iseconds) ===" >> "$LOG"

git pull --ff-only origin main >> "$LOG" 2>&1 || echo "git pull skipped (not always available in cron)"

python3 scripts/grade-repo.py >> "$LOG" 2>&1
python3 scripts/jitterbug-daemon.py >> "$LOG" 2>&1

git add grading-index.json GRADING_REPORT.md jitterbug-state.json jitterbug-depressed-queue.json jitterbug-signals.json spoon-state.json >> "$LOG" 2>&1 || true
git diff --cached --quiet || git commit -m "chore: jitterbug cron tick [skip ci]" >> "$LOG" 2>&1 || true
git push origin main >> "$LOG" 2>&1 || echo "git push skipped" >> "$LOG"

echo "=== Done $(date -Iseconds) ===" >> "$LOG"
