#!/usr/bin/env bash
set -euo pipefail

# CS&S Fiscal Host Application Package Generator
# Compiles all required materials for the Code for Science & Society
# fiscal host application on Open Collective.
#
# Usage:
#   bash scripts/finance/cs-s-application.sh [--output-dir DIR]
#
# Outputs:
#   - Complete application package
#   - Narrative (from OPEN_COLLECTIVE.md)
#   - Project summary
#   - Submission checklist

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="${1:-$WORKSPACE_ROOT/docs/fiscal-host/cs-s-application-$(date +%Y%m%d)}"

log() {
  echo "[cs-s-application] $1"
}

mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/APPLICATION_PACKAGE.md" <<EOF
# Code for Science & Society — Fiscal Host Application Package

**Project:** P31 Labs  
**Collective URL:** opencollective.com/p31labs  
**Date Prepared:** $(date -Iseconds)

---

## 1. Project Summary

P31 Labs, Inc. is a Georgia nonprofit corporation (EIN 42-1888158, incorporated April 3, 2026) building open-source assistive technology for neurodivergent populations. We are seeking fiscal sponsorship from Code for Science & Society to unlock tax-deductible donations and grant eligibility while our 501(c)(3) application is pending.

---

## 2. Mission Narrative

> "P31 Labs builds open-source assistive technology for neurodivergent populations. Our flagship project, the Jitterbug Sierpinski Orchestrator, is a cognitive prosthetic that captures overwhelming complexity, breaks it into manageable pieces, and converges on reliable answers. We are a Georgia nonprofit with pending 501(c)(3) status (EIN 42-1888158), incorporated April 3, 2026. Our work aligns with CS&S's mission to make knowledge and knowledge production more accessible."

---

## 3. Alignment with CS&S Mission

| CS&S Priority | P31 Labs Match |
|---------------|----------------|
| Open source software | All projects AGPL-3.0, public repos |
| Open data / open science | Published research on Zenodo, open APIs |
| Public-interest technology | Assistive tech for neurodivergent users |
| Sustainable infrastructure | Cloudflare Workers, open standards |

---

## 4. Current Assets

- Live deployment: jitterbug-api.trimtab-signal.workers.dev
- Live deployment: jitterbug-pwa.pages.dev
- 501(c)(3) pending (EIN assigned: 42-1888158)
- Mercury bank account (corporate)
- 401 Powder Horn Road (registered principal office)
- Existing Open Collective profile (p31labs)
- Active developer community (GitHub, Discord)

---

## 5. Budget Snapshot

| Category | Amount |
|----------|--------|
| Cloud infrastructure (Workers, D1, R2, KV) | ~\$50/mo |
| Domain and services | ~\$30/mo |
| Development (uncompensated) | In-kind |
| Fiscal host fee (est.) | 5–10% of donations |

---

## 6. Contact

- **Organization:** P31 Labs, Inc.
- **EIN:** 42-1888158
- **Principal Officer:** William R. Johnson
- **Email:** [operator email]
- **Website:** https://p31ca.org

---

## 7. Submission Checklist

- [ ] Collective exists on Open Collective (p31labs)
- [ ] CS&S profile located in fiscal host search
- [ ] Narrative pasted into application form
- [ ] Project URL / repository linked
- [ ] Contact email confirmed
- [ ] Submitted and confirmation saved
EOF

cp "$WORKSPACE_ROOT/docs/OPEN_COLLECTIVE.md" "$OUTPUT_DIR/OPEN_COLLECTIVE_STRATEGY.md" 2>/dev/null || true

log "CS&S application package generated at: $OUTPUT_DIR"
log "Files:"
ls -1 "$OUTPUT_DIR"
