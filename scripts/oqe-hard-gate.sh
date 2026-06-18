#!/usr/bin/env bash
# oqe-hard-gate.sh — Pre-Commit OQE Gate
# P31 SOP: OQE-001 | WCD-06 Enforcement
#
# Runs as .git/hooks/pre-commit. Blocks commits that:
#   1. Are executed during Red Board state (Track B suspended)
#   2. Contain OQE violations (risk patterns, invariant violations, inflated claims)
#   3. Lack WCD-06 signoff on code files
#
# Override (logged RCA):
#   COMMIT_OQE_RCA="reason" git commit ...
#
# Exit codes:
#   0  Gate open — commit proceeds
#   1  Gate closed — violations found
#   2  Red Board active — all Track B commits blocked

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$P31_REPO_ROOT")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRAM_SCRIPT="${SCRIPT_DIR}/redboard-scram.sh"
VERIFIER="${SCRIPT_DIR}/oqe-verifier.py"
OVERRIDE_RCA="${COMMIT_OQE_RCA:-}"
OVERRIDE_RCA_FILE="${REPO_ROOT}/.p31/rca/oqe-overrides.jsonl"

# Colors (disabled if not a tty)
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  P31 OQE HARD GATE — WCD-06 Enforcement${NC}"
echo -e "${CYAN}  $(date -u +"%Y-%m-%dT%H:%M:%SZ")${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""

# -----------------------------------------------------------------------
# CHECK 1: Red Board State
# -----------------------------------------------------------------------
info "Checking Red Board state..."
if [[ -f "$SCRAM_SCRIPT" ]]; then
  if ! bash "$SCRAM_SCRIPT" check >/dev/null 2>&1; then
    fail "RED BOARD ACTIVE — Track B commits BLOCKED."
    fail "Complete dead-stick test: bash ${SCRIPT_DIR}/P31-CANARY.sh"
    fail "Or use: COMMIT_OQE_RCA=\"emergency bypass\" git commit ..."
    exit 2
  fi
  pass "Red Board: CLEAR"
else
  warn "redboard-scram.sh not found — skipping Red Board check"
fi

# -----------------------------------------------------------------------
# CHECK 2: OQE Verification
# -----------------------------------------------------------------------
info "Running OQE verifier on staged files..."

if [[ ! -f "$VERIFIER" ]]; then
  warn "oqe-verifier.py not found at ${VERIFIER} — gate is UNARMED"
  warn "Commits will proceed without OQE verification."
  exit 0
fi

VERIFIER_RESULT=$(python3 "$VERIFIER" --json 2>/dev/null) || VERIFIER_EXIT=$?
VERIFIER_EXIT=${VERIFIER_EXIT:-0}

# Parse result
PASSED=$(echo "$VERIFIER_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('passed', False))" 2>/dev/null || echo "unknown")
VIOLATION_COUNT=$(echo "$VERIFIER_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('violations', [])))" 2>/dev/null || echo "?")
WCD06_MISSING=$(echo "$VERIFIER_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('wcd06_missing_count', 0))" 2>/dev/null || echo "?")
FILES_SCANNED=$(echo "$VERIFIER_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('files_scanned', 0))" 2>/dev/null || echo "?")

info "Files scanned: ${FILES_SCANNED}"

# -----------------------------------------------------------------------
# DECISION
# -----------------------------------------------------------------------

if [[ "$PASSED" == "True" ]]; then
  pass "OQE: GATE OPEN"
  echo ""
  exit 0
fi

# Violations found
fail "OQE: GATE CLOSED"
echo ""
echo -e "${RED}Violations (${VIOLATION_COUNT}):${NC}"
echo "$VERIFIER_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for v in d.get('violations', []):
    loc = f\"{v['file']}:{v['line']}\" if v['line'] else v['file']
    print(f\"  [{v['severity']}] {loc}\")
    print(f\"           {v['pattern']}: {v['description']}\")
print()
" 2>/dev/null

if [[ "$WCD06_MISSING" -gt 0 ]]; then
  warn "WCD-06 signoff missing from ${WCD06_MISSING} file(s)"
  warn "Add this line to each code file:"
  warn "  # WCD-06: SIGNED — <initials> <YYYY-MM-DD> — <task description>"
  echo ""
fi

# Force override path
if [[ -n "$OVERRIDE_RCA" ]]; then
  warn "FORCE OVERRIDE engaged — RCA reason: ${OVERRIDE_RCA}"
  mkdir -p "$(dirname "$OVERRIDE_RCA_FILE")" 2>/dev/null || true
  OVERRIDE_ENTRY=$(python3 -c "
import json, datetime
print(json.dumps({
    'timestamp': datetime.datetime.now().isoformat(),
    'event': 'oqe_force_override',
    'rca': '''${OVERRIDE_RCA}''',
    'env': '''$(whoami)@$(hostname)''',
    'violations': ${VIOLATION_COUNT},
}))
" 2>/dev/null)
  echo "$OVERRIDE_ENTRY" >> "$OVERRIDE_RCA_FILE" 2>/dev/null || true
  pass "Override logged to ${OVERRIDE_RCA_FILE}"
  exit 0
fi

echo ""
fail "COMMIT BLOCKED"
echo ""
echo "  To override (requires RCA):"
echo "    COMMIT_OQE_RCA=\"<reason>\" git commit ..."
echo ""
echo "  To fix automatically:"
echo "    cd ${REPO_ROOT}"
echo "    python scripts/oqe-verifier.py  # see exact violations"
echo ""
exit 1
