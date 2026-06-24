#!/usr/bin/env bash
set -euo pipefail

# Mortgage Forbearance Call Preparation Script
# Generates the call script, document checklist, and call log for the
# mortgage servicer loss mitigation package call (deadline June 30, 2026).
#
# Usage:
#   bash scripts/finance/mortgage-forbearance.sh [--output-dir DIR]
#
# Outputs:
#   - Call script (exact wording)
#   - Document checklist
#   - Call log template
#   - Follow-up tracker

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="${1:-$WORKSPACE_ROOT/docs/launch/filing-packages/mortgage-$(date +%Y%m%d)}"

log() {
  echo "[mortgage-forbearance] $1"
}

mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/CALL_SCRIPT.txt" <<'EOF'
MORTGAGE SERVICER CALL SCRIPT
==============================
Deadline: June 30, 2026
Property: 401 Powder Horn Road (corporate HQ of P31 Labs, Inc.)

---

OPENING:
"Hello, my name is [YOUR NAME]. I am calling about the mortgage on 401 Powder Horn Road, account number [LAST 4 DIGITS]. I am initiating a loss mitigation package to assume this mortgage."

---

KEY STATEMENT (say verbatim):
"My FERS Disability Retirement stream (SF-3112) is currently processing before the OPM. I need the specific paperwork to formally request an extension of the forbearance until that federal stream is activated."

---

IF THEY SAY YES / WILL SEND PAPERWORK:
"Thank you. Please send the paperwork to [EMAIL/MAILING ADDRESS]. What is the timeline for receiving the forms?"

IF THEY SAY NO OR DELAY:
"I understand. Can you escalate this to a supervisor? The pending FERS stream is a federally protected income source, and I want to ensure we document this request properly."

---

CLOSING:
"Thank you for your help. Can you confirm your name and the reference number for this call?"
EOF

cat > "$OUTPUT_DIR/DOCUMENT_CHECKLIST.md" <<'EOF'
# Mortgage Forbearance — Document Checklist

**Property:** 401 Powder Horn Road  
**Deadline:** June 30, 2026  
**Purpose:** Loss mitigation / forbearance extension pending FERS Disability Retirement activation

---

## Required Documents

- [ ] FERS Disability Retirement filing confirmation (SF-3112 package)
- [ ] P31 Labs, Inc. Articles of Incorporation (showing 401 Powder Horn Rd as principal office)
- [ ] Mercury bank account statement (showing corporate treasury)
- [ ] CS&S Fiscal Host application confirmation (shows institutional backing)
- [ ] Previous forbearance agreement (if any)

## Have Ready During Call

- [ ] Mortgage account number (last 4 digits at minimum)
- [ ] Property address: 401 Powder Horn Road, [City, GA]
- [ ] Your full legal name
- [ ] Phone number and email for follow-up
- [ ] P31 Labs, Inc. EIN: 42-1888158

## Call Log Template

| Field | Value |
|-------|-------|
| Date | |
| Time | |
| Servicer | |
| Rep Name | |
| Reference # | |
| Outcome | |
| Next Steps | |
| Follow-up Date | |
EOF

cat > "$OUTPUT_DIR/CALL_LOG.txt" <<'EOF'
MORTGAGE FORBIDANCE CALL LOG
=============================
Property: 401 Powder Horn Road
Entity: P31 Labs, Inc.

Date: ___________
Time: ___________
Servicer: ___________
Representative: ___________
Reference/Case #: ___________

Outcome:
[ ] Paperwork will be sent
[ ] Supervisor escalation requested
[ ] Application for loss mitigation started
[ ] Other: ___________

Next Steps:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Follow-up Date: ___________
Follow-up Method: [ ] Phone [ ] Email [ ] Mail
EOF

log "Mortgage forbearance package generated at: $OUTPUT_DIR"
log "Files:"
ls -1 "$OUTPUT_DIR"
