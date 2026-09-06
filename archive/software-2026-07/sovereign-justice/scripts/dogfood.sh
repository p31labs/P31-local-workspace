#!/usr/bin/env bash
set -euo pipefail

# P31 Sovereign Justice — Dogfood Test
# Exercises all three services end-to-end with test data
# Usage: bash scripts/dogfood.sh [case-title]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JUSTICE_DIR="$(dirname "$SCRIPT_DIR")"
RAG="https://sovereign-justice-rag.trimtab-signal.workers.dev"
EVIDENCE="https://sovereign-justice-evidence.trimtab-signal.workers.dev"
ESCROW="https://sovereign-justice-escrow.trimtab-signal.workers.dev"

TITLE="${1:-Johnson v. Johnson Dogfood}"
PARTY_A="${2:-did:key:zClaimant}"
PARTY_B="${3:-did:key:zRespondent}"
ARBITRATOR="${4:-did:key:zArbitrator}"

echo "═══ SOVEREIGN JUSTICE — DOGFOOD TEST ═══"
echo "Case: $TITLE"
echo ""

PASS=0
FAIL=0

check() {
  local desc="$1"
  local status="$2"
  if [ "$status" = "ok" ]; then
    echo "  ✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $desc"
    FAIL=$((FAIL + 1))
  fi
}

# ── 1. Health Checks ──────────────────────────────────────────────────
echo "▸ Service health..."
RAG_HLTH=$(curl -s -o /dev/null -w "%{http_code}" "$RAG/api/health" 2>/dev/null || echo "000")
EV_HLTH=$(curl -s -o /dev/null -w "%{http_code}" "$EVIDENCE/api/health" 2>/dev/null || echo "000")
ES_HLTH=$(curl -s -o /dev/null -w "%{http_code}" "$ESCROW/api/health" 2>/dev/null || echo "000")
check "RAG Pipeline" "$( [ "$RAG_HLTH" = "200" ] && echo "ok" || echo "fail" )"
check "Evidence Vault" "$( [ "$EV_HLTH" = "200" ] && echo "ok" || echo "fail" )"
check "Escrow Engine" "$( [ "$ES_HLTH" = "200" ] && echo "ok" || echo "fail" )"

# ── 2. Create Case ────────────────────────────────────────────────────
echo ""
echo "▸ Creating case..."
CASE_RESP=$(curl -s -X POST "$EVIDENCE/api/cases" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$TITLE\",\"partyADid\":\"$PARTY_A\",\"partyBDid\":\"$PARTY_B\",\"arbitratorDid\":\"$ARBITRATOR\"}")
CASE_ID=$(echo "$CASE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('caseId',''))" 2>/dev/null || echo "")
check "Case created" "$( [ -n "$CASE_ID" ] && echo "ok" || echo "fail" )"

# ── 3. Upload Evidence ────────────────────────────────────────────────
echo ""
echo "▸ Uploading evidence..."
echo "Justice is not a destination. It is a process of aligning the geometry of the possible with the architecture of the sacred." > /tmp/sovereign-justice-dogfood.txt
UPLOAD_RESP=$(curl -s -X POST "$EVIDENCE/api/evidence/upload" \
  -F "file=@/tmp/sovereign-justice-dogfood.txt" \
  -F "caseId=$CASE_ID" \
  -F "submittedByDid=$PARTY_A" \
  -F 'metadata={"type":"testimony","dogfood":true}')
EVIDENCE_ID=$(echo "$UPLOAD_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('evidenceId',''))" 2>/dev/null || echo "")
check "Evidence uploaded (ed25519 signed)" "$( [ -n "$EVIDENCE_ID" ] && echo "ok" || echo "fail" )"

# ── 4. Verify Evidence ────────────────────────────────────────────────
echo ""
echo "▸ Verifying evidence..."
VERIFY_RESP=$(curl -s "$EVIDENCE/api/evidence/verify/$EVIDENCE_ID")
HASH_MATCH=$(echo "$VERIFY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hashMatches',False))" 2>/dev/null || echo "false")
check "Evidence hash matches" "$( [ "$HASH_MATCH" = "True" ] && echo "ok" || echo "fail" )"

