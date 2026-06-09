# P31 EDE — Convergence Merge Guide

**Last updated:** March 3, 2026
**Status:** Phase 1 complete. Phase 2 staged (post March 10).

---

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| **Phase 1** | Opus + Gemini EDE convergence | ✅ Complete — Feb 24, 2026 |
| **Phase 2** | BONDING → Spaceship Earth module merge | ⏳ Staged — begins March 10 |

---

## Phase 1 — EDE Convergence (COMPLETE)

### Build Summary

**76 files | 4,951 lines | All 9 sections complete**

Produced by: Claude Opus (Integrator node)
Inputs: CONVERGENCE_PROMPT.md, GEMINI.txt, Note_1.txt
DeepSeek output: Never arrived — firmware/tests/devcontainer scaffolded from canonical spec

### Phase 1 Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| Port Consistency | ✅ PASS | All 7 canonical ports verified across all files |
| CRC8 Consistency | ✅ PASS | 0x24 verified by C compilation, TS+C+test aligned |
| Docker Compose | ✅ PASS | All images valid, ports unique, env vars defined |
| GitHub Actions | ✅ PASS | All actions at current versions (v4/v5) |
| DevContainer | ✅ PASS | Correct compose refs, ports, extension IDs |
| Import Resolution | ✅ RESOLVED | `backend/__init__.py` exists — relative imports work |

### Phase 1 Known Issues — Status

| # | Issue | Status |
|---|-------|--------|
| 1 | LICENSE abbreviated — needs full AGPL-3.0 text | ✅ RESOLVED — full text present |
| 2 | `backend/context.py` relative import needs `__init__.py` | ✅ RESOLVED — `__init__.py` exists |
| 3 | Astro Starlight `^0.30.0` — exact version unverified | ⏳ Post-birthday |
| 4 | `frontend/Dockerfile` inline Caddyfile heredoc may need adjustment | ⏳ Post-birthday |
| 5 | Spoon gauge extension does not communicate with backend | ⏳ Post-birthday (WebSocket bridge planned) |
| 6 | Progressive disclosure zen mode toggle needs VS Code API testing | ⏳ Post-birthday |

### File Ownership (Phase 1 Merge — Recorded)

**Opus version used for:**
- `docker-compose.yml`, `docker-compose.dev.yml`, `Caddyfile`
- `justfile`, `.env.example`, `.gitignore`
- `.github/*` (CI, templates, funding, codeowners)
- `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`
- `.vscode/*`
- `backend/buffer_agent.py`
- `frontend/src/App.jsx`
- `config/taxonomy.json`, `config/graph_schema.json`

**Gemini version used for:**
- `backend/router.py` (semantic router)
- `backend/context.py` (context enrichment — wired but not integrated into `/chat`)
- `backend/graph_loader.py` (Neo4j loader)
- `.continue/config.yaml`
- `extensions/*` (all 4 VS Code extensions)
- `docs/*` (Astro Starlight)
- `frontend/src/hooks/useThickClick.ts`

**DeepSeek scaffolded (Opus stand-in — replace when available):**
- `firmware/src/main.cpp`
- `firmware/include/protocol.h`
- `firmware/platformio.ini`
- `frontend/src/lib/serial.ts`
- `frontend/src/__tests__/*`
- `backend/tests/*`
- `.devcontainer/*`
- `backend/Dockerfile`, `frontend/Dockerfile`

### CRC8-MAXIM Canonical Value

**Input:** `[0x31, 0x01, 0x00]` (magic + heartbeat + zero-length)
**Polynomial:** `0x31`, **Init:** `0xFF`, **MSB-first, no reflection**
**Result:** `0x24` — verified by compiled C, used in TS tests and C header

---

## Phase 2 — BONDING → Spaceship Earth (STAGED)

**Trigger:** March 10, 2026 — after birthday ship
**Architect:** Opus (WCD authoring + risk audit)
**Mechanic:** Sonnet (execution)

### What's Merging

BONDING becomes a **module** inside Spaceship Earth. Not a route swap — a genuine integration where the molecule builder becomes one room in The Soup.

| BONDING System | Spaceship Earth Integration |
|----------------|----------------------------|
| `MoleculeCanvas.tsx` | Embedded R3F scene within a Soup "room" node |
| `ElementPalette.tsx` | Sidebar panel in Cockpit HUD |
| `gameStore.ts` (Zustand) | Zustand store composition — merge into Spaceship store or use Zustand slice pattern |
| `genesis/eventBus.ts` | Promote to shared event bus for all Spaceship Earth events |
| `genesis/economyStore.ts` | LOVE tokens feed into the main cognitive economy |
| `genesis/telemetryStore.ts` | Merge telemetry streams — BONDING + Buffer Agent sessions unified |
| `engine/chemistry.ts` | Standalone module — import directly into Spaceship Earth |
| `engine/sound.ts` | Merge into Spaceship Earth audio engine (element notes + breathing pacer) |
| `data/elements.ts` | Promote to shared constants — used by both molecule b

uilder and geodesic dome coloring |
| `Jitterbug.tsx` | Already lives in `Navigation/` — add BONDING node to the tetrahedron |

### Architecture Decisions for Phase 2

