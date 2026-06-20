#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/home/p31/P31-local-workspace"
HOME_DIR="/home/p31"
AUDIT_DIR="$HOME_DIR/.p31/audit"
MANIFEST="$AUDIT_DIR/P31_CORE_AUDIT_MANIFEST.yaml"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AUDIT_ID="CORE-AUDIT-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$AUDIT_DIR"

FINDINGS=0
add_finding() {
  local system="$1" severity="$2" title="$3" desc="$4" loc="$5" fix="$6" status="$7"
  FINDINGS=$((FINDINGS + 1))
  cat >> "$MANIFEST.tmp" <<EOF
  - id: ${AUDIT_ID}-${FINDINGS}
    severity: ${severity}
    title: "${title}"
    description: "${desc}"
    location: "${loc}"
    fix: "${fix}"
    status: ${status}
EOF
}

# Initialize manifest header
cat > "$MANIFEST.tmp" <<EOF
audit:
  id: ${AUDIT_ID}
  timestamp: ${TS}
 systems:
EOF

# ============================================================================
# 1. GROUND_TRUTH
# ============================================================================
GT_STATUS="GREEN"
GT_FILE="$HOME_DIR/meatspace/GROUND_TRUTH.yaml"
if [ ! -f "$GT_FILE" ]; then
  GT_STATUS="RED"
  add_finding "GROUND_TRUTH" "critical" "GROUND_TRUTH.yaml missing" \
    "Canonical source of system constants not found at $GT_FILE" \
    "$GT_FILE" "Create GROUND_TRUTH.yaml from template" "open"
else
  PERMS=$(stat -c '%a' "$GT_FILE")
  if [ "$PERMS" != "600" ]; then
    GT_STATUS="YELLOW"
    add_finding "GROUND_TRUTH" "high" "GROUND_TRUTH.yaml permissions not 600" \
      "File has permissions $PERMS; should be 600 to prevent unprivileged modification" \
      "$GT_FILE:$PERMS" "chmod 600 $GT_FILE" "open"
  fi
  # Check for legacy terminology
  if grep -qiE 'scram|redboard|reactor|submarine' "$GT_FILE"; then
    GT_STATUS="YELLOW"
    add_finding "GROUND_TRUTH" "medium" "Legacy terminology in GROUND_TRUTH.yaml" \
      "Military/naval terms found; must use plain language (halt, SystemHold, temperature)" \
      "$GT_FILE" "Replace legacy terms with plain language equivalents" "open"
  fi
  # Check for hardcoded absolute paths outside expected format
  if grep -q '/home/p31/' "$GT_FILE" && ! grep -q 'repo_root:' "$GT_FILE"; then
    GT_STATUS="YELLOW"
    add_finding "GROUND_TRUTH" "medium" "Hardcoded absolute path without named constant" \
      "Absolute paths should be referenced via named constants (e.g., repo_root:)" \
      "$GT_FILE" "Refactor paths to use named constants" "open"
  fi
fi

# Also check p31ca ground-truth directory
GT_P31CA="$REPO_ROOT/software/p31ca/ground-truth"
if [ ! -d "$GT_P31CA" ]; then
  add_finding "GROUND_TRUTH" "high" "p31ca ground-truth directory missing" \
    "Expected directory $GT_P31CA not found" \
    "$GT_P31CA" "Create ground-truth directory with schema files" "open"
  GT_STATUS="YELLOW"
fi

echo "  GROUND_TRUTH: ${GT_STATUS}"
cat >> "$MANIFEST.tmp" <<EOF
    GROUND_TRUTH:
      status: ${GT_STATUS}
$(cat "$MANIFEST.tmp" | grep -A1000 "GROUND_TRUTH:" | tail -n +3 | head -100)
EOF
# Remove the temporary findings from the main block (they'll be re-added below)
grep -v "^  - id: ${AUDIT_ID}-" "$MANIFEST.tmp" > "$MANIFEST.tmp2" || true

# ============================================================================
# 2. BUSBAR Linkage
# ============================================================================
BUSBAR_STATUS="GREEN"
BUSBAR_FILES=(
  "$REPO_ROOT/p31-cortex/p31_safe_router.py"
  "$REPO_ROOT/p31-cortex/affective_chemistry_app.py"
  "$REPO_ROOT/p31-cortex/spoon_monitor_app.py"
  "$HOME_DIR/.p31/abdicate.sh"
  "$HOME_DIR/.p31/emergency-halt.sh"
)

