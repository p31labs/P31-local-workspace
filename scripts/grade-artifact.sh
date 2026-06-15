#!/usr/bin/env bash
# P31 Maturity Model (PMM) — Automated Artifact Grader
# Usage: ./scripts/grade-artifact.sh <path>
# Prints PMM label with heuristics-based dimension scores.
# PMM_SCHEMA=1.1

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path>"
  echo "Example: $0 software/packages/agent-engine"
  exit 1
fi

TARGET="$1"
[ ! -d "$TARGET" ] && [ ! -f "$TARGET" ] && { echo "Path not found: $TARGET"; exit 1; }

# --- Heuristic scoring functions ---

score_code() {
  local d="$1"
  local src_lines=0
  local todo_count=0

  if [ -d "$d" ]; then
    local src_files
    src_files=$(find "$d" \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -name '*.test.*' 2>/dev/null | head -20)
    if [ -n "$src_files" ]; then
      src_lines=$(echo "$src_files" | xargs grep -cEv '^\s*(//|#|/\*|\*|$|import\s|export\s|interface\s|type\s)' 2>/dev/null | awk -F: '{s+=$2}END{print s+0}' || true)
      todo_count=$(echo "$src_files" | xargs grep -c 'TODO\|FIXME\|Not implemented' 2>/dev/null | awk -F: '{s+=$2}END{print s+0}' || true)
    fi
  elif [ -f "$d" ]; then
    src_lines=$(grep -cEv '^\s*(//|#|/\*|\*|$)' "$d" 2>/dev/null || true)
    todo_count=$(grep -c 'TODO\|FIXME\|Not implemented' "$d" 2>/dev/null || true)
  fi

  src_lines=${src_lines:-0}
  todo_count=${todo_count:-0}

  if [ "$src_lines" -eq 0 ]; then echo 1
  elif [ "$src_lines" -lt 20 ] || [ "$todo_count" -gt "$((src_lines / 3))" ]; then echo 2
  elif [ "$src_lines" -lt 100 ]; then echo 3
  elif [ "$src_lines" -lt 500 ]; then echo 4
  else echo 5
  fi
}