**The Soup is the container.** Molecules drift in spatial chat. Messages orbit molecules. BONDING sessions become rooms. The geodesic dome nodes become portals to Soup rooms.

**No hard fork.** `software/bonding/` stays intact as the standalone game. Spaceship Earth imports from it as a package or via direct file copy. We do not delete the standalone — it remains deployable to bonding.p31ca.org.

**Genesis Block promotes.** The eventBus becomes the system-wide pub/sub. ATOM_PLACED, MOLECULE_COMPLETED, PING_SENT — all now first-class Spaceship Earth events that can update the knowledge graph, increment the LOVE ledger, and trigger dome node animations.

**Jitterbug gets a BONDING vertex.** Current tetrahedron: Canvas / Elements / Molecules / Quests. New cuboctahedron expanded to include: Buffer / Graph / Breathing / BONDING / Legal / FERS.

**LOVE flows everywhere.** Molecule completion → knowledge graph node. Quest completion → axis D (Technical) node ingested. Genesis Block events → timestamped OQE in the main telemetry stream.

### Phase 2 File Manifest (Pre-merge Planning)

**Files to promote from `bonding/` into shared:**
```
bonding/src/genesis/eventBus.ts         → shared/genesis/eventBus.ts
bonding/src/genesis/economyStore.ts     → shared/genesis/economyStore.ts
bonding/src/genesis/telemetryStore.ts   → shared/genesis/telemetryStore.ts
bonding/src/data/elements.ts            → shared/data/elements.ts
bonding/src/engine/chemistry.ts         → shared/engine/chemistry.ts
bonding/src/types.ts                    → shared/types/bonding.ts
```

**Files to embed into Spaceship Earth:**
```
bonding/src/components/MoleculeCanvas.tsx   → frontend/src/ui/MoleculeCanvas.jsx (JSX port)
bonding/src/components/ElementPalette.tsx   → frontend/src/ui/ElementPalette.jsx
bonding/src/components/VoxelAtom.tsx        → frontend/src/ui/VoxelAtom.jsx
bonding/src/components/BondBeam.tsx         → frontend/src/ui/BondBeam.jsx
bonding/src/components/MolecularWarp.tsx    → frontend/src/ui/MolecularWarp.jsx (reuse as Soup background)
bonding/src/store/gameStore.ts              → frontend/src/store/gameStore.ts (Zustand slice)
```

**New files needed for Phase 2:**
```
frontend/src/ui/BondingRoom.jsx        ← Soup room wrapping MoleculeCanvas
frontend/src/ui/SoupCanvas.jsx         ← Spatial chat overlay on Three.js dome
frontend/src/store/soupStore.ts        ← Room state, molecule orbits, message gravity
worker/soup.ts                         ← Cloudflare Worker: Soup relay (extends bonding relay)
```

### Phase 2 Merge Sequence

```
Step 1   Promote genesis/ and data/elements.ts to shared layer
Step 2   Port MoleculeCanvas + R3F components to JSX (remove TS strict flags if needed)
Step 3   Compose gameStore as Zustand slice inside Spaceship Earth store
Step 4   Wire Genesis Block events → knowledge graph node ingestion
Step 5   Add BONDING node to Jitterbug Navigator
Step 6   Build BondingRoom.jsx — Soup room container
Step 7   Build SoupCanvas.jsx — molecules drift over the dome
Step 8   Wire LOVE economy tokens → existing spoon gauge display
Step 9   Extend Cloudflare Worker to handle Soup relay
Step 10  Full integration test: atom placed → telemetry → graph → dome animation
```

### Phase 2 Verification Checklist

- [ ] `bonding/` still deploys standalone to bonding.p31ca.org after merge
- [ ] Genesis Block events appear in Spaceship Earth telemetry stream
- [ ] Molecule completion creates a node in the Neo4j knowledge graph
- [ ] LOVE balance displays on Spoon Gauge alongside spoon count
- [ ] BONDING vertex visible and navigable in Jitterbug Navigator
- [ ] Soup room opens from dome node click
- [ ] MoleculeCanvas renders inside Soup room without WebGL context conflict
- [ ] Multiplayer PINGs appear in ActivityFeed
- [ ] `npx vitest run` passes in `bonding/` (488/488)
- [ ] `just test` passes in EDE root
- [ ] Android Chrome: touch works in BondingRoom embedded view

---

## Commit Messages

### Phase 1 (already done)
```
feat(ede): Everything Development Environment v0.1.0

Sovereign ecosystem drop-in: devcontainer, Docker Compose,
LiteLLM AI mesh, Continue.dev multi-model config, semantic
router, Neo4j knowledge graph, Thick Click WebSerial bridge,
ESP32-S3 firmware skeleton, VS Code cognitive extensions,
Astro Starlight docs, CI/CD pipelines, test infrastructure.

Three agents. One geometry. The mesh converges. 💜🔺💜
```

### Phase 2 (staged)
```
feat(merge): BONDING → Spaceship Earth — The Soup Integration

Genesis Block promotes to system-wide event bus. Molecule builder
embeds as Soup room in geodesic dome. LOVE economy merges with
spoon gauge. Elements become shared constants. Jitterbug gains
BONDING vertex. Multiplayer PINGs enter ActivityFeed.

The bridge becomes the ship. 🔺
```
