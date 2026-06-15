#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔨 Rebuilding PHOS with native Ollama proxy...${NC}"

cd "$(dirname "$0")/.."

echo -e "\n${YELLOW}📦 Building Rust backend...${NC}"
cd src-tauri
cargo build --quiet
cd ..

echo -e "\n${YELLOW}📦 Building frontend...${NC}"
pnpm build

echo -e "\n${YELLOW}🛑 Stopping any running PHOS instances...${NC}"
pkill -f 'target/debug/phos' 2>/dev/null || true

echo -e "\n${YELLOW}🚀 Starting PHOS (window will open)...${NC}"
pnpm tauri dev &
TAURI_PID=$!
sleep 8

echo -e "\n${GREEN}✅ PHOS is running with PID ${TAURI_PID}${NC}"
echo -e "   The window should appear. Type 'hello' in the chat."
echo -e "   If you see a response, the native Ollama proxy works.\n"

echo -e "${YELLOW}Press Ctrl+C to stop PHOS and exit this script.${NC}"
wait $TAURI_PID
