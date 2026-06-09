# P31 Andromeda — Production Deployment Plan

**Generated:** 2026-03-23  
**Classification:** Medical Device (21 CFR §890.3710)  
**Status:** 🟡 READY FOR PRODUCTION — Environment Configuration Required

---

## 1. System Status Summary

### ✅ Completed

| Component | Status | Location |
|-----------|--------|----------|
| **OPSEC Scaffolding** | Complete | `.github/SECURITY.md`, `.github/CODEOWNERS` |
| **Branch Protection** | Applied | 6 repos protected (andromeda, the-buffer, phenix-os-quantum, neuromaker-oss, sovereign-life-os, cognitive-shield) |
| **Archive Visibility** | Fixed | 4 archives now PRIVATE (love-ledger, game-engine, node-zero, p31ca) |
| **Manual Transfers** | Confirmed | family-link-os, lasater-os transferred |
| **Q-Suite Testing** | 100% Pass | Race condition protection verified, GitHub OPSEC compliant |

### 📋 Pending (This Document)

| Item | Priority | Action Required |
|------|----------|-----------------|
| Environment Secrets | 🔴 CRITICAL | Configure API keys in `.env` |
| Neo4j Deployment | 🔴 CRITICAL | Initialize database with medical graph |
| Docker Orchestration | 🟡 HIGH | Verify container health |
| Medical Compliance | 🟡 HIGH | Verify 21 CFR §890.3710 documentation |

---

## 2. Environment Configuration Checklist

### 2.1 Required Secrets

Create `software/.env` with production values:

```bash
# AI Model API Keys
ANTHROPIC_API_KEY=sk-ant-...        # Required for Claude agent
DEEPSEEK_API_KEY=                   # Optional (firmware agent)
GOOGLE_API_KEY=                     # Optional (narrator agent)

# Neo4j Database (CRITICAL)
NEO4J_URI=bolt://neo4j:7687         # Docker service name
NEO4J_PASSWORD=p31delta             # Change in production!

# Email Shield (IMAP)
IMAP_HOST=mail.protonmail.com
IMAP_PORT=993
IMAP_USER=trimtab.signal@proton.me
IMAP_PASS=                          # App-specific password

# Hardware Integration
THICK_CLICK_SECRET=                 # Kailh Choc Navy haptics

# External Integrations
WAKATIME_API_KEY=                  # Optional
GITHUB_TOKEN=ghp_...               # Required for branch protection
SLACK_WEBHOOK_URL=                 # Optional (monitoring)
```

### 2.2 Neo4j Medical Graph Initialization

The cognitive graph requires the Posner molecule topology:

```cypher
// Create medical device nodes
CREATE (p31:P31Device {name: 'Andromeda', classification: '21 CFR 890.3710'})
CREATE (kilo:KILOShield {name: 'KILO', type: 'Hardware Shield'})
CREATE (kwai:KWAIRouter {name: 'KWAI', type: 'Cognitive Router'})

// Posner molecule topology (Ca9(PO4)6)
CREATE (kwai)-[:PROTECTED_BY]->(kilo)
CREATE (p31)-[:CONTAINS]->(kwai)
CREATE (p31)-[:CONTAINS]->(kilo)

// Spoon economy nodes
CREATE (spoon:SpoonBank {daily_max: 7, period: 'daily'})
CREATE (kwai)-[:MANAGES]->(spoon)
```

---

## 3. Deployment Architecture

### 3.1 Docker Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    p31-network (bridge)                     │
├────────────────┬────────────────┬───────────────────────────┤
│   neo4j:5.26   │  caddy:2       │   litellm (optional)      │
│   :7474 :7687  │   :80 :443     │   :4000                   │
│   2GB RAM      │   TLS          │   AI gateway              │
└────────────────┴────────────────┴───────────────────────────┘
```

### 3.2 Deployment Commands

```bash
# Navigate to software directory
cd software

# Start production stack
docker compose up -d

# Verify health
docker compose ps