for f in "${BUSBAR_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    BUSBAR_STATUS="YELLOW"
    add_finding "BUSBAR" "medium" "BUSBAR component missing" \
      "Expected file $f not found" \
      "$f" "Restore or recreate component" "open"
  else
    if grep -qiE 'scram|redboard|reactor|submarine' "$f"; then
      BUSBAR_STATUS="YELLOW"
      add_finding "BUSBAR" "medium" "Legacy terminology in BUSBAR component" \
        "Military/naval terms found in $f" \
        "$f" "Replace with plain language (halt, SystemHold, temperature)" "open"
    fi
    if grep -q 'localhost:' "$f" && [ "$(basename "$f")" != "abdicate.sh" ]; then
      add_finding "BUSBAR" "low" "Localhost reference in BUSBAR component" \
        "Component $f contains localhost binding" \
        "$f" "Verify this is intentional dev config; use env var in production" "open"
    fi
  fi
done

# Check for emergency-halt.sh symlink or equivalent
if [ ! -f "$HOME_DIR/.p31/emergency-halt.sh" ] && [ ! -f "$REPO_ROOT/scripts/emergency-halt.sh" ]; then
  BUSBAR_STATUS="YELLOW"
  add_finding "BUSBAR" "high" "Emergency halt mechanism missing" \
    "No emergency-halt.sh found in .p31 or scripts/" \
    "$HOME_DIR/.p31/emergency-halt.sh" "Deploy emergency-halt.sh safety interlock" "open"
fi

echo "  BUSBAR: ${BUSBAR_STATUS}"

# ============================================================================
# 3. COGNITIVE_PASSPORT
# ============================================================================
PASSPORT_STATUS="GREEN"
PASSPORT_FILE="$HOME_DIR/.p31/cognitive-passport.json"
PASSPORT_DIR="$HOME_DIR/.p31/cognitive-passport"

if [ ! -f "$PASSPORT_FILE" ]; then
  PASSPORT_STATUS="RED"
  add_finding "COGNITIVE_PASSPORT" "critical" "Cognitive passport state file missing" \
    "Live operator state not persisted at $PASSPORT_FILE" \
    "$PASSPORT_FILE" "Initialize cognitive-passport.json with baseline schema" "open"
else
  # Validate JSON
  if ! python3 -c "import json; json.load(open('$PASSPORT_FILE'))" 2>/dev/null; then
    PASSPORT_STATUS="RED"
    add_finding "COGNITIVE_PASSPORT" "critical" "Cognitive passport JSON invalid" \
      "State file is not valid JSON; system cannot read operator state" \
      "$PASSPORT_FILE" "Repair JSON structure or reinitialize from baseline" "open"
  fi
  PERMS=$(stat -c '%a' "$PASSPORT_FILE")
  if [ "$PERMS" != "600" ]; then
    PASSPORT_STATUS="YELLOW"
    add_finding "COGNITIVE_PASSPORT" "high" "Cognitive passport permissions not 600" \
      "Sensitive operator state has permissions $PERMS; should be 600" \
      "$PASSPORT_FILE:$PERMS" "chmod 600 $PASSPORT_FILE" "open"
  fi
fi

if [ ! -d "$PASSPORT_DIR" ]; then
  add_finding "COGNITIVE_PASSPORT" "medium" "Cognitive passport directory missing" \
    "Expected directory $PASSPORT_DIR not found" \
    "$PASSPORT_DIR" "Create directory for session logs and retired tasks" "open"
else
  # Check for abdicate/retired files
  RETIRED_COUNT=$(find "$PASSPORT_DIR" -name '*.abdicate' -o -name '*.retired' 2>/dev/null | wc -l)
  if [ "$RETIRED_COUNT" -eq 0 ]; then
    add_finding "COGNITIVE_PASSPORT" "low" "No retired task tombstones found" \
      "Cognitive passport directory exists but contains no .abdicate or .retired files" \
      "$PASSPORT_DIR" "Verify tombstone writing is functional" "open"
  fi
fi

# Check canary gate state
if [ ! -f "$HOME_DIR/.p31/task-logs/check.done" ]; then
  add_finding "COGNITIVE_PASSPORT" "medium" "Canary re-entry gate not cleared" \
    "check.done file missing; CANARY gate blocks Track B/C" \
    "$HOME_DIR/.p31/task-logs/check.done" "Complete grounding task or use --force override" "open"
fi

echo "  COGNITIVE_PASSPORT: ${PASSPORT_STATUS}"

# ============================================================================
# 4. IDENTITY Systems
# ============================================================================
IDENTITY_STATUS="GREEN"
IDENTITY_DIR="$HOME_DIR/.p31/identity"

