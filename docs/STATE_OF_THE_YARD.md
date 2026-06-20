# STATE OF THE YARD — P31 Labs Operational Audit

## Status: GREEN (all systems nominal)

### Core Services
| Service | Endpoint | Status |
|---------|----------|--------|
| PHOS | phos.p31ca.org | GREEN (Astro+React+PGlite, spoon-aware UI, PWA) |
| BONDING | bonding.p31ca.org | GREEN (424 tests / 32 suites) |
| p31ca.org | p31ca.org | GREEN (technical hub, dark-warm redesign deployed) |
| phosphorus31.org | phosphorus31.org | GREEN (institutional research site) |
| K4 Cage | k4-cage.trimtab-signal.workers.dev | GREEN (complete graph tetrahedron endpoint) |
| Command Center | command-center.trimtab-signal.workers.dev | GREEN (KV-backed dashboard with */5 health pinger) |
| Hearing Ops PWA | ops.p31ca.org | GREEN (offline contempt prep) |

### Fleet Management
- 15 Cloudflare endpoints deployed across 4 domains
- 5 family tetrahedron workers running (can be decommissioned after K4 Cage verification)
- Carrier agent running: 5-tab mobile operator hub
- P31-Mesh: WebRTC P2P vagal sync (p31-mesh.pages.dev)
- P31-Vault: interactive component gallery (p31-vault.pages.dev)
- All 21 infrastructure endpoints nominal

### Yardmaster (Continuous Shipyard Protocol)
- Yardmaster v0.1.0 deployed at `scripts/p31-yardmaster.sh`
- All 11 registered services responding to inspection
- Inspection cycle: every 6h via cron
- Maintenance window: Fridays 02:00 UTC
- Fuel budget: Track B OPEN — refit cycles authorized

### Audit Pipeline
- `scripts/p31-audit-scan.sh` — Quick-scan grep (6 checks)
- `scripts/p31-core-audit.py` — Deep vocabulary/structural audit (7 systems)
- `scripts/quality-gate.sh` — Pre-commit quality gate (6 checks)
- `scripts/P31-CANARY.sh` — Re-entry gate (operator grounding check)
- All audit findings write to `~/.p31/audit/P31_AUDIT_MANIFEST.yaml`

### P31-FLOTILLA (LLM Agent Fleet)
- 6 files deployed: manifest, router, health, discovery, docs
- Router at `scripts/p31-model-router.py`
- Health check at `scripts/p31-model-health.sh`
- Discovery at `scripts/p31-model-discovery.sh`
- Living manifest at `P31_LLM_MANIFEST.yaml`

### Legal & Corporate
- **501(c)(3): DETERMINED** (May 4, 2026)
- **EIN: 42-1888158** (P31 Labs, Inc.)
- **Mercury bank: In review** (~1 day to approval)
- **GA SoS Expedite:** Filed ($120, 2 business days)
- **Hearing:** April 16, 2026 @ 11:00 AM, Woodbine

### Research Pipeline
- Papers I-IV: Published with DOIs
- Paper XII (Sovereign Stack): 11pp, triple-gated, Zenodo-ready
- Paper XI (L.O.V.E. Protocol): 6pp, 4 corrections applied, needs XII DOI
- Paper XIX (SOULSAFE): 6pp, needs XII DOI
- Papers V-X, XIV-XVII: Expanded and styled as PDFs
- Papers XIII, XVIII, XX: HELD (legally risky)

### Grant Pipeline
- Awesome Foundation: $1K, under review
- Gates Grand Challenges AI: $150K, deadline April 28
- NLnet NGI Zero Commons: €5K-€50K, deadline June 1
- ASAN Teighlor McGee: $6,250, opens May 15

### Known Issues
1. AGENTS.md lives at `admin/AGENTS.md` not workspace root — quality-gate.sh check #5 will fail
2. P31-FUEL-BUDGET.yaml line 34 contains legacy term "reactor_temp" — vocab audit pending
3. Stale temp files in workspace root (P31_SHELF_MANIFEST.yaml.tmp*)
4. EIN migration (42-1888158) in progress — 40+ files pending
5. 501(c)(3) pending reference may still exist in old docs — sweep ongoing

*Ca₉(PO₄)₆*
