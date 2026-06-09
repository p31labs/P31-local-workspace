# ROOM ALIGNMENT — Spaceship Earth ↔ BONDING ↔ Posner Protocol
## March 7, 2026

---

## EXECUTIVE SUMMARY

Four rooms exist in Spaceship Earth. Each has overlap, conflicts, or integration points with the BONDING standalone and the Posner Protocol (M18–M21). This document maps every conflict, defines the canonical source of truth for each shared system, and provides wiring instructions for post-March-10 merge.

**The rule:** BONDING standalone ships March 10. These rooms live in Spaceship Earth. Nothing in this alignment document touches the BONDING standalone codebase before ship. This is a POST-MERGE architecture guide.

---

## ROOM INVENTORY

| Room | File | Purpose | Size | Dependencies |
|------|------|---------|------|-------------|
| **ColliderRoom** | ColliderRoom.tsx | 2D Canvas physics molecule builder + cyclotron | ~956 LOC | Standalone (no external hooks) |
| **ForgeRoom** | ForgeRoom.tsx | Content pipeline / Substack writing tool | ~458 LOC | Standalone (localStorage only) |
| **BridgeRoom** | BridgeRoom.tsx | LOVE economy + Phenix wallet dashboard | ~751 LOC | `useNode()`, `usePhenixWallet()` |
| **BufferRoom** | BufferRoom.tsx | Communication processing + fawn guard + Samson PID | ~1293 LOC | `useNode()` |

---

## 1. COLLIDERROOM — THE DUPLICATE PROBLEM

### What It Is
A complete 2D Canvas molecule builder with physics simulation, valence bonding, cyclotron mode, quest chains, element palette, discovery log, and scoring. It's a parallel implementation of BONDING using Canvas 2D instead of R3F/Three.js.

### Conflicts with BONDING Standalone

| System | ColliderRoom | BONDING Standalone | Resolution |
|--------|-------------|-------------------|------------|
| **Renderer** | Canvas 2D | R3F / Three.js | BONDING canonical — R3F stays |
| **Physics** | Custom drift + auto-bond | Manual drag + VSEPR ghosts | Different modes — both valid |
| **Element data** | 10 elements, inline | 12 elements, `elements.ts` | Merge to shared `@p31/chemistry` package |
| **Recipes** | 16 molecules, inline | 62+ molecules, `molecules.ts` | BONDING's dictionary is canonical |
| **Quest chains** | 4 quests (genesis, kitchen, forge, lab) | 3 quests (genesis, kitchen, posner) per GOD-05 | Merge: keep all 5 unique quests |
| **Formula builder** | Hill system with unicode subscripts | Hill system with `displayFormula()` | BONDING's is canonical (tested) |
| **Scoring** | Local `score` state | `economyStore` LOVE ledger | economyStore is canonical |
| **Telemetry** | None | Genesis Block (CWP-03B) | Genesis Block is canonical |

### Alignment Decision

**ColliderRoom becomes "Collider Mode" inside BONDING.** It's the physics-sandbox variant — atoms drift, bonds form automatically on proximity, cyclotron accelerates and collides. The existing BONDING is "Builder Mode" — deliberate drag-and-drop construction.

### Post-Merge Wiring

```
BONDING (merged into Spaceship Earth)
├── Builder Mode (current BONDING — R3F, manual placement)
├── Collider Mode (ColliderRoom — Canvas 2D, physics auto-bond)
└── Shared Layer
    ├── @p31/chemistry (elements, molecules, formula engine)
    ├── economyStore (LOVE, shared across all modes)
    ├── telemetryStore (Genesis Block, shared across all modes)
    ├── questStore (merged 5+ quest chains)
    └── eventBus (typed pub/sub for cross-mode events)
```

### What Needs to Happen