if [ ! -d "$IDENTITY_DIR" ]; then
  IDENTITY_STATUS="RED"
  add_finding "IDENTITY" "critical" "IDENTITY system directory missing" \
    "No $IDENTITY_DIR found; authentication/authorization not materialized" \
    "$IDENTITY_DIR" "Create identity directory with roles.yaml and admins.txt" "open"
else
  if [ ! -f "$IDENTITY_DIR/roles.yaml" ]; then
    IDENTITY_STATUS="YELLOW"
    add_finding "IDENTITY" "high" "roles.yaml missing" \
      "Role definitions and permissions not defined" \
      "$IDENTITY_DIR/roles.yaml" "Create roles.yaml with operator, auditor, system roles" "open"
  fi
  if [ ! -f "$IDENTITY_DIR/admins.txt" ]; then
    IDENTITY_STATUS="YELLOW"
    add_finding "IDENTITY" "high" "admins.txt missing" \
      "Authorized operators list not defined" \
      "$IDENTITY_DIR/admins.txt" "Create admins.txt with authorized operator identifiers" "open"
  fi
  if [ ! -f "$IDENTITY_DIR/access.log" ]; then
    add_finding "IDENTITY" "medium" "access.log missing" \
      "Authentication/authorization audit trail not initialized" \
      "$IDENTITY_DIR/access.log" "Initialize access.log; ensure rotation policy" "open"
  fi
fi

echo "  IDENTITY: ${IDENTITY_STATUS}"

# ============================================================================
# Semantic & Vocabulary Cross-Check
# ============================================================================
SEMANTIC_STATUS="GREEN"
LEGACY_COUNT=$(grep -rInE 'scram|redboard|reactor|submarine' \
  "$REPO_ROOT/scripts" "$HOME_DIR/.p31" "$HOME_DIR/meatspace" \
  "$REPO_ROOT/p31-cortex" "$REPO_ROOT/admin" 2>/dev/null \
  | grep -v node_modules | grep -v .git | wc -l)

if [ "$LEGACY_COUNT" -gt 0 ]; then
  SEMANTIC_STATUS="YELLOW"
  add_finding "SEMANTIC" "medium" "Legacy terminology found in core system files" \
    "$LEGACY_COUNT occurrences of military/naval terms in scripts, config, docs" \
    "scripts/, .p31/, meatspace/, p31-cortex/, admin/" \
    "Replace scram/redboard/reactor/submarine with plain language" "open"
fi
echo "  SEMANTIC: ${SEMANTIC_STATUS}"

# ============================================================================
# Build final manifest
# ============================================================================
{
  echo "audit:"
  echo "  id: ${AUDIT_ID}"
  echo "  timestamp: ${TS}"
  echo "  findings_total: ${FINDINGS}"
  echo "  systems:"
  echo "    GROUND_TRUTH:"
  echo "      status: ${GT_STATUS}"
  echo "      findings:"
  grep -E "^  - id: ${AUDIT_ID}-[0-9]+" "$MANIFEST.tmp2" | while read -r line; do
    echo "$line"
  done
  echo "    BUSBAR:"
  echo "      status: ${BUSBAR_STATUS}"
  echo "      findings:"
  grep -E "^  - id: ${AUDIT_ID}-" "$MANIFEST.tmp2" | grep 'BUSBAR' || echo "      []"
  echo "    COGNITIVE_PASSPORT:"
  echo "      status: ${PASSPORT_STATUS}"
  echo "      findings:"
  grep -E "^  - id: ${AUDIT_ID}-" "$MANIFEST.tmp2" | grep 'COGNITIVE_PASSPORT' || echo "      []"
  echo "    IDENTITY:"
  echo "      status: ${IDENTITY_STATUS}"
  echo "      findings:"
  grep -E "^  - id: ${AUDIT_ID}-" "$MANIFEST.tmp2" | grep 'IDENTITY' || echo "      []"
  echo "    SEMANTIC:"
  echo "      status: ${SEMANTIC_STATUS}"
  echo "      findings:"
  grep -E "^  - id: ${AUDIT_ID}-" "$MANIFEST.tmp2" | grep 'SEMANTIC' || echo "      []"
} > "$MANIFEST"

mv "$MANIFEST.tmp2" "$MANIFEST.bak" 2>/dev/null || true
rm -f "$MANIFEST.tmp" "$MANIFEST.tmp2" "$MANIFEST.bak"

echo ""
echo "========================================"
echo " AUDIT COMPLETE"
echo " ID: ${AUDIT_ID}"
echo " FINDINGS: ${FINDINGS}"
echo " MANIFEST: ${MANIFEST}"
echo "========================================"

# Exit with finding count as code (capped at 127 for shell)
if [ "$FINDINGS" -gt 127 ]; then
  exit 127
else
  exit "$FINDINGS"
fi
