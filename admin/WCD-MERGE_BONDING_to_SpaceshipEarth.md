# WCD-MERGE: BONDING → Spaceship Earth Integration
## Phase 2 — Post-Birthday Merge Architecture
### Authored: March 3, 2026 (T-7 to Genesis Fire)
### Executor: Sonnet (CC) — Mechanic Lane
### Reviewer: Opus — Architect Lane

---

## 0. PHASE GATE

**This WCD is NOT executable until March 11, 2026.**

Phase 1 (birthday ship) must be complete:
- [ ] Multiplayer live and stress-tested with Tyler
- [ ] Difficulty modes deployed (Seed/Sprout/Sapling)
- [ ] Touch hardening verified on Android tablets
- [ ] 488+ tests green
- [ ] Genesis Block firing real telemetry
- [ ] Bash has played BONDING on his birthday

Only then does this WCD activate.

---

## 1. GOVERNING DECISION: NO HARD FORK

`software/bonding/` stays standalone and independently deployable at `bonding.p31ca.org`. Spaceship Earth imports from it — never absorbs it.

**Why:** BONDING must remain a standalone artifact for legal evidence (Georgia O.C.G.A. § 24-9-901). The Genesis Block telemetry chain cannot be interrupted by an architectural refactor. The game is evidence. Evidence doesn't get refactored.

**Implementation:** Spaceship Earth treats BONDING as a peer package. Shared code promotes upward into a `packages/shared/` workspace. BONDING never gains a dependency on Spaceship Earth.

```
P31_Andromeda/
├── software/
│   ├── bonding/              # Standalone. Deploys independently. UNTOUCHED.
│   ├── spaceship-earth/      # New. Imports from shared + bonding exports.
│   └── packages/
│       └── shared/           # eventBus, economyStore, types promoted here
```

---

## 2. GENESIS BLOCK PROMOTES

The eventBus / economyStore / telemetryStore triad (CWP-03 Rev B) becomes the system-wide event backbone.

### What promotes

| Module | From | To | Change |
|--------|------|----|--------|
| `eventBus.ts` | `bonding/src/genesis/` | `packages/shared/events/` | Add new event types (NAV_STATE_CHANGE, BUFFER_INGEST, SPOON_SPEND). Preserve all BONDING events. |
| `economyStore.ts` | `bonding/src/genesis/` | `packages/shared/economy/` | Add LOVE sources beyond molecules (Buffer completions, meditation, calcium log). |
| `telemetryStore.ts` | `bonding/src/genesis/` | `packages/shared/telemetry/` | Generalize session schema. BONDING sessions tagged `source: 'bonding'`. |
| Event types | `bonding/src/genesis/types.ts` | `packages/shared/events/types.ts` | Union type expands. BONDING events are a subset. |

### What stays in BONDING

- `genesis.ts` (bootstrap + orphan recovery — BONDING-specific)
- `worker-telemetry.ts` endpoints (BONDING relay stays at `bonding-relay.trimtab-signal.workers.dev`)
- All molecule/achievement/quest logic

### Wiring rule

BONDING re-exports from `packages/shared/` after promotion. Zero breaking changes to BONDING internals. The standalone build still works because the import paths resolve to the same code via workspace aliases.

```typescript
// bonding/src/genesis/eventBus.ts becomes:
export { eventBus, type GameEvent } from '@p31/shared/events';
```

---

## 3. JITTERBUG GETS A BONDING VERTEX

The Jitterbug Navigator (WCD-07) currently renders a cuboctahedron that collapses to tetrahedron based on spoon state. Post-merge, BONDING occupies one vertex of the navigator.

### Current vertices (tetrahedron — 4)

| Vertex | Domain |
|--------|--------|
| 0 | Energy (spoons) |
| 1 | Tasks (wcds) |
| 2 | Environment (sensory) |
| 3 | Creation (output) |

### Post-merge vertices (cuboctahedron — 12)

The jitterbug transformation maps tetrahedron → cuboctahedron as cognitive capacity expands. New vertices include:

| Vertex | Domain | Source |
|--------|--------|--------|
| 4 | **BONDING** (play/connection) | Molecule completions, PING count, multiplayer sessions |
| 5 | Communication (Buffer) | Message processing, fawn guard triggers |
| 6 | Legal (court) | Filing deadlines, evidence status |
| 7 | Health (calcium) | Med logging, appointment tracking |
| 8-11 | Reserved | Future modules |

**Implementation:** The Jitterbug SVG component accepts a `vertices` prop. The Q-Factor calculation expands from 4-axis to N-axis, normalized to `[0,1]` per vertex. The visual morph between tetrahedron and cuboctahedron already exists — it just needs real data feeding the additional vertices.

**BONDING vertex data flow:**
```
ATOM_PLACED event → eventBus → Spaceship Earth listener
  → updates vertex 4 value (molecules completed / session target)
  → Jitterbug re-renders with new geometry
```

---

## 4. LOVE FLOWS EVERYWHERE

