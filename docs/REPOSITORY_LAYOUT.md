# Repository Layout

Canonical map of the `P31_Andromeda` monorepo. Generated from live filesystem state; update when packages are added or moved.

## Top Level

```
P31_Andromeda/
├── admin/                        # Operator docs, WCDs, maturity model, corporate filings
├── apps/                         # Standalone apps (willow, phos-desktop, phos-mobile, spaceship-earth)
├── cli/                          # Shared CLI tooling and deployment helpers
├── cognitive-prosthetic/         # Cognitive prosthetic product lineage docs/licenses
├── contracts/                    # Contract templates and legal instruments
├── cwp-2026-002-p31-ecosystem-alignment/
├── cwp-2026-003-p31-jitterbug/
├── docs/                         # Public-facing documentation, grants, launch materials
├── ecosystem/                    # Discord, analytics, middleware, IPFS bridges
├── firmware/                     # ESP32 / Node Zero firmware (ESP-IDF, LVGL, Meshtastic)
├── governance/                   # Governance contracts and DAO/DNA structures
├── infrastructure/               # Terraform / Pulumi / cloud infra configs
├── interfaces/                   # Shared interface contracts
├── legal-instruments/            # Additional legal filings and IP assignments
├── logs/                         # Operational logs
├── migrations/                   # Jitterbug D1 migrations (001-003)
├── node-one-firmware/            # Node One firmware variant
├── p31-surrogate-backend/        # Surrogate backend (ingestion, learning, PEFT, shield)
├── p31labs/                      # Legacy P31 Labs standalone modules
├── packages/                     # Core shared packages (p31-core, sovereign-core, ui-facets, vscode-extension)
├── phos/                         # Phosphorus31 site (Astro)
├── plans/                        # Strategic plans and roadmaps
├── prompts/                      # Agent prompts and LLM context
├── scripts/                      # Repo-level scripts (grader, deploy, yardmaster, forge)
├── software/                     # PRIMARY SOFTWARE TREE (see below)
├── README.md
├── CLAUDE.md                     # Operator system prompt and verified facts
├── SECURITY.md
├── CONTRIBUTING.md
└── RUNBOOK.md
```

## `software/` — Primary Software Tree

```
software/
├── agents/                       # Agent topology and routing logic
├── backend/                      # Backend services and tests
├── bonding/                      # BONDING chemistry game (Vite + React + R3F + Vitest)
├── cloudflare-pages/             # Cloudflare Pages projects (p31-mesh, p31-vault)
├── cloudflare-worker/            # Cloudflare Workers (command-center, bouncer, social-drop, q-factor, fhir)
│   ├── command-center/           # Fleet health + FHIR calcium check
│   ├── bouncer/
│   ├── q-factor/
│   ├── social-drop-automation/
│   └── scripts/
├── config/                       # Shared configuration
├── continue-p31/                 # Continue.dev P31 config
├── design-tokens/                # Design system tokens
├── discord/                      # Discord bot (p31-bot)
├── docs/                         # Engineering docs, ADRs
├── donate-api/                    # Donate API (Stripe/Ko-fi webhook)
├── extensions/                   # Browser / VS Code extensions
├── firmware/                     # Embedded firmware helpers
├── frontend/                     # Legacy frontend shell
├── genesis-gate/                 # Genesis Gate worker
├── geodesic-room/                # Geodesic Room (Durable Objects)
├── hearing-ops/                  # Hearing Ops PWA (ops.p31ca.org)
├── integration-handoff/           # CWP integration packages (CWP-30/31/32)
├── k4-cage/                      # K₄ Cage Worker (unified mesh)
├── k4-hubs/                      # K₄ Hubs (hub-fusion, router, auth)
├── k4-personal/                  # K₄ Personal Worker
├── kenosis-mesh/                 # Kenosis Mesh (logistics / matchmaking DOs)
├── kilo-node/                    # Kilo Node entrypoint
├── matrix/                       # Matrix bridge (bridges, config, scripts)
├── monitoring/                   # Monitoring and observability
├── ops/                          # Operations tooling
├── p31-agent-hub/                # Agent Hub (discovery + routing)
├── p31-cortex/                   # Cortex Orchestrator (Python + DOs)
├── p31-dashboard/                 # Dashboard (Astro)
├── p31-delta-hiring/             # Delta Hiring static app
├── p31-forge/                    # P31 Forge (document generation engine)
├── p31-google-bridge/            # Google Bridge (OAuth + Sheets/Drive)
├── p31-hearing-ops/              # Hearing Ops (Vite PWA)
├── p31-state/                    # State management utilities
├── packages/                     # WORKSPACE PACKAGES (see below)
├── p31ca/                        # p31ca.org (Astro + React + PGlite, arcade, PHOS v2)
├── spin-mesh/                    # Spin Mesh (matchmaking / logistics DOs)
├── telemetry-worker/             # Telemetry Worker
├── workers/                      # Shared Workers (orchestrator, event bus)
└── .github/workflows/            # CI/CD for software subtree
```