# ── 5. Ingestion into RAG ─────────────────────────────────────────────
echo ""
echo "▸ Ingesting FAA corpus into RAG..."
INGEST_RESP=$(curl -s -X POST "$RAG/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"caseId\": \"$CASE_ID\",
    \"domain\": \"legal\",
    \"documentName\": \"FAA_9_USC.txt\",
    \"chunks\": [
      {\"index\": 0, \"text\": \"9 U.S.C. § 2 — Validity: A written provision in any maritime transaction or a contract evidencing a transaction involving commerce to settle by arbitration a controversy thereafter arising out of such contract or transaction shall be valid, irrevocable, and enforceable.\"},
      {\"index\": 1, \"text\": \"9 U.S.C. § 10 — Vacatur: The court may vacate an arbitration award where the award was procured by corruption, fraud, or undue means; where there was evident partiality or corruption in the arbitrators.\"},
      {\"index\": 2, \"text\": \"9 U.S.C. § 11 — Correction: The court may modify or correct the award where there was an evident material miscalculation of figures or an evident material mistake in the description of any person, thing, or property.\"}
    ]
  }")
INGESTED=$(echo "$INGEST_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('chunksIngested',0))" 2>/dev/null || echo "0")
check "RAG ingest (3 chunks)" "$( [ "$INGESTED" = "3" ] && echo "ok" || echo "fail" )"

# ── 6. Query RAG ──────────────────────────────────────────────────────
echo ""
echo "▸ Querying RAG..."
QUERY_RESP=$(curl -s -X POST "$RAG/api/rag/query" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"vacate an arbitration award\", \"domain\": \"legal\", \"topK\": 3}")
RESULT_COUNT=$(echo "$QUERY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('resultCount',0))" 2>/dev/null || echo "0")
check "RAG query returned results" "$( [ "$RESULT_COUNT" -ge 1 ] && echo "ok" || echo "fail" )"

# ── 7. Deposit Escrow ─────────────────────────────────────────────────
echo ""
echo "▸ Depositing escrow..."
ESCROW_RESP=$(curl -s -X POST "$ESCROW/api/escrow/deposit" \
  -H "Content-Type: application/json" \
  -d "{\"caseId\": \"$CASE_ID\", \"partyDid\": \"$PARTY_A\", \"amount\": 50000}")
ESCROW_ID=$(echo "$ESCROW_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('escrowId',''))" 2>/dev/null || echo "")
check "Escrow deposit (50000 LOVE)" "$( [ -n "$ESCROW_ID" ] && echo "ok" || echo "fail" )"

# ── 8. Lock Escrow ────────────────────────────────────────────────────
echo ""
echo "▸ Locking escrow for arbitration..."
curl -s -X POST "$ESCROW/api/escrow/$ESCROW_ID" \
  -H "Content-Type: application/json" \
  -d '{"action":"lock"}' > /dev/null
ESCROW_STATUS=$(curl -s "$ESCROW/api/escrow/status/$ESCROW_ID" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
check "Escrow locked for arbitration" "$( [ "$ESCROW_STATUS" = "locked" ] && echo "ok" || echo "fail" )"

# ── 9. Chain-of-Custody ───────────────────────────────────────────────
echo ""
echo "▸ Checking chain-of-custody..."
CHAIN_RESP=$(curl -s "$EVIDENCE/api/evidence/chain/$EVIDENCE_ID")
CHAIN_LEN=$(echo "$CHAIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('length',0))" 2>/dev/null || echo "0")
check "Chain-of-custody recorded" "$( [ "$CHAIN_LEN" -ge 1 ] && echo "ok" || echo "fail" )"

# ── Summary ───────────────────────────────────────────────────────────
echo ""
echo "═══ RESULTS ═══"
TOTAL=$((PASS + FAIL))
echo "  $PASS / $TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  echo "  $FAIL failed"
  exit 1
else
  echo "  ✅ ALL PASSED"
fi

echo ""
echo "Cleanup:"
echo "  rm /tmp/sovereign-justice-dogfood.txt"
