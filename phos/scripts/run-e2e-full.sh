#!/bin/bash
# scripts/run-e2e-full.sh
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Running full PHOS E2E test suite...${NC}"

echo -e "\n${YELLOW}🔧 Running Rust backend tests...${NC}"
cd src-tauri
cargo test -- --nocapture
cd ..

echo -e "\n${YELLOW}🧪 Running frontend unit tests...${NC}"
pnpm test

echo -e "\n${YELLOW}🏗️  Building PHOS...${NC}"
pnpm build

echo -e "\n${YELLOW}🔍 Checking Ollama availability...${NC}"
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null; then
  echo -e "${RED}❌ Ollama not running. Start it with: ollama serve${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Ollama is running${NC}"

echo -e "\n${YELLOW}🚀 Launching PHOS for E2E tests...${NC}"
pnpm tauri dev &
TAURI_PID=$!
sleep 12

echo -e "\n${YELLOW}🌐 Running Playwright E2E tests...${NC}"
pnpm test:e2e

echo -e "\n${YELLOW}🧹 Stopping PHOS...${NC}"
kill $TAURI_PID 2>/dev/null || true

echo -e "\n${GREEN}✅ All tests passed!${NC}"
