#!/bin/bash
# PHOS Scratchpad — Super+B hotkey target
# Opens an interactive terminal for frictionless brain dump capture
# Usage: ./scratchpad.sh [--deep|--full]

set -e

PHOS_CLI="$(dirname "$0")/cli.mjs"
MODE="${1:---deep}"

# Choose best available terminal
if command -v kitty &>/dev/null; then
  TERM_CMD="kitty --title 'PHOS Brain — Super+B'"
elif command -v xterm &>/dev/null; then
  TERM_CMD="xterm -T 'PHOS Brain — Super+B'"
else
  echo "No suitable terminal found. Install kitty or xterm."
  exit 1
fi

# Spawn terminal with phos brain session --family
# Uses -hold so user can read output before closing
$TERM_CMD -e bash -c "
  echo '=== PHOS Brain Dump — Super+B ==='
  echo 'Mode: $MODE + family'
  echo 'Type your stream of thought. Ctrl+D to submit.'
  echo ''
  node '$PHOS_CLI' brain session $MODE --family
  echo ''
  echo '=== Session complete. Close this window. ==='
  exec sleep infinity
" &
