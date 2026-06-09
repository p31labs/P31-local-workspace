#!/usr/bin/env bash
# SpIn Mesh — Full Cycle Orchestration
# Starts Alice/Bob/Carol nodes, waits for L.O.V.E. mint, asserts success.

set -euo pipefail

DO_URL="${DO_URL:-http://localhost:8787}"
LOGISTICS_URL="${LOGISTICS_URL:-http://localhost:8788}"

echo "════════════════════════════════════════════════════════"
echo "  SpIn Mesh — Full Cycle Demo"
echo "  Matchmaking DO: $DO_URL"
echo "  Logistics DO  : $LOGISTICS_URL"
echo "════════════════════════════════════════════════════════"

# Clean previous runs
rm -f spin-*.db
mkdir -p logs

# Launch nodes with log files
echo "[1/4] Launching operator nodes..."
node demo/nodeA.mjs 2>&1 | tee logs/alice.log &
PID_A=$!
node demo/nodeB.mjs 2>&1 | tee logs/bob.log &
PID_B=$!
node demo/nodeC.mjs 2>&1 | tee logs/carol.log &
PID_C=$!

# Ensure cleanup on exit
cleanup() {
  kill $PID_A $PID_B $PID_C 2>/dev/null || true
  wait $PID_A $PID_B $PID_C 2>/dev/null || true
}
trap cleanup EXIT

# Wait for L.O.V.E. mint in any log (max 90s)
echo "[2/4] Waiting for L.O.V.E. mint (timeout 90s)..."
LOVE_FOUND=0
for i in $(seq 1 18); do
  if grep -q "\[L.O.V.E.\]" logs/*.log 2>/dev/null; then
    LOVE_FOUND=1
    echo "✅ L.O.V.E. mint detected!"
    break
  fi
  sleep 5
done

if [ $LOVE_FOUND -ne 1 ]; then
  echo "❌ Timeout: L.O.V.E. mint not seen in logs"
  echo "--- Recent Alice log ---"
  tail -n 10 logs/alice.log || true
  echo "--- Recent Bob log ---"
  tail -n 10 logs/bob.log || true
  echo "--- Recent Carol log ---"
  tail -n 10 logs/carol.log || true
  exit 1
fi

# Give nodes a moment to exit cleanly
sleep 2

echo "[3/4] Handover complete. Node exits:"
echo "  Alice  exit code: $(wait $PID_A; echo $?)"
echo "  Bob    exit code: $(wait $PID_B; echo $?)"
echo "  Carol  exit code: $(wait $PID_C; echo $?)"

echo "[4/4] Final log excerpts:"
for name in alice bob carol; do
  echo "--- $name ---"
  tail -n 5 "logs/$name.log" || true
done

echo "════════════════════════════════════════════════════════"
echo "  SUCCESS — SpIn Mesh MVP end-to-end verified"
echo "════════════════════════════════════════════════════════"
exit 0