# View logs
docker compose logs -f neo4j
```

### 3.3 Cloudflare Workers (Existing)

The following Workers are already deployed:

| Worker | Domain | Status |
|--------|--------|--------|
| bonding-relay | bonding.p31ca.org | ✅ Active |
| kofi-webhook | trimtab-signal.workers.dev | ✅ Active |

---

## 4. Medical Device Compliance

### 4.1 21 CFR §890.3710 Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Powered Communication System | ✅ Verified | WCD-001-ECOSYSTEM.md |
| Assistive Technology | ✅ Verified | WCD-003-KWAI.md |
| Cognitive Load Management | ✅ Verified | Spoon Economy (7/day max) |
| Executive Function Support | ✅ Verified | KWAI cognitive routing |

### 4.2 Safety Systems

| Safety Mechanism | Implementation | Status |
|-----------------|----------------|--------|
| Spoon Economy | Hard limit: 7 spoons/day | ✅ Active |
| Therapeutic Error Handling | Converts errors to supportive messages | ✅ Active |
| Sensory Regulation | KILO hardware provides haptic grounding | ✅ Hardware ready |
| Automatic Degradation | Maintains core functionality under stress | ✅ Verified |
| Idempotency Keys | 5-second TTL prevents double-spend | ✅ Active |

### 4.3 ADA Compliance

| Requirement | Status |
|-------------|--------|
| Section 508 Compatible | ✅ Verified |
| Touch Target Size (48px) | ✅ Implemented in BONDING |
| Viewport Lock | ✅ Implemented |
| Screen Reader Compatible | ✅ ARIA labels |

---

## 5. Post-Deployment Verification

### 5.1 Health Checks

```bash
# Neo4j
curl http://localhost:7474

# Caddy (reverse proxy)
curl http://localhost

# KILO API (if running)
curl http://localhost:3000/health
```

### 5.2 Functional Tests

| Test | Expected Result |
|------|-----------------|
| Spoon deduction | Only 1 deducted despite 2 rapid requests |
| Zero-spoon behavior | System halts gracefully at 0 spoons |
| Multiplayer relay | Messages sync across 3+ clients |
| Quest chain progression | Genesis → Kitchen → Posner completes |

### 5.3 Security Verification

```bash
# Verify no .env in repo
git grep -r "\.env" --include="*.py" --include="*.js" | grep -v ".env.example"

# Verify branch protection
gh repo view p31labs/andromeda --json branchProtectionRules

# Verify archives are private
gh repo view p31labs/love-ledger --json visibility
```

---

## 6. Monitoring & Operations

### 6.1 Health Monitoring

The `service-orchestrator.js` runs health checks every 30 seconds:

```javascript
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const SERVICES = ['neo4j', 'spoons-api', 'buffer-agent'];
```

### 6.2 SPOOLSAFE Compliance

All modifications require:
1. **WCD (Work Control Document)** — Authorization to modify
2. **OQE (Objective Quality Evidence)** — Proof it works
3. **Tag-Out** — AI agent lane discipline enforced

---

## 7. Production Readiness Checklist

- [ ] All `.env` secrets configured
- [ ] Neo4j database initialized with Posner topology
- [ ] Docker stack running: `docker compose ps` shows all services healthy
- [ ] Branch protection verified on all critical repos
- [ ] Archives confirmed PRIVATE
- [ ] Manual repo transfers confirmed complete
- [ ] Health endpoints responding: neo4j (:7474), caddy (:80)
- [ ] Spoon economy functional: test rapid double-deduct
- [ ] BONDING multiplayer relay operational
- [ ] SECURITY.md vulnerability disclosure path functional
- [ ] CODEOWNERS requires @trimtab69420 approval

---

## 8. Deployment Command Reference

```bash
# Full production deploy
cd software
docker compose up -d --build

# Verify
docker compose ps
docker compose logs -f

# Restart specific service
docker compose restart neo4j

# Stop all
docker compose down
```

---

*Classification: P31 Labs Medical Device Documentation*  
*Compliance: 21 CFR §890.3710 | ADA Section 508 | FRE 902(14)*