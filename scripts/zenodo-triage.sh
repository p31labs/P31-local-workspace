#!/usr/bin/env bash
# zenodo-triage.sh — Automate Zenodo embargo + Paper XII update
# Usage: ZENODO_TOKEN="..." bash scripts/zenodo-triage.sh
set -euo pipefail

TOKEN="${ZENODO_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "ERROR: Set ZENODO_TOKEN env var"
  echo "Generate one at: https://zenodo.org/account/settings/applications/" >&2
  exit 1
fi

API="https://zenodo.org/api"
PAPER_XII_PDF="${1:-/tmp/P31_Paper_XII_Sovereign_Stack.pdf}"

embargo_record() {
  local doi="$1" label="$2"
  local recid="${doi##*.}"
  echo "=== Embargoing $label ($recid) ==="

  # Edit published record
  resp=$(curl -s -X POST "$API/deposit/depositions/$recid/actions/edit" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  dep_id=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
  if [ -z "$dep_id" ] || [ "$dep_id" = "None" ]; then
    echo "  FAILED to edit: $(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('message','?'))" 2>/dev/null)"
    return 1
  fi
  echo "  Edit OK (deposition $dep_id)"

  # Set access_right to restricted
  curl -s -X PUT "$API/deposit/depositions/$dep_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"metadata": {"access_right": "restricted"}}' > /dev/null

  # Publish change
  pub=$(curl -s -X POST "$API/deposit/depositions/$dep_id/actions/publish" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  pub_status=$(echo "$pub" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null)
  echo "  Published: $pub_status"
}

update_paper_xii() {
  local pdf="$1"
  if [ ! -f "$pdf" ]; then
    echo "  SKIP: $pdf not found. Upload Paper XII v2 manually."
    return 1
  fi

  echo "=== Updating Paper XII ==="
  # Create new version from concept
  concept_recid="19782968"
  resp=$(curl -s -X POST "$API/deposit/depositions/$concept_recid/actions/newversion" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  dep_id=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
  if [ -z "$dep_id" ] || [ "$dep_id" = "None" ]; then
    echo "  FAILED: $(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('message','?'))" 2>/dev/null)"
    return 1
  fi
  echo "  New version draft created ($dep_id)"

  # Update metadata with corrected description
  curl -s -X PUT "$API/deposit/depositions/$dep_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"metadata": {"description": "Paper XII of the P31 Labs Research Series. Documents the complete hardware-software architecture of the P31 ecosystem, including the Node Zero cognitive prosthetic (ESP32-S3, AXS15231B, SE050), the BONDING educational chemistry game (95 passing automated tests), and the Cloudflare Workers infrastructure (8+ active Workers from a deployed fleet of 33). Triple-gated for factual accuracy."}}' > /dev/null
  echo "  Metadata updated"

  # Remove old file, upload new
  bucket_url=$(curl -s "$API/deposit/depositions/$dep_id" \
    -H "Authorization: Bearer $TOKEN" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('links',{}).get('bucket',''))" 2>/dev/null)
  if [ -n "$bucket_url" ]; then
    curl -s -o /dev/null -X POST "$bucket_url/P31_Paper_XII_Sovereign_Stack.pdf" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@$pdf"
    echo "  File uploaded"
  fi

  # Publish
  pub=$(curl -s -X POST "$API/deposit/depositions/$dep_id/actions/publish" \
    -H "Authorization: Bearer $TOKEN" 2>&1)
  echo "  Published: $(echo "$pub" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null)"
}

echo "═══════════════════════════════════════"
echo "  P31 Zenodo Triage — $(date -u +%FT%TZ)"
echo "═══════════════════════════════════════"
echo ""

embargo_record "10.5281/zenodo.19782989" "Paper XIII" || true
echo ""
embargo_record "10.5281/zenodo.19782999" "Paper XVIII" || true
echo ""
embargo_record "10.5281/zenodo.19783001" "Paper XX" || true
echo ""
update_paper_xii "$PAPER_XII_PDF" || true

echo ""
echo "=== Done ==="
echo "Verify at: https://zenodo.org/search?q=creators.name:%22Johnson%2C%20William%20R.%22"
