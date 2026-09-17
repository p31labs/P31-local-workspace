#!/usr/bin/env bash
# add-worker-test-scaffold.sh — idempotently add vitest test scaffolding to a worker.
# Usage: bash scripts/add-worker-test-scaffold.sh <worker-dir>
# Example: bash scripts/add-worker-test-scaffold.sh workers/terminal-relay
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$REPO_ROOT/workers/_template"
WORKER_DIR="${1:?Usage: $0 <worker-dir>}"

if [[ ! -d "$WORKER_DIR" ]]; then
  echo "ERROR: $WORKER_DIR does not exist"
  exit 1
fi

WORKER_NAME="$(basename "$WORKER_DIR")"
echo "══ Adding test scaffold to $WORKER_NAME ══"

# ── package.json ──────────────────────────────────────────────────────────
if [[ ! -f "$WORKER_DIR/package.json" ]]; then
  echo "  [1/5] Creating package.json from template"
  cp "$TEMPLATE/package.json" "$WORKER_DIR/package.json"
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json
p = json.load(open('$WORKER_DIR/package.json'))
p['name'] = '$WORKER_NAME'
json.dump(p, open('$WORKER_DIR/package.json', 'w'), indent=2)
"
  fi
else
  echo "  [1/5] package.json exists — ensuring test script"
  if ! grep -q '"test"' "$WORKER_DIR/package.json" 2>/dev/null; then
    if command -v python3 >/dev/null 2>&1; then
      python3 -c "
import json
p = json.load(open('$WORKER_DIR/package.json'))
p.setdefault('scripts', {})['test'] = 'vitest run'
p.setdefault('devDependencies', {})['vitest'] = '^4.1.8'
json.dump(p, open('$WORKER_DIR/package.json', 'w'), indent=2)
"
    fi
  fi
fi

# ── vitest.config.ts ─────────────────────────────────────────────────────
if [[ ! -f "$WORKER_DIR/vitest.config.ts" ]]; then
  echo "  [2/5] Creating vitest.config.ts from template"
  cp "$TEMPLATE/vitest.config.ts" "$WORKER_DIR/vitest.config.ts"
else
  echo "  [2/5] vitest.config.ts exists — ensuring src/ include"
  # Add src/**/*.test.ts to include if not already present
  if ! grep -q "src/\*\*/\*.test" "$WORKER_DIR/vitest.config.ts" 2>/dev/null; then
    if command -v python3 >/dev/null 2>&1; then
      python3 -c "
import re
p = '$WORKER_DIR/vitest.config.ts'
text = open(p).read()
if 'src/**/*.test' not in text:
    text = text.replace(\"include: ['tests/\", \"include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/\")
    open(p, 'w').write(text)
    print('    added src/ include pattern')
"
    fi
  fi
fi

# ── src/index.test.ts (smoke test) ────────────────────────────────────────
TEST_FILE="$WORKER_DIR/src/index.test.ts"
if [[ ! -f "$TEST_FILE" ]]; then
  echo "  [3/5] Creating src/index.test.ts (smoke test)"
  mkdir -p "$WORKER_DIR/src"
  cat > "$TEST_FILE" <<'EOF'
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const workerRoot = import.meta.url
  .replace(/\/src\/index\.test\.ts$/, '')
  .replace(/^file:\/\//, '');

describe('worker scaffold smoke tests', () => {
  it('has a src/index.ts or src/index.js entrypoint', () => {
    expect(
      existsSync(`${workerRoot}/src/index.ts`) ||
      existsSync(`${workerRoot}/src/index.js`)
    ).toBe(true);
  });

  it('has a wrangler.toml with a name field', () => {
    const toml = readFileSync(`${workerRoot}/wrangler.toml`, 'utf8');
    expect(toml).toMatch(/^name\s*=/m);
  });
});
EOF
else
  echo "  [3/5] src/index.test.ts exists — skipping"
fi

# ── Install deps ──────────────────────────────────────────────────────────
if [[ -f "$WORKER_DIR/package.json" ]] && command -v pnpm >/dev/null 2>&1; then
  echo "  [4/5] Installing test dependencies"
  (cd "$WORKER_DIR" && pnpm install --frozen-lockfile 2>/dev/null || pnpm install) || true
fi

# ── Quick sanity run ──────────────────────────────────────────────────────
if [[ -f "$WORKER_DIR/package.json" ]] && grep -q '"test"' "$WORKER_DIR/package.json" 2>/dev/null; then
  echo "  [5/5] Running vitest (smoke check)"
  (cd "$WORKER_DIR" && npx vitest run 2>&1 | tail -3) || true
fi

echo "✅ Scaffold complete for $WORKER_NAME"
