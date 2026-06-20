#!/usr/bin/env bash
# launch-money-streams.sh — Launch all P31 money streams under tmux
# Part of the P31 Money Stream mesh.
set -euo pipefail

P31_REPO_ROOT="${P31_REPO_ROOT:-/home/p31/P31-local-workspace}"
SCRIPTS="${P31_REPO_ROOT}/scripts"
LOG_DIR="${P31_REPO_ROOT}/logs"
SESSION="p31-money-streams"

mkdir -p "$LOG_DIR"

# Kill existing session if any
tmux kill-session -t "$SESSION" 2>/dev/null || true

tmux new-session -d -s "$SESSION" -n monitor

# Stream 1: bounty-hunter (every 2h)
tmux new-window -t "$SESSION" -n bounty-hunter
tmux send-keys -t "$SESSION:bounty-hunter" "while true; do ${SCRIPTS}/bounty-hunter.sh; sleep 7200; done" Enter

# Stream 2: package-assets (every 1h)
tmux new-window -t "$SESSION" -n package-assets
tmux send-keys -t "$SESSION:package-assets" "while true; do ${SCRIPTS}/package-assets.sh; sleep 3600; done" Enter

# Stream 3: audit-crawler (every 1h)
tmux new-window -t "$SESSION" -n audit-crawler
tmux send-keys -t "$SESSION:audit-crawler" "while true; do ${SCRIPTS}/audit-crawler.sh; sleep 3600; done" Enter

# Stream 4: publish-action (every 1h)
tmux new-window -t "$SESSION" -n publish-action
tmux send-keys -t "$SESSION:publish-action" "while true; do ${SCRIPTS}/publish-action.sh; sleep 3600; done" Enter

# Stream 5: post-sponsorships (every 2h)
tmux new-window -t "$SESSION" -n post-sponsorships
tmux send-keys -t "$SESSION:post-sponsorships" "while true; do ${SCRIPTS}/post-sponsorships.sh; sleep 7200; done" Enter

# Monitor window: restarts dead streams
tmux send-keys -t "$SESSION:monitor" "while true; do
  for w in bounty-hunter package-assets audit-crawler publish-action post-sponsorships; do
    tmux list-windows -t '$SESSION' -F '#{window_name}' | grep -q \"\$w\" || {
      tmux new-window -t '$SESSION' -n \"\$w\"
      tmux send-keys -t '$SESSION:\$w' \"while true; do \${SCRIPTS}/\${w}.sh; sleep ${interval:-3600}; done\" Enter
      echo \"[\$(date -u +%Y-%m-%dT%H:%M:%SZ)] restart: \$w\" >> ${LOG_DIR}/monitor.log
    }
  done
  sleep 300
done" Enter

echo "Money streams launched in tmux session: $SESSION"
echo "  Attach: tmux attach -t $SESSION"
echo "  Monitor logs: tail -f ${LOG_DIR}/*.log"