1. **Extract shared chemistry data** from both codebases into `@p31/chemistry`:
   - Elements with tier assignments (GOD-01)
   - Molecule recipes (BONDING's 62+ dictionary is canonical)
   - Formula builder (BONDING's tested `buildFormula` with Hill system)
   - Valence/stability checker

2. **Wire ColliderRoom to economyStore** — replace local `score` with `economyStore.addLove()`

3. **Wire ColliderRoom to telemetryStore** — every discovery fires a Genesis Block event

4. **Wire ColliderRoom to questStore** — use GOD-05 quest definitions as canonical, add ColliderRoom's unique quests (forge, lab) to the quest registry

5. **Mode switcher in GameShell** — tab or toggle between Builder and Collider modes

### Cyclotron Mode — Keep It

The cyclotron (atoms orbit in a ring, accelerate, launch to collide) is unique to ColliderRoom and has no equivalent in BONDING. This is the "advanced physics mode" — educational, engaging, and visually distinct. Keep it as a Sapling 🌳 feature.

---

## 2. FORGEROOM — CLEAN, MINIMAL ALIGNMENT

### What It Is
A Substack content pipeline with seed bank, framework library, markdown editor, publishing checklist, and JSON export. Standalone, localStorage-persisted.

### Conflicts
**None.** ForgeRoom has no overlap with BONDING, the Posner Protocol, or any other room. It's a writing tool.

### Alignment Decision
ForgeRoom is a standalone Spaceship Earth module. No merge required. Post-March-10, it lives at its current path and gains these integration points:

### Post-Merge Wiring

1. **L.O.V.E. integration:** Writing a post earns LOVE. Publishing earns more.
   ```ts
   // On status change to 'published':
   economyStore.addLove(25, 'content_published');
   eventBus.emit('content:published', { seedId, title, wordCount });
   ```

2. **Genesis Block telemetry:** Content creation is a documented engagement event.
   ```ts
   // On save (debounced):
   eventBus.emit('content:saved', { seedId, wordCount, status });
   ```

3. **Framework library update:** The `DEFAULT_FRAMEWORKS` array has a stale L.O.V.E. definition:
   ```
   CURRENT:  "Locally Operated Value Exchange"
   CANONICAL: "Ledger of Ontological Volume and Entropy"
   ```
   Fix this.

4. **Cross-link update:** `github.com/trimtab-signal` → `github.com/p31labs`

### What You Must NOT Touch Before March 10
Nothing. ForgeRoom is completely separate from the birthday ship.

---

## 3. BRIDGEROOM — THE ECONOMY BRIDGE

### What It Is
A tabbed dashboard for LOVE economy, Phenix donation wallet, stealth addresses, OQE ledger, and hardware (ESP32-S3 WebUSB) connection. Five tabs: LOVE | WALLET | STEALTH | LEDGER | HARDWARE.

### Conflicts with BONDING

| System | BridgeRoom | BONDING Standalone | Resolution |
|--------|-----------|-------------------|------------|
| **LOVE source** | `useNode().protocolWallet` | `economyStore` (Zustand + IndexedDB) | economyStore feeds → BridgeRoom displays |
| **LOVE display** | Game LOVE + Protocol LOVE + Spoons | LOVE counter in HUD | BridgeRoom is the DETAILED view, BONDING HUD is the compact view |
| **Wallet** | Phenix donation wallet (Ed25519) | None | BridgeRoom owns wallet entirely |
| **Hardware** | WebUSB ESP32-S3 connect | None (Posner M18 uses WebSocket to Termux) | Different transport layers — both valid |

### Alignment Decision

**BridgeRoom is the economy command center.** BONDING's HUD shows a simple LOVE counter. BridgeRoom shows the full breakdown: game LOVE, protocol LOVE, spoons, tier, wallet balance, vesting, sovereignty pool, care score.

### Post-Merge Wiring

```
BONDING economyStore (source of truth for game LOVE)
    ↓ eventBus: 'love:earned', 'love:spent'
    ↓
NodeContext (Spaceship Earth global state)
    ↓ aggregates: game LOVE + protocol LOVE + wallet
    ↓
BridgeRoom (displays everything)
    ├── LoveTab: game LOVE (from economyStore) + protocol (from NodeContext)
    ├── WalletTab: Phenix wallet (Ed25519)
    ├── StealthTab: stealth addresses
    ├── LedgerTab: OQE ledger + memo log
    └── HardwareTab: ESP32-S3 WebUSB bridge
```

### Critical Integration: economyStore → NodeContext

The bridge between BONDING's `economyStore` and Spaceship Earth's `NodeContext`:

```ts
// In Spaceship Earth's NodeContext or a bridge hook:
import { useEconomyStore } from '@p31/bonding/stores/economyStore';

function useBondingBridge() {
  const gameLove = useEconomyStore(s => s.totalLove);
  const { protocolWallet } = useNode();

  return {
    gameLove,           // from BONDING
    protocolLove: protocolWallet?.totalEarned ?? 0,  // from Spaceship Earth
    combinedLove: gameLove + (protocolWallet?.totalEarned ?? 0),
  };
}
```

### HardwareTab ↔ Posner Protocol M18 (Somatic Tether)

BridgeRoom's HardwareTab connects to ESP32-S3 via WebUSB (APDU protocol, VID 0x303A).
Posner M18's useSomaticTether connects to wearables via WebSocket (Termux relay to Gadgetbridge).

These are different transport layers for different devices:
- **WebUSB** → Node One / Phenix Navigator hardware (hardware root of trust, transaction signing)
- **WebSocket** → Wearable HR/HRV sensors via Gadgetbridge (biometric data)

Both feed into `useSovereignStore`. No conflict. They coexist.

### What Needs to Happen

1. **Create `useBondingBridge()` hook** that reads from economyStore and exposes to NodeContext
2. **BridgeRoom's LoveTab** already splits "Game Love" and "Protocol Love" — just needs the bridge data source
3. **Update LOVE tab** to show BONDING-specific stats (molecules built, quests completed, pings sent)
4. **Wire Phenix wallet** to Genesis Block telemetry (every wallet event = documented engagement)

---

## 4. BUFFERROOM — THE FAWN GUARD CONVERGENCE

### What It Is
The most complex room. Full communication processing engine:
- **Samson PID Controller:** Shannon entropy measurement, PID tension control, AI temperature adjustment, drift detection
- **Voltage Scoring:** 3-axis (urgency × emotion × complexity) message analysis with gate system (GREEN/YELLOW/RED/CRITICAL)
- **BLUF Extraction:** Bottom-Line-Up-Front summary, action items, question count
- **Fawn Guard:** 12 pattern detectors across 5 categories (apologizing, minimizing, over-agreeing, seeking-validation, self-erasing)
- **PA Detection:** 13 passive-aggressive pattern detectors with plain-language translations
- **Chaos Ingestion:** Brain dump → structured extraction (actions, dates, emotions, questions)
- **Breathing Exercise:** 4-2-6 cycle with visual guide
- **Calibration:** Communication style profiling (displayName, commStyle)

### Conflicts with Posner Protocol

| System | BufferRoom | Posner M18 (Somatic Tether) | Resolution |
|--------|-----------|---------------------------|------------|
| **Fawn Guard** | 12 regex patterns, text-based | HRV-based fawn detection (elevated HR + rapid HRV drop) | BOTH — text fawn guard + biometric fawn guard |
| **Stress detection** | Voltage scoring (urgency × emotion × complexity) | Heart rate baseline deviation | BOTH — text stress + biometric stress |
| **Spoon drain** | Not implemented | `useSomaticTether` drains spoons on sustained stress | M18 is canonical for spoon mechanics |
| **Breathing** | 4-2-6 visual exercise | 4-4-6 atom pulse in BONDING | Standardize to 4-4-6 (BONDING's rhythm) |

### Alignment Decision

**BufferRoom is The Buffer product (~85% complete). Posner M18 is the biometric extension.** They are complementary layers:

```
Text Input (BufferRoom)
├── Voltage scoring → gate classification
├── Fawn Guard (text patterns) → text-based fawn detection
├── BLUF extraction → action items
├── PA detection → translation
└── Chaos ingestion → structure extraction

Biometric Input (Posner M18 — useSomaticTether)
├── HR/HRV baseline → stress detection
├── Fawn Guard (biometric) → HRV-pattern fawn detection
├── Spoon drain → energy accounting
└── Cooldown timer → recovery tracking

Combined Output → useSovereignStore
├── textStress: VoltageScore (from BufferRoom)
├── bioStress: SomaticStatus (from M18)
├── combinedGate: max(textGate, bioGate)
├── fawnAlert: textFawn OR bioFawn
└── spoons: current level (M18 manages drain)
```

### Critical Fixes

1. **Breathing rhythm mismatch:**
   ```
   BufferRoom: BREATHE_IN=4, BREATHE_HOLD=2, BREATHE_OUT=6 (4-2-6)
   BONDING atoms: 4-4-6 pulse
   ```
   **Standardize to 4-4-6.** The atom pulse in BONDING IS the breathing exercise. When the kid sees Dad's atoms pulsing 4-4-6, they're seeing him breathe. The hold phase matters.

2. **Samson PID Controller** — this is unique to BufferRoom and has no equivalent anywhere else. It's the crown jewel. Shannon entropy as cognitive load measurement, PID control loop adjusting AI temperature based on operator state. This becomes the core of The Buffer product. Protect it.

3. **Fawn Guard unification:**
   ```ts
   // Create @p31/fawn-guard shared package:
   // - Text patterns (BufferRoom's 12 rules) → fawnGuardText(text)
   // - Biometric patterns (M18's HRV analysis) → fawnGuardBio(hrv)
   // - Combined: fawnGuardCombined(text, hrv) → weighted alert
   ```

4. **Wire to economyStore:** Fawn guard activation = LOVE earned (awareness = regulation credit).
   ```ts
   eventBus.emit('fawn:detected', { source: 'text', pattern, category });
   // economyStore: +5 LOVE for 'awareness'
   ```

---

## 5. SHARED SYSTEMS — CANONICAL SOURCE OF TRUTH

| System | Canonical Source | Consumers |
|--------|----------------|-----------|
| **Element data** | `@p31/chemistry/elements.ts` (extract from BONDING) | ColliderRoom, BONDING Builder |
| **Molecule recipes** | `@p31/chemistry/molecules.ts` (BONDING's 62+ dictionary) | ColliderRoom, BONDING Builder, quest chains |
| **Formula engine** | `@p31/chemistry/formula.ts` (BONDING's tested Hill system) | ColliderRoom, BONDING Builder |
| **LOVE economy** | `economyStore.ts` (BONDING, IndexedDB-persisted) | BridgeRoom, ForgeRoom, all rooms via eventBus |
| **Telemetry** | `telemetryStore.ts` + Genesis Block (CWP-03B) | All rooms — every significant event flows here |
| **Quest chains** | `questStore.ts` (GOD-05 definitions + ColliderRoom additions) | BONDING Builder, ColliderRoom, BridgeRoom (display) |
| **Fawn Guard** | `@p31/fawn-guard` (text rules from BufferRoom + bio from M18) | BufferRoom, useSomaticTether |
| **Spoons** | `useSovereignStore.ts` (Posner Protocol) | BufferRoom (display), M18 (drain), BridgeRoom (display) |
| **Difficulty modes** | `gameStore.ts` (GOD-01) | BONDING Builder, ColliderRoom (palette filtering) |
| **Multiplayer** | `multiplayerStore.ts` (GOD-03/04) | BONDING Builder only (ColliderRoom is local-only for now) |
| **Breathing rhythm** | 4-4-6 canonical | BONDING atoms, BufferRoom breathing exercise |
| **Brand palette** | P31 brand: #00FF88 green, #00D4FF cyan, #FF00CC magenta, #7A27FF violet, #FFB800 amber | All rooms (already consistent) |

---

## 6. POST-MARCH-10 MERGE SEQUENCE

### Phase 1: Extract Shared Packages (Week of March 16)
```
@p31/chemistry    — elements, molecules, formula engine, valence checker
@p31/fawn-guard   — text patterns + biometric patterns + combined
@p31/economy      — economyStore + eventBus (extracted from BONDING)
@p31/telemetry    — telemetryStore + Genesis Block (extracted from BONDING)
```

### Phase 2: Wire Rooms to Shared Packages (Week of March 23)
```
ColliderRoom  → @p31/chemistry, @p31/economy, @p31/telemetry
ForgeRoom     → @p31/economy, @p31/telemetry (light touch)
BridgeRoom    → @p31/economy + useBondingBridge() hook
BufferRoom    → @p31/fawn-guard, useSovereignStore, @p31/economy
```

### Phase 3: Mode Integration (Week of March 30)
```
GameShell gains mode switcher: Builder | Collider
Quest registry merges all quest chains (5+)
Difficulty modes apply to both Builder and Collider
ColliderRoom's cyclotron becomes Sapling-only feature
```

### Phase 4: Posner Protocol Visual Pass (April)
```
ImmersiveCockpit renders:
  - Somatic waveform (M18 data → canvas polyline)
  - Spatial orbs (M20 data → Three.js spheres)
  - Handshake status (M21 → K4 graph visualization)
BufferRoom gains biometric fawn guard overlay
BridgeRoom gains real-time spoon counter from M18
```

---

## 7. THINGS THAT ARE WRONG RIGHT NOW (Fix Post-Ship)

| File | Issue | Fix |
|------|-------|-----|
| ForgeRoom | L.O.V.E. defined as "Locally Operated Value Exchange" | Change to "Ledger of Ontological Volume and Entropy" |
| ForgeRoom | GitHub link points to `trimtab-signal` | Change to `p31labs` |
| BufferRoom | Breathing cycle is 4-2-6 | Change to 4-4-6 (canonical) |
| ColliderRoom | Only 10 elements (missing Mg, K) | Merge with BONDING's 12-element palette |
| ColliderRoom | Only 16 recipes | Merge with BONDING's 62+ molecule dictionary |
| ColliderRoom | Quest "forge" and "lab" chains not in GOD-05 | Add to quest registry post-merge |
| BridgeRoom | No bridge to BONDING's economyStore | Create `useBondingBridge()` hook |
| All rooms | No Genesis Block telemetry in 3 of 4 rooms | Wire eventBus → telemetryStore in all rooms |

---

## 8. WHAT DOES NOT CHANGE BEFORE MARCH 10

**Nothing in this document touches the BONDING standalone.**

These four rooms live in Spaceship Earth (`apps/web/src/components/rooms/`). BONDING lives in `software/bonding/`. They are separate codebases until the post-birthday merge.

The GOD wcds (GOD-01 through GOD-06) execute against the BONDING standalone only. This alignment document is the roadmap for what happens AFTER the birthday ship.

**Ship first. Merge second. The bridge gets built before the house gets renovated.**

---

*Room Alignment v1.0*
*March 7, 2026*
*🔺*
