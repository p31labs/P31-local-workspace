#!/usr/bin/env bash
# p31-audit-scan.sh — Lightweight audit scanner for the P31 Yardmaster system.
# Writes findings to P31_AUDIT_MANIFEST.yaml (appends new findings, dedupes by title+location).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AUDIT_MANIFEST="$REPO_ROOT/.p31/audit/P31_AUDIT_MANIFEST.yaml"
SCAN_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NEXT_ID=100

# Ensure manifest exists
mkdir -p "$(dirname "$AUDIT_MANIFEST")"
[[ -f "$AUDIT_MANIFEST" ]] || echo "findings: []" > "$AUDIT_MANIFEST"

# Helper: append a finding if not already present (dedup by title+location)
audit_append() {
  local severity="$1" category="$2" title="$3" description="$4" location="$5" fix="$6"
  # Escape double quotes for YAML
  title="${title//\"/\\\"}"
  description="${description//\"/\\\"}"
  fix="${fix//\"/\\\"}"
  # Check if finding with same title+location already exists
  if grep -qF "title: \"$title\"" "$AUDIT_MANIFEST" && grep -qF "location: \"$location\"" "$AUDIT_MANIFEST"; then
    return
  fi
  local id="AUDIT-$(printf '%03d' $NEXT_ID)"
  cat >> "$AUDIT_MANIFEST" <<YAML
  - id: $id
    severity: $severity
    category: $category
    title: "$title"
    description: "$description"
    location: "$location"
    fix: "$fix"
    status: open
    assigned_to: null
    fix_commit: null
    verification_evidence: null
    created_at: "$SCAN_TIMESTAMP"
    updated_at: "$SCAN_TIMESTAMP"
YAML
  NEXT_ID=$((NEXT_ID + 1))
}

echo "══ P31 Audit Scanner — $SCAN_TIMESTAMP ══"

# --- CHECK 1: Control plane file permissions ---
echo "  [1/6] Checking control plane permissions..."
for f in "$REPO_ROOT/P31-FUEL-BUDGET.yaml" "$REPO_ROOT/P31_SHELF_MANIFEST.yaml"; do
  if [[ -f "$f" ]]; then
    perms=$(stat -c "%a" "$f" 2>/dev/null || stat -f "%Lp" "$f" 2>/dev/null || echo "???")
    if [[ "$perms" != "600" ]]; then
      audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" high security "Control plane file $f is $perms (expected 600)" \
        "File permissions on $f are $perms, not 600. Any user can modify fuel gates or health scores." \
        "$f" "chmod 600 $f"
      NEXT_ID=$((NEXT_ID + 1))
    fi
  fi
done

# --- CHECK 2: Legacy terminology in active operational code ---
echo "  [2/6] Scanning for legacy military/naval terminology..."
LEGACY_TERMS="OBE|submarine|reactor|axe man|naval|military|torpedo|depth charge|sonar|periscope|bulkhead|rivet|scuttle|sink|anchor|hull|keel|mast|rigging|deck|bow|stern|fore|aft|task force|squadron|battalion|platoon|squad|sergeant|lieutenant|commander|admiral|commodore|ensign"
# Exclude paths
EXCLUDE_PATHS="kenosis-mesh|Sierpinski|\.bak$|archive/|\.git/|node_modules/|vendor-three|docs/|admin/|\.md$"
SCAN_PATHS=(
  "$REPO_ROOT/scripts"
  "$REPO_ROOT/software"
)
ROOT_YAML=(
  "$REPO_ROOT/P31-FUEL-BUDGET.yaml"
  "$REPO_ROOT/P31_SHELF_MANIFEST.yaml"
)