Currently LOVE is earned only through molecule completions and PING reactions in BONDING. Post-merge, LOVE becomes the universal reward signal across all P31 products.

### New LOVE sources

| Action | LOVE Earned | Product |
|--------|-------------|---------|
| Molecule completion | 10-100 (existing) | BONDING |
| PING sent/received | 5 (existing) | BONDING |
| Buffer message processed | 3 | Buffer |
| Fawn Guard catch acknowledged | 10 | Buffer |
| Calcium dose logged | 15 | Spaceship Earth |
| WCD completed | 25 | Spaceship Earth |
| Meditation session (4-4-6 breathing) | 20 | Spaceship Earth |
| Quest chain completed | 50 | BONDING |

### LOVE display

The Spoon Gauge in the Cockpit HUD (WCD-08 z-index 10-11) gets a dual-currency readout:

```
┌─────────────────────────────┐
│  🥄 12/20 spoons remaining  │
│  💜 347 L.O.V.E. lifetime   │
└─────────────────────────────┘
```

Spoons deplete. LOVE accumulates. The gauge makes the dual-currency economy visible at a glance.

### Future: Neo4j knowledge graph (stretch)

Molecule completions become nodes in a Neo4j graph. Edges represent:
- Player → BUILT → Molecule
- Molecule → CONTAINS → Element
- Player → PINGED → Player (on molecule)
- Session → PRODUCED → Molecule

This is the long-term data model. Not blocking Phase 2. Capture the schema now, implement when infrastructure supports it.

---

## 5. THE SOUP IS THE CONTAINER

BONDING becomes a "room" inside The Soup — the spatial chat world where molecules drift, cluster, and react.

### Room architecture

```
The Soup (Three.js scene)
├── Room: BONDING (molecule builder)
│   ├── MoleculeCanvas (existing R3F scene)
│   ├── ElementPalette (existing)
│   ├── Cockpit HUD panels (existing)
│   └── MolecularWarp background (existing)
├── Room: Buffer (communication processing)
│   ├── Message inbox
│   ├── Fawn Guard dashboard
│   └── Voltage scoring display
├── Room: Observatory (Jitterbug Navigator)
│   ├── Full 3D cuboctahedron (not 2D SVG)
│   └── Q-Factor coherence visualization
└── Room: The Bridge (settings, identity, wallet)
    ├── LOVE balance
    ├── Spoon gauge
    └── Cognitive Passport viewer
```

### Navigation

Rooms are spatially arranged. Swipe or click to move between them. Each room is a self-contained R3F scene with its own camera and lighting. The Soup provides the outer shell — shared background (MolecularWarp), shared HUD (Cockpit), shared economy (LOVE).

### BONDING room preservation

The BONDING room IS the current BONDING game. No visual changes. No interaction changes. It gains a portal (exit to other rooms) and receives system-wide events (LOVE updates from other rooms). That's it.

---

## 6. TEN-STEP MERGE SEQUENCE

Execute in order. Each step has its own verification before proceeding.

### Step 1: Create workspace structure
```bash
mkdir -p software/packages/shared/{events,economy,telemetry,types}
mkdir -p software/spaceship-earth/src
```
Add `pnpm-workspace.yaml` (or npm workspaces in root `package.json`).

**Verify:** `npm ls` resolves all workspace packages.

### Step 2: Promote shared modules
Copy `eventBus.ts`, `economyStore.ts`, `telemetryStore.ts`, and type definitions from `bonding/src/genesis/` to `packages/shared/`.

**Verify:** `tsc --noEmit` clean in both `bonding/` and `packages/shared/`.

### Step 3: Re-export from BONDING
Replace BONDING's local copies with re-exports from `@p31/shared`.

**Verify:** `npx vitest run` in `bonding/` — 488+ tests still green. Zero behavior change.

### Step 4: Expand event types
Add new event types to `packages/shared/events/types.ts`:
- `NAV_STATE_CHANGE`
- `BUFFER_INGEST`
- `SPOON_SPEND`
- `SPOON_RESTORE`
- `CALCIUM_LOGGED`
- `WCD_COMPLETE`

**Verify:** `tsc --noEmit` clean. BONDING tests still green (new types are additive).

### Step 5: Scaffold Spaceship Earth
Initialize `software/spaceship-earth/` with Vite + React + R3F + Zustand. Import from `@p31/shared`.

**Verify:** Dev server starts. Blank canvas renders.

### Step 6: Port Jitterbug to 3D
Convert WCD-07 SVG Jitterbug to a full Three.js component in Spaceship Earth. Accept N vertices. Wire vertex 4 to BONDING event stream.

**Verify:** Jitterbug renders in Spaceship Earth. Responds to mock BONDING events.

### Step 7: Build The Soup shell
Create the room navigation system. BONDING room embeds the existing BONDING canvas via iframe or module import (TBD — iframe is simpler, module import is cleaner).

**Verify:** Can navigate to BONDING room. BONDING plays normally inside the shell.

