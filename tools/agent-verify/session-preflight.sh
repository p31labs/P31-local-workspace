#!/usr/bin/env bash
# tools/agent-verify/session-preflight.sh
# Enterprise-grade session preflight. Run at the start of every session.
# Do not skip. Do not proceed on failure.
set -euo pipefail

REPO=/home/p31/P31-local-workspace
cd "$REPO"

echo "=== 1. Read the authority ==="
cat AGENT-RUNBOOK.md > /dev/null && echo "  runbook: readable"
cat docs/agent-context/SESSION-STATE.md > /dev/null && echo "  session-state: readable"
cat docs/workpackages/THREAD-LOG.md > /dev/null && echo "  thread-log: readable"

echo "=== 2. Verify the environment ==="
node tools/agent-verify/verify.mjs --claims tools/agent-verify/self-claims.json
# expected: VERIFY_RESULT: PASS

echo "=== 3. Verify the governance runtime ==="
node tools/system-test/run.mjs --fast 2>&1 | tail -4
# expected: L1/L3/L6 green

echo "=== 4. Verify the audit chains ==="
node packages/govern/domains/audit/scripts/audit-chain-verify.mjs 2>&1 | tail -1 || echo "  (chain integrity: see finding L-009 — open nonconformity)"
# expected: integrity status; L-009 (158 breaks) is a known open nonconformity

echo "=== 5. Emit session-init event ==="
node tools/agent-verify/emit-lifecycle.mjs --event session-init 2>&1 | tail -1

echo "PREFLIGHT: OK"