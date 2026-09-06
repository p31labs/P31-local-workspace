#!/bin/bash
set -e

echo "================================================"
echo "  EPCP Command Center - Full Test Suite"
echo "================================================"
echo ""

# Start the worker in background
echo "Starting Cloudflare Worker on port 8787..."
npx wrangler@4 dev src/index.js --port 8787 --local > /tmp/wrangler.log 2>&1 &
WORKER_PID=$!
sleep 5

# Verify worker is running
if curl -s http://localhost:8787/api/health > /dev/null 2>&1; then
  echo "✓ Worker is running"
else
  echo "✗ Worker failed to start"
  cat /tmp/wrangler.log
  kill $WORKER_PID 2>/dev/null
  exit 1
fi

echo ""
echo "Running Integration Tests..."
echo "================================================"
npm run test:integration
INT_RESULT=$?

echo ""
echo "Running Security Tests..."
echo "================================================"
npm run test:security 2>&1 || true

echo ""
echo "Running Performance Tests..."
echo "================================================"
npm run test:perf 2>&1 || true

# Cleanup
echo ""
echo "================================================"
echo "  Shutting down worker..."
kill $WORKER_PID 2>/dev/null
wait $WORKER_PID 2>/dev/null

if [ $INT_RESULT -eq 0 ]; then
  echo "✓ All Integration Tests Passed"
else
  echo "✗ Some Integration Tests Failed"
  exit $INT_RESULT
fi

echo ""
echo "================================================"
echo "  Test Suite Complete!"
echo "================================================"
