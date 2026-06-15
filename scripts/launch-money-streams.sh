#!/bin/bash
# launch-money-streams.sh — Launch all money streams (tmux or nohup fallback)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/logs"
mkdir -p "$LOG_DIR"

STREAMS=(
  "bounty-hunter:bounty-hunter.sh"
  "package-assets:package-assets.sh"
  "audit-crawler:audit-crawler.sh"
  "publish-action:publish-action.sh"
  "post-sponsorships:post-sponsorships.sh"
  "monitor:monitor.sh"
)

# Try tmux first
if command -v tmux &>/dev/null && tmux new-session -d -s p31-money-streams 2>/dev/null; then
  echo "Using tmux session: p31-money-streams"
  for entry in "${STREAMS[@]}"; do
    name="${entry%%:*}"
    script="${entry##*:}"
    tmux new-window -t p31-money-streams -n "$name" "cd '$SCRIPT_DIR' && exec bash '$script'" 2>/dev/null \
      || tmux send-keys -t p31-money-streams:0 "cd '$SCRIPT_DIR' && bash '$script'" Enter
  done
  tmux select-window -t p31-money-streams:0
  echo ""
  echo "All streams launched in tmux."
  echo "  Attach:  tmux attach -t p31-money-streams"
  echo "  Detach:  Ctrl+B then D"
  echo "  Stop:    tmux kill-session -t p31-money-streams"
  echo ""
  echo "Monitoring: tail -f $LOG_DIR/*.log"
  exit 0
fi

# Fallback: nohup background jobs
echo "tmux unavailable — launching as background jobs"
for entry in "${STREAMS[@]}"; do
  name="${entry%%:*}"
  script="${entry##*:}"
  pid_file="$LOG_DIR/$name.pid"
  nohup "$SCRIPT_DIR/$script" > "$LOG_DIR/$name.log" 2>&1 &
  echo $! > "$pid_file"
  echo "  $name (PID $(cat "$pid_file"))"
done

echo ""
echo "All streams running in background."
echo "  Monitor:   tail -f $LOG_DIR/*.log"
echo "  Stop all:  kill \$(cat $LOG_DIR/*.pid 2>/dev/null) || true"
echo "  Health:    bash $SCRIPT_DIR/monitor.sh"