while IFS= read -r file; do
  matches=$(grep -iE "$LEGACY_TERMS" "$file" 2>/dev/null | grep -ivE "$EXCLUDE_PATHS" || true)
  if [[ -n "$matches" ]]; then
    while IFS= read -r match; do
      line=$(echo "$match" | cut -d: -f2)
      term=$(echo "$match" | grep -oE -i "$LEGACY_TERMS" | head -1)
      audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" medium vocabulary "Legacy term '$term' found in $file" \
        "Legacy military/naval term '$term' detected in operational code or config." \
        "$file:$line" "Replace with plain-language equivalent"
      NEXT_ID=$((NEXT_ID + 1))
    done <<< "$matches"
  fi
done < <(find "${SCAN_PATHS[@]}" -maxdepth 3 -type f \( -name "*.sh" -o -name "*.py" -o -name "*.ts" -o -name "*.js" -o -name "*.yaml" \) 2>/dev/null | grep -vE "$EXCLUDE_PATHS")

# --- CHECK 3: Orphaned temp files ---
echo "  [3/6] Checking for orphaned temp files..."
while IFS= read -r tmpfile; do
  audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" high hygiene "Orphaned temp file in repo root" \
    "Temp file from interrupted operation: $tmpfile. Exposes intermediate state." \
    "$tmpfile" "rm $tmpfile"
  NEXT_ID=$((NEXT_ID + 1))
done < <(find "$REPO_ROOT" -maxdepth 1 -type f \( -name "*.tmp*" -o -name "*.bak" \) 2>/dev/null)

# --- CHECK 4: Hardcoded paths in Python scripts ---
echo "  [4/6] Checking for hardcoded wrong paths in Python daemons..."
while IFS= read -r pyfile; do
  if grep -qE 'Path\("/home/p31/andromeda"\)' "$pyfile" 2>/dev/null; then
    audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" medium paths "Hardcoded wrong REPO_ROOT in $pyfile" \
      "Script points to /home/p31/andromeda instead of /home/p31/P31-local-workspace" \
      "$pyfile" "Use os.environ.get('P31_REPO_ROOT', '/home/p31/P31-local-workspace')"
    NEXT_ID=$((NEXT_ID + 1))
  fi
done < <(find "$REPO_ROOT/scripts" -maxdepth 1 -type f -name "*.py" 2>/dev/null)

# --- CHECK 5: Command injection patterns in shell scripts ---
echo "  [5/6] Checking for command injection patterns..."
while IFS= read -r shfile; do
  if grep -qE 'python3 -c.*\$\{' "$shfile" 2>/dev/null; then
    audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" high security "Potential command injection in $shfile" \
      "Shell variable interpolated into python3 -c string without sanitization." \
      "$shfile" "Pass variables via sys.argv instead of string interpolation"
    NEXT_ID=$((NEXT_ID + 1))
  fi
done < <(find "$REPO_ROOT/scripts" -maxdepth 2 -type f -name "*.sh" 2>/dev/null)

# --- CHECK 6: Shelf manifest integrity ---
echo "  [6/6] Validating shelf manifest structure..."
if [[ -f "$REPO_ROOT/P31_SHELF_MANIFEST.yaml" ]]; then
  # Check for orphaned version values (lines with just a version number, no key)
  orphaned=$(grep -nE '^\s+[0-9]+\.[0-9]+\.[0-9]+' "$REPO_ROOT/P31_SHELF_MANIFEST.yaml" | grep -v "version:" || true)
  if [[ -n "$orphaned" ]]; then
    while IFS= read -r orphan; do
      line=$(echo "$orphan" | cut -d: -f1)
      audit_append "AUDIT-$(printf '%03d' $NEXT_ID)" high data-quality "Orphaned version value in shelf manifest" \
        "Line appears to be a version number without a 'version:' key prefix" \
        "$REPO_ROOT/P31_SHELF_MANIFEST.yaml:$line" "Add 'version:' prefix or remove orphaned line"
      NEXT_ID=$((NEXT_ID + 1))
    done <<< "$orphaned"
  fi
fi

echo ""
echo "══ Scan complete. Findings written to $AUDIT_MANIFEST ══"
