#!/usr/bin/env bash
# Batch-label all READMEs with PMM grades.
# Usage: bash scripts/batch-label-readmes.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GRADER="$SCRIPT_DIR/grade-artifact.sh"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

find "$REPO_ROOT" -maxdepth 4 -name 'README.md' \
  -not -path '*/node_modules/*' \
  -not -path '*/.pnpm/*' \
  -not -path '*/dist/*' \
  -not -path '*/_ARCHIVE/*' \
  -not -path '*/CoGNET/*' \
  -not -path '*/cortex-ai-sdk/*' \
  | sort | while read -r readme; do

  # Skip if already has any PMM label
  if grep -qE 'PMM(_SCHEMA)?[=:]' "$readme" 2>/dev/null; then
    echo "SKIP $readme (already labeled)"
    continue
  fi

  parent_dir="$(dirname "$readme")"

  # Run grader and capture output
  grade_output=$(bash "$GRADER" "$parent_dir" 2>/dev/null) || {
    echo "ERR  $readme (grader failed)"
    continue
  }

  stage_line=$(echo "$grade_output" | grep -E '🌱|🌿|🌳|🌸|🍎')
  stage_icon=$(echo "$stage_line" | grep -oE '🌱|🌿|🌳|🌸|🍎')

  [ -z "$stage_line" ] && { echo "ERR  $readme (no stage)"; continue; }

  # Use the entire grader output as the label block
  # (it's already in the correct format starting with PMM_SCHEMA=1.1)
  # Insert after the first heading line

  awk -v label="$grade_output" '
    /^# / && !inserted {
      print
      print ""
      print label
      print ""
      inserted = 1
      next
    }
    { print }
  ' "$readme" > "${readme}.tmp" && mv "${readme}.tmp" "$readme"

  echo "DONE $readme → $stage_icon"
done

echo ""
echo "=== Batch labeling complete ==="
