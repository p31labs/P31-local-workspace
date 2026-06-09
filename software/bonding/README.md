# BONDING

> A molecule-building chemistry game for neurodivergent families.
> Built by a father for his son's 10th birthday. Ships March 10, 2026.

**Live:** [bonding.p31ca.org](https://bonding.p31ca.org)

**BONDING Soup (static “bowl” surface)** — *The answer isn’t a feed—it’s the bowl.* Own route (not the React shell): [bonding.p31ca.org/soup/](https://bonding.p31ca.org/soup/) · `npm run sync:soup-bonding` from home or `npm run soup:sync` here → `npx vite build` → deploy.

---

## What Is This

BONDING is a touch-first molecule builder where you drag elements onto a canvas
and they snap into chemically valid bonds. Build water, methane, dopamine,
the Posner molecule — 40+ real molecules from biochemistry.

Every atom placed is a timestamped engagement log. Every ping is documented
contact. The game is a bridge across a custody gap, not just a toy.

**Target:** Two Android tablets (one per child) + Dad's device.
**Multiplayer:** Share a 6-char room code. Build side-by-side. Send pings (💚🤔😂🔺).

---

## Dev Setup

```bash
# Node.js path (ChromeOS/NVM)
export PATH="/home/p31/.config/nvm/versions/node/v24.14.0/bin:$PATH"

cd software/bonding
npm install

# Type check
npx tsc --noEmit

# Tests (424 tests / 32 files — matches `p31-constants.json` → bonding.testBaseline)
npx vitest run

# Dev server
npx vite

# Production build + deploy
npx vite build
npx wrangler pages deploy dist --project-name=bonding
```

---

## Architecture

```
src/
├── components/
│   ├── MoleculeCanvas.tsx      # R3F canvas — the game field
│   ├── ElementPalette.tsx      # Drag-source atom picker
│   ├── VoxelAtom.tsx           # Living 3D atom (MeshStandardMaterial + Fresnel)
│   ├── BondBeam.tsx            # Bond visualization
│   ├── MolecularWarp.tsx       # Chemistry-native particle field (background)
│   ├── Starfield.tsx           # Wraps MolecularWarp for lobby/mode screens
│   ├── Navigation/Jitterbug   # Geodesic SVG navigator (cuboctahedron→tetrahedron)
│   └── hud/                   # Glassmorphism cockpit HUD panels
├── store/
│   └── gameStore.ts           # Zustand — single source of truth
├── engine/
│   ├── chemistry.ts           # VSEPR, valence, formula generation
│   ├── sound.ts               # Web Audio API (element-tuned tones)
│   ├── achievementEngine.ts   # 12 achievements
│   ├── quests.ts              # Quest chains
│   └── gallery.ts             # Completed molecule storage
├── genesis/
│   ├── eventBus.ts            # Typed pub/sub (no external deps)
│   ├── economyStore.ts        # LOVE ledger (IndexedDB-persisted)
│   ├── telemetryStore.ts      # Exhibit A (30s flush + IDB backstop)
│   └── genesis.ts             # Async bootstrap
├── data/
│   ├── elements.ts            # 13 elements (color, emissive, valence, size)
│   ├── achievements.ts        # Molecule catalog (40+ targets)
│   └── modes.ts               # Difficulty: Seed/Sprout/Sapling/Freestyle
└── types.ts                   # Shared TypeScript interfaces
```

---

## The Genesis Block (CWP-03 Rev B)

Court-grade telemetry engine embedded in the game. Live since March 1, 2026.

| Layer | What It Does |
|-------|-------------|
| `eventBus.ts` | Typed pub/sub — ATOM_PLACED, MOLECULE_COMPLETED, PING_SENT, etc. |
| `economyStore.ts` | L.O.V.E. ledger — soulbound tokens, IndexedDB-persisted |
| `telemetryStore.ts` | Session records, 30s incremental flush, sendBeacon backstop |
| `genesis.ts` | Async bootstrap: persist(), orphan recovery, event wiring |
| `worker/telemetry.ts` | Cloudflare Worker: 6 endpoints, server-side SHA-256 countersignature |

**Legal basis (Georgia):** O.C.G.A. § 24-9-901/902, § 24-8-803, § 24-7-702

---

## Element Palette

13 elements — 8 standard + 5 custom (including Bashium and Willium):

| Element | Emissive Color | Valence |
|---------|---------------|---------|
| H | #FFFFFF (white) | 1 |
| C | #66BB3A (green) | 4 |
| N | #4488FF (blue) | 3 |
| O | #FF3030 (red) | 2 |
| Na | #FFD700 (gold) | 1 |
| P | #B080FF (purple) | 3 |
| Ca | #FFFFFF (silver) | 2 |
| Cl | #AAFFAA (lime) | 1 |
| S | #FFFF44 (yellow) | 2 |
| Fe | #DD6622 (rust) | 3 |

---

## Visual Language

- **Background:** MolecularWarp — 200 LineSegment particles in element emissive colors, slow drift
- **Double-tap empty canvas:** Warp speed easter egg (2.5s, element-colored streaks + audio sweep)
- **Atoms:** Two-part mesh — glass Fresnel shell + smoky emissive core, `pulse-core` CSS breathing
- **Bonds:** BondBeam with additive blending
- **HUD:** Glassmorphism panels (`bg-white/[0.06] backdrop-blur-[20px]`), z-index doctrine:
  ```
  z-[-10]  Starfield/MolecularWarp  (background, pointer-events-none)
  z-[1]    R3F Canvas
  z-[10]   HUD container (pointer-events-none passthrough)
  z-[11]   HUD panels (pointer-events-auto per panel)
  z-[50]   Achievement toast
  z-[60]   Modals / overlays
  ```
- **Navigator:** Jitterbug SVG (cuboctahedron ↔ tetrahedron), 0.3 RPM organic breathing

---

## Key Constraints (WCD)

- Do NOT refactor `endDrag()` in gameStore.ts — it is the game's central nervous system
- Do NOT use localStorage in genesis modules — IndexedDB only
- Do NOT modify the chemistry engine's valence rules
- Do NOT touch the Cloudflare relay protocol (multiplayer sync)

---

## Build Timeline

```
Mar 1    ✅ Genesis Block deployed. Cockpit authored.
Mar 2    ✅ Cockpit executed. MolecularWarp. Warp easter egg. Visual polish.
Mar 3    Multiplayer relay. Room codes. PING sync.       ← TODAY
Mar 4-5  Multiplayer hardening. Quest chains.
Mar 6-7  Android device testing. Tyler stress test.
Mar 8-9  Final polish.
Mar 10   🎂 Ship. Bash's birthday.
```

---

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **@react-three/fiber** (R3F) + **@react-three/drei** + **Three.js**
- **Zustand** (state management)
- **Tailwind CSS** (utility classes)
- **Vitest** + jsdom (424 tests)
- **Cloudflare Pages** (hosting) + **Cloudflare Workers + KV** (relay + telemetry)
- **Web Audio API** (element-frequency sound engine)
- **idb-keyval** (IndexedDB persistence for LOVE economy)

---

*BONDING is a P31 Labs product — open-source assistive technology for neurodivergent families.*
*[phosphorus31.org](https://phosphorus31.org) | CC BY-SA 4.0*
