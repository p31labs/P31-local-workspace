#!/usr/bin/env bash
set -euo pipefail

# Georgia Annual Registration Filing Package Generator
# Prepares all documents, data, and a submission checklist for the
# Georgia Secretary of State Annual Registration (deadline July 2, 2026).
#
# Usage:
#   bash scripts/finance/ga-annual-registration.sh [--output-dir DIR]
#
# Outputs:
#   - Filing package with verified entity data
#   - Submission checklist
#   - Confirmation receipt template

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="${1:-$WORKSPACE_ROOT/docs/launch/filing-packages/ga-annual-$(date +%Y%m%d)}"

log() {
  echo "[ga-annual-registration] $1"
}

mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/SUBMISSION_CHECKLIST.md" <<'EOF'
# Georgia Annual Registration — Submission Checklist

**Entity:** P31 Labs, Inc.  
**EIN:** 42-1888158  
**Deadline:** July 2, 2026  
**Portal:** https://sos.ga.gov/index.php/corporations/annual_registration

---

## Pre-Flight Verification

- [ ] Entity name and number confirmed on SOS portal
- [ ] Three directors verified: William R. Johnson, Brenda O'Dell, Joseph Tyler Cisco
- [ ] Principal office address confirmed (401 Powder Horn Road)
- [ ] Registered agent info current
- [ ] Payment method ready (corporate Mercury debit card)

## Data to Enter

| Field | Value |
|-------|-------|
| Entity Name | P31 Labs, Inc. |
| Entity Type | Nonprofit Corporation |
| Principal Office Address | 401 Powder Horn Road, [City, GA, ZIP] |
| Registered Agent | [Name or registered agent service] |
| Registered Agent Address | [Address] |
| Director 1 | William R. Johnson |
| Director 2 | Brenda O'Dell |
| Director 3 | Joseph Tyler Cisco |

## Submission Steps

1. Go to https://sos.ga.gov/index.php/corporations/annual_registration
2. Log in or create an account
3. Search for "P31 Labs, Inc."
4. Select the entity and click "File Annual Registration"
5. Verify all pre-filled data matches the table above
6. Pay the $100 fee with corporate Mercury card
7. Download and save the confirmation receipt to this directory

## Post-Submission

- [ ] Confirmation number recorded below
- [ ] Receipt saved to Go binder / legal docs folder
- [ ] Email confirmation saved
- [ ] Status verified on SOS portal (updates within 24 hours)

## Confirmation Details

- **Confirmation Number:** _______________
- **Submission Date:** _______________
- **Fee Paid:** $100
- **Payment Method:** _______________
- **Next Annual Registration Due:** _______________
EOF

cat > "$OUTPUT_DIR/FILING_SUMMARY.txt" <<EOF
Georgia Annual Registration Filing Summary
==========================================
Entity:     P31 Labs, Inc.
EIN:        42-1888158
Filing:     Annual Registration (Form C-100)
Fee:        \$100 (online)
Deadline:   July 2, 2026
Portal:     https://sos.ga.gov/index.php/corporations/annual_registration

Directors:
  1. William R. Johnson
  2. Brenda O'Dell
  3. Joseph Tyler Cisco

Principal Office: 401 Powder Horn Road

Auto-generated: $(date -Iseconds)
EOF

cat > "$OUTPUT_DIR/CONFIRMATION_RECEIPT_TEMPLATE.txt" <<'EOF'
GEORGIA SECRETARY OF STATE — ANNUAL REGISTRATION RECEIPT
=========================================================

Entity Name:    P31 Labs, Inc.
Confirmation #: ___________________
Date Filed:     ___________________
Fee Paid:       $100

Keep this receipt with your corporate records.
Required for 501(c)(3) application and grant filings.
EOF

log "Filing package generated at: $OUTPUT_DIR"
log "Files:"
ls -1 "$OUTPUT_DIR"