### `software/packages/` — Workspace Packages

```
software/packages/
├── agent-engine/                 # Agent runtime and execution
├── brain-dump-orchestrator/      # Jitterbug brain-dump orchestrator (CLI + recursive decomposition)
├── game-engine/                  # Game engine abstraction
├── harmonic-linter/              # Linting / code quality rules
├── jitterbug-api/                # Jitterbug API Worker (Cloudflare Workers + D1 + KV + R2 + DO)
├── jitterbug-pwa/                # Jitterbug PWA (Vite + React + Tailwind CSS v4 + PWA)
├── k4-mesh-core/                 # K₄ mesh core types and tests
├── love-ledger/                  # LOVE Ledger (sovereign accounting)
├── node-zero/                    # Node Zero (PWA shell)
├── oracle-terminal/              # Oracle Terminal
├── q-distribution/               # Q Distribution (quantum utility)
├── quantum-edge/                 # Quantum Edge runtime
├── shared/                       # Shared P31 utilities (trust, sovereign, hibernation, health)
└── sovereign-sdk/                # Sovereign SDK (legacy)
```

## Key Paths

| Purpose | Path |
|---------|------|
| Maturity model / baseline | `admin/P31_MATURITY_MODEL.md` |
| Grader + maturity gate | `scripts/grade-repo.py`, `scripts/check-maturity-gate.py` |
| Grading output | `grading-index.json`, `GRADING_REPORT.md` |
| Jitterbug migrations | `migrations/001_initial.sql`, `002_add_recursive_fields.sql`, `003_add_ephemeralization.sql` |
| Jitterbug deploy script | `software/scripts/deploy-jitterbug.sh` |
| R2 lifecycle setup | `software/scripts/setup-r2-lifecycle.sh` |
| Jitterbug API Worker | `software/packages/jitterbug-api/` |
| Jitterbug PWA | `software/packages/jitterbug-pwa/` |
| Kill switch | `software/packages/jitterbug-pwa/public/kill.html` |
| Giscus helper | `software/packages/jitterbug-pwa/public/giscus-setup.html` |
| Convergence CI | `.github/workflows/convergence.yml` |
| Macrophage scan | `.github/workflows/macrophage-scan.yml` |
| Repo docs index | `docs/` (this file is the canonical map) |

## Notes

- `docs/REPOSITORY_LAYOUT.md` is the canonical map. If a path is not listed here, it is not part of the primary software tree.
- `software/` is the primary software tree. Top-level `scripts/` contains repo-level tooling (grader, deploy, yardmaster).
- Jitterbug subsystem lives under `software/packages/jitterbug-*` and `migrations/`.
- All Cloudflare Workers deploy via `wrangler.toml` in their respective package directories.
- Tests use Vitest unless otherwise noted. Run `pnpm test` from repo root for turbo-filtered runs.
