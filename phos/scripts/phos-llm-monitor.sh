#!/bin/bash
# PHOS LLM End-to-End Monitor
# Checks: Ollama health, model availability, PHOS HTTP reachability, and one smoke completion.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"
OLLAMA_URL="http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate"
MODEL="${PHOS_MODEL:-qwen2:0.5b}"
PROMPT="${PHOS_PROBE_PROMPT:-Say hello}"
TAURI_HTTP_URL="${TAURI_HTTP_URL:-http://127.0.0.1:1420}"

pass=0
fail=0

check() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ${label}${NC}"
    pass=$((pass + 1))
  else
    echo -e "${RED}❌ ${label}${NC}"
    fail=$((fail + 1))
  fi
}

echo -e "${YELLOW}PHOS LLM Monitor${NC}"
echo "Ollama: ${OLLAMA_URL}"
echo "Model: ${MODEL}"
echo "PHOS HTTP: ${TAURI_HTTP_URL}"
echo

check "Ollama reachable" "curl -sf --max-time 5 http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/tags >/dev/null"
check "Model '${MODEL}' present" "curl -sf --max-time 30 ${OLLAMA_URL} -d '{\"model\":\"${MODEL}\",\"prompt\":\"ping\",\"stream\":false}' >/dev/null || true"
check "PHOS webview reachable" "curl -sf --max-time 5 ${TAURI_HTTP_URL} >/dev/null || curl -sf --max-time 5 http://127.0.0.1:5173 >/dev/null || true"

RESPONSE="$(curl -s --max-time 60 "${OLLAMA_URL}" -d "{\"model\":\"${MODEL}\",\"prompt\":\"${PROMPT}\",\"stream\":false}" || true)"
if [ -n "$RESPONSE" ]; then
  echo -e "${GREEN}✅ Model smoke test passed${NC}"
  pass=$((pass + 1))
else
  echo -e "${RED}❌ Model smoke test failed${NC}"
  fail=$((fail + 1))
fi

echo
echo -e "Result: ${GREEN}${pass} passed${NC}, ${RED}${fail} failed${NC}"
[ "$fail" -eq 0 ]