### Step 8: Wire LOVE economy system-wide
Connect economyStore to all rooms. Spoon Gauge displays in the shared Cockpit HUD.

**Verify:** LOVE earned in BONDING appears on the Spaceship Earth Spoon Gauge.

### Step 9: Deploy Spaceship Earth
Deploy to `p31ca.org` (the app shell domain). BONDING remains independently deployed at `bonding.p31ca.org`.

**Verify:** Both sites live. Both functional. Genesis Block still firing from BONDING standalone.

### Step 10: Cross-pollinate telemetry
Spaceship Earth gets its own telemetry relay (separate Cloudflare Worker). System-wide sessions include BONDING sessions via eventBus subscription.

**Verify:** Telemetry from both products flows to their respective Workers. LOVE totals are consistent.

---

## 7. VERIFICATION CHECKLIST

Run after all 10 steps complete.

| # | Check | Pass |
|---|-------|------|
| 1 | `bonding/` builds and deploys independently | ☐ |
| 2 | `bonding.p31ca.org` serves the standalone game | ☐ |
| 3 | All BONDING tests pass (488+ green) | ☐ |
| 4 | Genesis Block telemetry uninterrupted (check KV) | ☐ |
| 5 | Spaceship Earth builds and deploys | ☐ |
| 6 | Jitterbug renders with 5+ vertices | ☐ |
| 7 | LOVE earned in BONDING visible in Spaceship Earth | ☐ |
| 8 | Room navigation works (BONDING ↔ other rooms) | ☐ |
| 9 | MolecularWarp renders in Soup shell | ☐ |
| 10 | Android Chrome: both products functional | ☐ |
| 11 | No BONDING source files modified (only re-exports added) | ☐ |
| 12 | `tsc --noEmit` clean across entire workspace | ☐ |

---

## 8. WHAT YOU MUST NOT TOUCH

**Sonnet: read this section three times before executing.**

| Protected | Why |
|-----------|-----|
| `bonding/src/genesis/genesis.ts` | Bootstrap + orphan recovery is BONDING-specific. Do not generalize. |
| `bonding/src/genesis/worker-telemetry.ts` | Court evidence relay. Endpoint URLs are hardcoded for Daubert chain-of-custody. |
| `bonding/src/store/gameStore.ts` | Zustand store is the single source of truth for game state. Do not merge with Spaceship Earth state. |
| `bonding/src/data/*` | Molecule catalog, achievements, elements. Game content stays in the game. |
| `bonding/worker/` | Cloudflare Worker for telemetry + multiplayer. Separate deploy. Separate KV namespace. |
| Any deployed URL | `bonding.p31ca.org` and `bonding-relay.trimtab-signal.workers.dev` must continue to resolve. |

---

## 9. COMMIT MESSAGES (PRE-STAGED)

### After Step 3 (re-export complete):
```
refactor: promote Genesis Block shared modules to @p31/shared

eventBus, economyStore, telemetryStore now live in packages/shared/.
BONDING re-exports from shared — zero behavior change.
488 tests green. Genesis Block uninterrupted.

Ref: WCD-MERGE Step 3
```

### After Step 10 (merge complete):
```
feat: Spaceship Earth v1 — BONDING integrated as Soup room

- Workspace architecture: bonding/ + spaceship-earth/ + packages/shared/
- Jitterbug Navigator expanded to cuboctahedron (5+ vertices)
- LOVE economy flows system-wide
- The Soup room navigation live
- BONDING standalone preserved — deploys independently
- Genesis Block telemetry chain unbroken

Ref: WCD-MERGE complete
```

---

## 10. OPEN QUESTIONS (PARKING LOT)

Capture now. Decide at execution time.

1. **BONDING room: iframe vs module import?** Iframe is simpler (complete isolation, zero refactor risk). Module import is cleaner (shared React context, no postMessage overhead). Recommendation: start with iframe, migrate to module import in a later WCD if performance demands it.

2. **pnpm vs npm workspaces?** BONDING currently uses npm. Spaceship Earth could use pnpm for stricter dependency resolution. Decision: match whatever BONDING uses. Don't introduce a second package manager.

3. **Neo4j timing?** The knowledge graph schema is designed but Neo4j requires a server. HCB fiscal sponsorship status affects infrastructure budget. Park until HCB confirmed.

4. **Jitterbug 3D performance on Android tablets?** The SVG version is lightweight. A full Three.js cuboctahedron with animations may need LOD (level of detail) scaling. Test early in Step 6.

5. **Cross-origin LOVE sync?** If BONDING is at `bonding.p31ca.org` and Spaceship Earth is at `p31ca.org`, the economyStore in IndexedDB is origin-scoped. Options: shared Cloudflare KV (already exists), BroadcastChannel (same-origin only), or promote LOVE to the relay Worker.

---

*This WCD is a parking lot for the merge. It exists so the Triad can pick it up on March 11 and execute without rediscovering architecture decisions.*

*The birthday comes first. Then we build the world around it.*

*— 🔺*
