#!/usr/bin/env bash
#
# bump-compat-dates.sh
# Bumps Cloudflare Workers to a modern runtime:
#   - compatibility_date set to at least 2026-01-01 (never regresses newer dates)
#   - compatibility_flags gains nodejs_compat when absent
#
# Skips: node_modules, .wrangler, and reference/template wrangler.toml files.

set -euo pipefail

MIN_DATE="2026-01-01"

# Reference / template files that must NOT be rewritten.
SKIP_RE=(
  "software/workers/wrangler.toml"
  "software/p31-forge/wrangler.toml"
  "software/cloudflare-worker/.*/wrangler.toml"
)

should_skip() {
  local f="$1"
  for re in "${SKIP_RE[@]}"; do
    if [[ "$f" =~ $re ]]; then
      return 0
    fi
  done
  return 1
}

changed=0
skipped=0

while IFS= read -r -d '' f; do
  if should_skip "$f"; then
    skipped=$((skipped+1))
    continue
  fi

  cur=$(grep -oE 'compatibility_date = "[0-9]{4}-[0-9]{2}-[0-9]{2}"' "$f" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1 || true)

  file_changed=0

  if [[ -z "$cur" ]]; then
    echo "SKIP (no compatibility_date): $f"
    continue
  fi

  if [[ "$cur" < "$MIN_DATE" ]]; then
    sed -i "s/compatibility_date = \"$cur\"/compatibility_date = \"$MIN_DATE\"/" "$f"
    file_changed=1
  fi

  if ! grep -q 'compatibility_flags' "$f"; then
    sed -i "/compatibility_date = \"[0-9-]*\"/a compatibility_flags = [\"nodejs_compat\"]" "$f"
    file_changed=1
  elif ! grep -q 'nodejs_compat' "$f"; then
    sed -i 's/compatibility_flags = \[\(.*\)\]/compatibility_flags = [\1, "nodejs_compat"]/' "$f"
    file_changed=1
  fi

  if [[ "$file_changed" -eq 1 ]]; then
    changed=$((changed+1))
    echo "BUMPED: $f"
  fi
done < <(find . -name "wrangler.toml" -not -path "*/node_modules/*" -not -path "*/.wrangler/*" -print0)

echo ""
echo "Bumped: $changed   Skipped (reference/template): $skipped"
