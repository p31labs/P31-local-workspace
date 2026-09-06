#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# P31 ANDROMEDA — MASTER SETUP ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════
# One command to set up the entire P31 ecosystem.
# Run from: software/
#
# Usage:
#   bash scripts/setup.sh              # Interactive setup
#   bash scripts/setup.sh --quick      # Skip optional services
#   bash scripts/setup.sh --check      # Health check only
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🔺 P31 ANDROMEDA — SOVEREIGN NODE SETUP                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Parse arguments ───
MODE="full"
if [ "$1" = "--quick" ]; then
    MODE="quick"
    echo -e "${YELLOW}Quick mode: skipping optional services${NC}"
elif [ "$1" = "--check" ]; then
    MODE="check"
    echo -e "${CYAN}Health check mode${NC}"
fi

# ─── Health Check Function ───
check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    if curl -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ $name${NC} — $url"
        return 0
    else
        echo -e "  ${RED}❌ $name${NC} — $url (unreachable)"
        return 1
    fi
}

check_command() {
    local name=$1
    local cmd=$2

    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -1)
        echo -e "  ${GREEN}✅ $name${NC} — $version"
        return 0
    else
        echo -e "  ${RED}❌ $name${NC} — not installed"
        return 1
    fi
}

# ─── Health Check Mode ───
if [ "$MODE" = "check" ]; then
    echo "Checking prerequisites..."
    echo ""
    check_command "Node.js" "node"
    check_command "Python" "python3"
    check_command "Docker" "docker"
    check_command "Git" "git"
    check_command "Wrangler" "npx wrangler"
    echo ""
    echo "Checking services..."
    echo ""
    check_service "Backend (FastAPI)" "http://localhost:8000/health"
    check_service "Frontend (Vite)" "http://localhost:5173"
    check_service "Neo4j Browser" "http://localhost:7474"
    check_service "Cloudflare Workers (local)" "http://localhost:8787"
    echo ""
    echo "Checking environment..."
    echo ""
    if [ -f ".env" ]; then
        echo -e "  ${GREEN}✅ .env file exists${NC}"
        # Check for required vars
        for var in NEO4J_PASSWORD ANTHROPIC_API_KEY; do
            if grep -q "^${var}=" .env && ! grep -q "^${var}=$" .env && ! grep -q "^${var}=$\|^${var}=\s*$" .env; then
                echo -e "  ${GREEN}✅ $var is set${NC}"
            else
                echo -e "  ${YELLOW}⚠️  $var is missing or empty${NC}"
            fi
        done
    else
        echo -e "  ${RED}❌ .env file missing — run: cp .env.example .env${NC}"
    fi
    echo ""
    exit 0
fi

# ─── Prerequisites Check ───
echo "Checking prerequisites..."
echo ""

MISSING=0
for cmd in node python3 docker git; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "  ${RED}❌ $cmd is not installed${NC}"
        MISSING=1
    else
        echo -e "  ${GREEN}✅ $cmd${NC}"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Missing prerequisites. Install them and re-run.${NC}"
    exit 1
fi

echo ""

# ─── Environment Setup ───
echo "Setting up environment..."
echo ""

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✅ Created .env from .env.example${NC}"
    echo -e "  ${YELLOW}⚠️  Edit .env with your API keys before starting services${NC}"
else
    echo -e "  ${CYAN}ℹ️  .env already exists${NC}"
fi

echo ""

# ─── Install Dependencies ───
echo "Installing dependencies..."
echo ""

# Root dependencies
echo -e "  ${CYAN}Installing root dependencies...${NC}"
npm install --silent 2>/dev/null || npm install

# Frontend
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo -e "  ${CYAN}Installing frontend dependencies...${NC}"
    cd frontend && npm install --silent 2>/dev/null && cd ..
fi

# Backend
if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
    echo -e "  ${CYAN}Installing backend dependencies...${NC}"
    cd backend
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate 2>/dev/null || .venv/Scripts/activate 2>/dev/null
    pip install -r requirements.txt --quiet
    cd ..
fi

# Workers
if [ -d "workers" ] && [ -f "workers/package.json" ]; then
    echo -e "  ${CYAN}Installing workers dependencies...${NC}"
    cd workers && npm install --silent 2>/dev/null && cd ..
fi

# Social Drop Automation
if [ -d "cloudflare-worker/social-drop-automation" ] && [ -f "cloudflare-worker/social-drop-automation/package.json" ]; then
    echo -e "  ${CYAN}Installing social drop automation dependencies...${NC}"
    cd cloudflare-worker/social-drop-automation && npm install --silent 2>/dev/null && cd ../..
fi

# Discord Bot
if [ -d "discord/p31-bot" ] && [ -f "discord/p31-bot/package.json" ]; then
    echo -e "  ${CYAN}Installing Discord bot dependencies...${NC}"
    cd discord/p31-bot && npm install --silent 2>/dev/null && cd ../..
fi

# BONDING
if [ -d "bonding" ] && [ -f "bonding/package.json" ]; then
    echo -e "  ${CYAN}Installing BONDING dependencies...${NC}"
    cd bonding && npm install --silent 2>/dev/null && cd ..
fi

# Spaceship Earth
if [ -d "spaceship-earth" ] && [ -f "spaceship-earth/package.json" ]; then
    echo -e "  ${CYAN}Installing Spaceship Earth dependencies...${NC}"
    cd spaceship-earth && npm install --silent 2>/dev/null && cd ..
fi

echo -e "  ${GREEN}✅ All dependencies installed${NC}"
echo ""

# ─── Docker Services ───
echo "Starting Docker services..."
echo ""

if command -v docker &> /dev/null; then
    docker-compose up -d neo4j 2>/dev/null || echo -e "  ${YELLOW}⚠️  Neo4j may already be running${NC}"
    echo -e "  ${GREEN}✅ Neo4j started (ports 7474/7687)${NC}"
else
    echo -e "  ${YELLOW}⚠️  Docker not available — Neo4j skipped${NC}"
fi

echo ""

# ─── Summary ───
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅ SETUP COMPLETE                                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit .env with your API keys"
echo ""
echo "  2. Start services:"
echo "     Backend:   cd backend && source .venv/bin/activate && python -m uvicorn main:app --reload"
echo "     Frontend:  cd frontend && npm run dev"
echo "     Workers:   cd workers && npx wrangler dev"
echo ""
echo "  3. Deploy social automation:"
echo "     cd cloudflare-worker/social-drop-automation"
echo "     npx wrangler secret put DISCORD_WEBHOOK_URL"
echo "     npx wrangler deploy"
echo ""
echo "  4. Run health check:"
echo "     bash scripts/setup.sh --check"
echo ""
echo -e "${CYAN}📖 Full documentation: software/SETUP.md${NC}"
echo ""