score_test() {
  local d="$1"
  local test_files=()

  if [ -d "$d" ]; then
    while IFS= read -r f; do test_files+=("$f"); done < <(find "$d" -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.test.js' -o -name '*.spec.ts' 2>/dev/null | head -10)
    # Fallback: check tests/ directory
    if [ "${#test_files[@]}" -eq 0 ] && [ -d "$d/tests" ]; then
      while IFS= read -r f; do test_files+=("$f"); done < <(find "$d/tests" -name '*.test.ts' -o -name '*.test.tsx' 2>/dev/null | head -10)
    fi
  fi

  [ "${#test_files[@]}" -eq 0 ] && { echo 1; return; }

  local total_asserts=0
  local total_tests=0
  for f in "${test_files[@]}"; do
    [ ! -f "$f" ] && continue
    local asserts tests
    asserts=$(grep -cE 'expect\(|\.toBe|\.toEqual|assert\.' "$f" 2>/dev/null || true)
    asserts=${asserts:-0}
    tests=$(grep -cE 'test\(|it\(' "$f" 2>/dev/null || true)
    tests=${tests:-0}
    total_asserts=$((total_asserts + asserts))
    total_tests=$((total_tests + tests))
  done

  local has_coverage=0
  [ -f "$d/vitest.config.ts" ] && grep -q 'thresholds' "$d/vitest.config.ts" 2>/dev/null && has_coverage=1

  if [ "${#test_files[@]}" -eq 0 ]; then echo 1
  elif [ "$total_asserts" -lt 5 ]; then echo 2
  elif [ "$has_coverage" -eq 0 ]; then echo 3
  elif [ "$total_asserts" -lt 50 ]; then echo 3
  elif [ "$total_asserts" -lt 200 ]; then echo 4
  else echo 5
  fi
}

score_docs() {
  local d="$1"
  local readme=""
  if [ -f "$d/README.md" ]; then readme="$d/README.md"
  elif [ -f "$d/../README.md" ]; then readme="$d/../README.md"
  fi

  [ -z "$readme" ] && { echo 1; return; }

  local lines
  lines=$(wc -l < "$readme")
  local has_usage=0
  grep -q '```\|Usage\|Example\|Install\|npm install\|pnpm install\|yarn add' "$readme" 2>/dev/null && has_usage=1

  if [ "$lines" -lt 5 ]; then echo 2
  elif [ "$has_usage" -eq 0 ]; then echo 2
  elif [ "$lines" -lt 30 ]; then echo 3
  elif [ "$lines" -lt 100 ]; then echo 4
  else echo 5
  fi
}

score_ops() {
  local d="$1"
  local has_wrangler=0
  local has_ci=0
  local has_script=0
  local has_deploy=0

  [ -f "$d/wrangler.toml" ] && has_wrangler=1
  [ -f "$d/Dockerfile" ] || [ -f "$d/docker-compose.yml" ] && has_deploy=1
  [ -f "$d/deploy.sh" ] && has_deploy=1
  [ -f ".github/workflows/ci.yml" ] && has_ci=1
  [ -f "$d/package.json" ] && grep -q '"build"' "$d/package.json" 2>/dev/null && has_script=1

  if [ "$has_ci" -eq 1 ] && [ "$has_wrangler" -eq 1 ]; then echo 4
  elif [ "$has_ci" -eq 1 ]; then echo 4
  elif [ "$has_wrangler" -eq 1 ] || [ "$has_deploy" -eq 1 ]; then echo 3
  elif [ "$has_script" -eq 1 ]; then echo 2
  else echo 1
  fi
}

score_sec() {
  local d="$1"
  local has_audit=0
  local has_lint=0

  local pkg=""
  [ -f "$d/package.json" ] && pkg="$d/package.json"
  [ -z "$pkg" ] && [ -f "../package.json" ] && pkg="../package.json"

  if [ -n "$pkg" ]; then
    local pdir
    pdir=$(dirname "$pkg")
    [ -f "$pdir/pnpm-lock.yaml" ] || [ -f "$pdir/yarn.lock" ] && has_audit=1
  fi

  [ -f "$d/eslint.config.mjs" ] || [ -f "$d/.eslintrc" ] && has_lint=1

  if [ "$has_audit" -eq 1 ] && [ "$has_lint" -eq 1 ]; then echo 3
  elif [ "$has_audit" -eq 1 ]; then echo 2
  elif [ "$has_lint" -eq 1 ]; then echo 2
  else echo 1
  fi
}

# --- Main ---

C=$(score_code "$TARGET")
T=$(score_test "$TARGET")
D=$(score_docs "$TARGET")
O=$(score_ops "$TARGET")
S=$(score_sec "$TARGET")

OVERALL=$C
for v in $T $D $O $S; do
  [ "$v" -lt "$OVERALL" ] && OVERALL=$v
done

stage() {
  case $1 in
    1) echo "🌱 SEED" ;;
    2) echo "🌿 SPROUT" ;;
    3) echo "🌳 SAPLING" ;;
    4) echo "🌸 BLOOM" ;;
    5) echo "🍎 FRUIT" ;;
  esac
}

weakest=""
for pair in "CODE:$C" "TEST:$T" "DOCS:$D" "OPS:$O" "SEC:$S"; do
  dim="${pair%%:*}"
  val="${pair##*:}"
  if [ "$val" -eq "$OVERALL" ]; then
    [ -n "$weakest" ] && weakest="$weakest, "
    weakest="${weakest}${dim}=${val}"
  fi
done

STAGE=$(stage "$OVERALL")
NAME=$(basename "$TARGET")

cat <<EOF
PMM_SCHEMA=1.1
$STAGE $NAME
  CODE:$C · TEST:$T · DOCS:$D · OPS:$O · SEC:$S
  → Weakest: $weakest
EOF
