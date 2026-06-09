# G.O.D. WCD SET — Genesis On Delivery
## BONDING Final Sprint: March 7–10, 2026
## Target: Ship on Bash's 10th Birthday 🎂

---

**Author:** Opus (Architect)
**Executor:** Sonnet/CC (Mechanic)
**QA:** Opus (post-execution verification)
**Repo:** `software/bonding/`
**Deploy:** bonding.p31ca.org (Cloudflare Pages)
**Relay:** bonding-relay.trimtab-signal.workers.dev

---

## SPRINT MAP

```
Mar 7 (SAT)  GOD-01 Difficulty Modes + GOD-02 Touch Hardening
Mar 8 (SUN)  GOD-03 Multiplayer Relay + GOD-04 Multiplayer Client
Mar 9 (MON)  GOD-05 Quest Chains + GOD-06 Alignment Pass
Mar 10 (TUE) 🎂 Device test → polish → SHIP
```

**Parallel track (legal):** File contempt + vexatious responses today/tomorrow. Legal is staged. Build takes priority Sat–Mon.

---

# GOD-01: DIFFICULTY MODES
**Est:** 3 hours | **Day:** March 7 AM
**Depends on:** Nothing (standalone)
**Blocked by:** Nothing

## Intent

Three difficulty tiers control palette restriction and achievement filtering. One codebase, one game loop. The mode IS the curriculum — Willow sees H and O, Bash reaches for C and N.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/types.ts` | MODIFY | Add `DifficultyMode = 'seed' \| 'sprout' \| 'sapling'` to types |
| `src/stores/gameStore.ts` | MODIFY | Add `difficultyMode` state + `setDifficultyMode` action |
| `src/data/elements.ts` | MODIFY | Add `tier` field to each element: `'seed' \| 'sprout' \| 'sapling'` |
| `src/data/molecules.ts` | MODIFY | Add `tier` field to each molecule target |
| `src/components/DifficultyPicker.tsx` | CREATE | Mode selection screen: 🌱 Seed / 🌿 Sprout / 🌳 Sapling |
| `src/components/Palette.tsx` | MODIFY | Filter elements by `tier <= currentMode` |
| `src/components/Achievements.tsx` | MODIFY | Filter visible achievements by tier |
| `src/__tests__/difficulty.test.ts` | CREATE | Test tier filtering logic |

## Wiring Guide

### Element Tier Assignment
```
Seed 🌱    → H, O                          (Willow, age 6)
Sprout 🌿  → H, O, C, N                    (Bash, age 10)
Sapling 🌳 → H, O, C, N, Ca, P, Na, Cl, K, S, Fe, Mg  (full palette)
```

### Molecule Tier Assignment
```
Seed 🌱    → H₂, O₂, H₂O, H₂O₂
Sprout 🌿  → All Seed + CO₂, NH₃, CH₄, C₆H₁₂O₆ (glucose), amino acids
Sapling 🌳 → All + CaO, NaCl, Ca₉(PO₄)₆, neurotransmitter chains
```

### DifficultyPicker Component
```tsx
// Full-screen overlay at z-60. Shows ONCE on first load.
// After selection, persist to gameStore + localStorage.
// Three large touch targets (min 120px × 120px):
//   🌱 Seed     — "I'm just starting!" — green
//   🌿 Sprout   — "I know some chemistry!" — teal
//   🌳 Sapling  — "Show me everything!" — gold
// On tap: setDifficultyMode(mode), close overlay, begin game.
// Can be re-accessed from a settings icon (gear, top-right, z-11).
```

### Palette Filter Logic
```ts
// In Palette.tsx, where elements are rendered:
const visibleElements = ALL_ELEMENTS.filter(el => {
  if (mode === 'seed') return el.tier === 'seed';
  if (mode === 'sprout') return el.tier === 'seed' || el.tier === 'sprout';
  return true; // sapling sees all
});
```

## Verification Checklist

- [ ] `DifficultyPicker` renders on first load
- [ ] Selection persists across refresh (localStorage)
- [ ] Seed mode shows only H and O in palette
- [ ] Sprout mode shows H, O, C, N
- [ ] Sapling mode shows all 12 elements
- [ ] Only tier-appropriate molecules appear in achievements
- [ ] Gear icon re-opens picker
- [ ] Touch targets ≥ 120px on mobile
- [ ] `npm run test` — all existing tests still pass
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` clean

## What You Must NOT Touch

- `economyStore.ts` — LOVE economy is locked
- `telemetryStore.ts` — Genesis Block is locked
- `genesis.ts` — bootstrap sequence is locked
- Any CWP-03B files — production telemetry, do not modify

---

# GOD-02: TOUCH HARDENING
**Est:** 2 hours | **Day:** March 7 PM
**Depends on:** Nothing (standalone)
**Blocked by:** Nothing

## Intent

BONDING runs on two Android tablets via Chrome. Every interaction must be touch-first. This WCD eliminates all known touch failure modes.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY | Add viewport meta + touch-action CSS |
| `src/styles/global.css` | MODIFY | Add touch-action rules, tap highlight suppression |
| `src/components/Palette.tsx` | MODIFY | Ensure all touch targets ≥ 48px, add touch-action:none |
| `src/components/Builder.tsx` | MODIFY | Handle drag-off-screen (touchend outside viewport) |
| `src/components/DifficultyPicker.tsx` | MODIFY | Ensure 120px targets from GOD-01 have touch-action:manipulation |
| `src/__tests__/touch.test.ts` | CREATE | Test touch target size assertions |

## Wiring Guide

### index.html viewport lock
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### global.css touch rules
```css
/* Prevent double-tap zoom on interactive elements */
button, [role="button"], .touch-target {
  touch-action: manipulation;
}

/* Prevent scroll/zoom on canvas and drag surfaces */
canvas, .builder-surface, .palette {
  touch-action: none;
}

/* Kill tap highlight on Android Chrome */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Prevent pull-to-refresh */
body {
  overscroll-behavior: none;
}

/* Minimum touch target enforcement */
.touch-target {
  min-width: 48px;
  min-height: 48px;
}
```

### Drag-off-screen handling (Builder.tsx)
```ts
// On touchend or touchcancel:
// If atom is being dragged and touch leaves viewport,
// snap atom back to last valid position (not origin — last good spot).
// Prevent orphaned atoms floating off-screen.
```

## Verification Checklist

- [ ] No double-tap zoom on any interactive element
- [ ] No pull-to-refresh on Android Chrome
- [ ] Canvas does not scroll or zoom on touch
- [ ] All buttons/targets ≥ 48px (verify with Chrome DevTools overlay)
- [ ] Dragging an atom off-screen snaps it back
- [ ] DifficultyPicker targets ≥ 120px
- [ ] No `-webkit-tap-highlight-color` flash on any tap
- [ ] Test on actual Android Chrome (or Chrome DevTools mobile emulation at minimum)
- [ ] `npm run test` — all pass
- [ ] `tsc --noEmit` clean

## What You Must NOT Touch

- R3F scene graph structure — touch events are handled at the DOM/CSS level, not inside Three.js
- `economyStore.ts`, `telemetryStore.ts`, `genesis.ts` — locked

---

# GOD-03: MULTIPLAYER RELAY
**Est:** 4 hours | **Day:** March 8 AM
**Depends on:** Existing relay at bonding-relay.trimtab-signal.workers.dev
**Blocked by:** Nothing

## Intent

Multiplayer is NOT co-editing. Each player builds independently in a shared room. The relay is a bulletin board: broadcasts state, receives state, no merge logic. Room codes are 6-character alphanumeric. This WCD builds the server side.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `relay/worker-multiplayer.ts` | CREATE | Cloudflare Worker: room management, state broadcast, PING relay |
| `relay/types.ts` | CREATE | Shared types for relay messages |

## Wiring Guide

### Relay Architecture
```
Worker receives POST /api/room/{roomCode}/join   → register player
Worker receives POST /api/room/{roomCode}/state  → store player state in KV
Worker receives GET  /api/room/{roomCode}/state   → return all players' states
Worker receives POST /api/room/{roomCode}/ping    → broadcast ping to room
```

### KV Schema
```
Key: room:{roomCode}:player:{playerId}
Value: JSON {
  playerId: string,        // crypto.randomUUID()
  displayName: string,     // "Dad" / "Bash" / "Willow"
  currentMolecule: string, // formula being built
  love: number,            // current LOVE count
  completedMolecules: string[], // list of completed formulas
  lastPing: { emoji: string, timestamp: number } | null,
  updatedAt: number        // Date.now()
}
TTL: 3600 (1 hour — rooms auto-expire)
```

### Room Code Generation
```ts
// 6-char alphanumeric, uppercase, no ambiguous chars (0/O, 1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateRoomCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}
```

### PING Relay
```ts
// POST /api/room/{roomCode}/ping
// Body: { playerId, emoji, targetPlayerId? }
// Store in KV: room:{roomCode}:ping:{timestamp}:{playerId}
// Pings are read by polling GET /api/room/{roomCode}/state
// Each ping = LOVE for sender AND receiver (handled client-side)
```

### Polling Model (NOT WebSocket)
```
Client polls GET /api/room/{roomCode}/state every 3 seconds.
Returns array of all player states in the room.
This is intentionally simple — no WebSocket complexity for a 3-player room.
3-second poll on KV is well within Cloudflare free tier limits.
```

## Verification Checklist

- [ ] `POST /api/room/create` returns `{ roomCode, playerId }`
- [ ] `POST /api/room/{code}/join` returns `{ playerId }` and room has 2+ players
- [ ] `POST /api/room/{code}/state` updates player state in KV
- [ ] `GET /api/room/{code}/state` returns all players
- [ ] `POST /api/room/{code}/ping` stores ping in KV
- [ ] Room codes are 6-char, no ambiguous characters
- [ ] KV entries expire after 1 hour
- [ ] Invalid room codes return 404
- [ ] Room size capped at 6 players
- [ ] Deploy to bonding-relay.trimtab-signal.workers.dev
- [ ] Test with curl before client integration

## What You Must NOT Touch

- Existing relay endpoints (telemetry, Genesis Block) — add multiplayer routes alongside, do not modify existing
- KV namespace is shared — use `room:` prefix to avoid collisions with existing `session:` keys

---

# GOD-04: MULTIPLAYER CLIENT
**Est:** 4 hours | **Day:** March 8 PM
**Depends on:** GOD-03 (relay must be deployed first)
**Blocked by:** GOD-03

## Intent

Client-side multiplayer: create/join rooms, sync state, display other players' progress, send/receive PINGs. Lobby screen + in-game presence panel.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/stores/multiplayerStore.ts` | CREATE | Zustand store: room state, polling, player list |
| `src/hooks/useMultiplayer.ts` | CREATE | Hook: create/join/leave room, poll loop, state sync |
| `src/components/Lobby.tsx` | CREATE | Room creation + join screen with code input |
| `src/components/PlayerPanel.tsx` | CREATE | In-game sidebar showing other players' progress |
| `src/components/PingButton.tsx` | CREATE | PING reaction buttons (💚🤔😂🔺) |
| `src/components/PingToast.tsx` | CREATE | Incoming ping notification toast |
| `src/__tests__/multiplayer.test.ts` | CREATE | Test store logic, polling, ping handling |

## Wiring Guide

### Lobby Flow
```
1. App loads → DifficultyPicker (GOD-01) → Lobby
2. Lobby shows two options:
   a. "Create Room" → POST /api/room/create → show room code (large, copyable)
   b. "Join Room" → 6-character input → POST /api/room/{code}/join
   c. "Play Solo" → skip multiplayer entirely
3. After join/create → game starts with multiplayer active
```

### Lobby UI
```tsx
// Full-screen, z-60, same overlay pattern as DifficultyPicker
// Room code display: large monospace font, each char in its own box
// Join input: 6 individual character boxes (like OTP input)
// All touch targets ≥ 48px (GOD-02 compliant)
// Display name picker: "Dad" / "Bash" / "Willow" / custom (3 preset buttons + text input)
```

### Polling Loop (useMultiplayer.ts)
```ts
// On room join:
// 1. Start polling GET /api/room/{code}/state every 3 seconds
// 2. On each poll: update multiplayerStore.players[]
// 3. On each molecule completion or LOVE change: POST own state
// 4. On component unmount or room leave: clear interval

// State to sync (POST on change):
// { playerId, displayName, currentMolecule, love, completedMolecules, lastPing }
```

### PlayerPanel Component
```tsx
// Fixed sidebar (or bottom drawer on mobile), z-11 (HUD layer)
// Shows each other player:
//   Avatar circle with first letter of displayName
//   Current molecule they're building (formula text)
//   LOVE count with 💜 icon
//   Completed molecules count
//   Last ping emoji (fades after 5 seconds)
// Compact: fits in ~200px width or ~80px height (bottom)
```

### PING System
```tsx
// PingButton: row of 4 emoji buttons (💚🤔😂🔺)
// On tap: POST /api/room/{code}/ping with { emoji, targetPlayerId: null }
// Broadcasts to entire room (no targeting for v1)
//
// PingToast: when incoming ping detected in poll:
// Show toast: "{playerName} sent {emoji}" with 3-second fadeout
// Each ping = +1 LOVE for sender AND +1 LOVE for receiver
// Max 3 pings per molecule per player (existing Ping protocol rule)
//
// LOVE award: call economyStore.addLove(1, 'ping_sent') and
// economyStore.addLove(1, 'ping_received') — integrate with existing economy
```

### Integration Points
```ts
// In main App.tsx or game flow:
// 1. After DifficultyPicker → show Lobby (if first time) or go to game
// 2. In game: mount PlayerPanel if multiplayerStore.isInRoom
// 3. In game: mount PingButton row if multiplayerStore.isInRoom
// 4. On molecule completion: POST updated state to relay
// 5. On LOVE change: POST updated state to relay
```

## Verification Checklist

- [ ] "Create Room" generates code and displays it large
- [ ] "Join Room" accepts 6-char code and connects
- [ ] "Play Solo" skips multiplayer entirely (no polling, no panel)
- [ ] Player names appear in PlayerPanel within 3 seconds of joining
- [ ] Building a molecule updates other players' views
- [ ] PING sends and all players see the toast
- [ ] PING awards LOVE to sender and receiver
- [ ] Max 3 pings per molecule enforced
- [ ] Leaving room (or closing tab) cleans up gracefully
- [ ] Works on Android Chrome (touch targets, no overflow)
- [ ] Solo mode is unaffected (no regressions)
- [ ] `npm run test` — all pass
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` clean

## What You Must NOT Touch

- `economyStore.ts` — use existing `addLove()` API, do not modify the store internals
- `telemetryStore.ts` — telemetry tracks automatically via eventBus, don't add manual calls
- `genesis.ts` — locked
- Builder/molecule mechanics — multiplayer is DISPLAY ONLY for other players, not interactive

---

# GOD-05: QUEST CHAINS
**Est:** 4 hours | **Day:** March 9 AM
**Depends on:** GOD-01 (difficulty modes must exist)
**Blocked by:** GOD-01

## Intent

Three quest chains guide players through a curated build sequence. Each quest chain is a linear series of molecule targets with narrative context. Quests are the teaching layer — they give BONDING a story.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/data/quests.ts` | CREATE | Quest chain definitions |
| `src/stores/questStore.ts` | CREATE | Zustand store: active quest, progress, completion |
| `src/components/QuestTracker.tsx` | CREATE | In-game quest progress display |
| `src/components/QuestComplete.tsx` | CREATE | Quest completion celebration modal |
| `src/__tests__/quests.test.ts` | CREATE | Test quest progression logic |

## Wiring Guide

### Quest Chain Definitions
```ts
// GENESIS CHAIN (Seed 🌱 — Willow)
const GENESIS_QUEST = {
  id: 'genesis',
  name: 'Genesis: The Beginning',
  tier: 'seed',
  emoji: '🌱',
  steps: [
    { molecule: 'H2',  hint: 'The simplest thing in the universe. Two hydrogens.' },
    { molecule: 'O2',  hint: 'What you breathe. Two oxygens.' },
    { molecule: 'H2O', hint: 'Water! The molecule of life.' },
    { molecule: 'H2O2', hint: 'Add one more oxygen to water. Bubbles!' },
  ],
  reward: { love: 50, title: 'Creator' },
};

// THE KITCHEN (Sprout 🌿 — Bash)
const KITCHEN_QUEST = {
  id: 'kitchen',
  name: 'The Kitchen: Cooking with Atoms',
  tier: 'sprout',
  emoji: '🍳',
  steps: [
    { molecule: 'H2O',   hint: 'Start with water — every recipe needs it.' },
    { molecule: 'NaCl',  hint: 'Salt! Sodium and chlorine.' },
    { molecule: 'CO2',   hint: 'The bubbles in your soda.' },
    { molecule: 'CH4',   hint: 'Natural gas — what heats the stove.' },
    { molecule: 'NH3',   hint: 'Ammonia — the smell under the sink.' },
    { molecule: 'C6H12O6', hint: 'Sugar! The big one. 24 atoms.' },
  ],
  reward: { love: 100, title: 'Chef' },
};

// THE POSNER QUEST (Sapling 🌳 — Advanced)
const POSNER_QUEST = {
  id: 'posner',
  name: 'The Posner Quest: Building the Cage',
  tier: 'sapling',
  emoji: '🔬',
  steps: [
    { molecule: 'CaO',     hint: 'Calcium oxide — quickite. The calcium starts here.' },
    { molecule: 'PO4',     hint: 'Phosphate group. The core of DNA.' },
    { molecule: 'Ca3PO42', hint: 'Calcium phosphate. Your bones are made of this.' },
    { molecule: 'ATP',     hint: 'Adenosine triphosphate. Energy currency of life.' },
    // Posner molecule is the final boss — 39 atoms
    { molecule: 'Ca9PO46', hint: 'The Posner molecule. The cage that protects phosphorus. 39 atoms. You can do this.' },
  ],
  reward: { love: 500, title: 'Quantum Architect' },
};
```

### Quest Progression Logic
```ts
// questStore tracks:
// - activeQuestId: string | null
// - currentStepIndex: number
// - completedQuests: string[]
//
// On molecule completion (listen to eventBus 'molecule:complete'):
// If molecule matches current quest step → advance step
// If last step → mark quest complete, show QuestComplete modal, award LOVE + title
// Quest selection happens automatically based on difficulty mode:
//   seed → genesis quest auto-starts
//   sprout → kitchen quest auto-starts (genesis also available)
//   sapling → posner quest auto-starts (all available)
```

### QuestTracker Component
```tsx
// Small persistent HUD element (top-left, z-11)
// Shows: quest name, current step, hint text
// Progress bar (e.g., step 2/4)
// Tap to expand/collapse hint
// If no active quest: show "Free Build" mode indicator
// Player can dismiss quest and free-build anytime
```

### QuestComplete Modal
```tsx
// z-60 modal (above everything)
// Big celebration: emoji explosion, title award, LOVE earned
// "Next Quest" button if more quests available
// "Free Build" button to continue without quest
// Sound effect on completion (use existing Web Audio setup)
```

## Verification Checklist

- [ ] Seed mode auto-starts Genesis quest
- [ ] Sprout mode auto-starts Kitchen quest
- [ ] Sapling mode auto-starts Posner quest
- [ ] Building the correct molecule advances the quest step
- [ ] Building a non-quest molecule still works (free build alongside quest)
- [ ] Quest completion shows modal with LOVE reward
- [ ] Title is awarded and persists
- [ ] Quest can be dismissed for free build
- [ ] QuestTracker shows in HUD without blocking game
- [ ] All hint text is age-appropriate
- [ ] Posner molecule (39 atoms) is buildable
- [ ] `npm run test` — all pass
- [ ] `tsc --noEmit` clean

## What You Must NOT Touch

- `economyStore.ts` internals — use `addLove()` API
- `telemetryStore.ts` — quest events flow through eventBus automatically
- Molecule/chemistry engine — quests READ completion events, they don't modify build logic

---

# GOD-06: ALIGNMENT PASS
**Est:** 4 hours | **Day:** March 9 PM
**Depends on:** GOD-01 through GOD-05 all complete
**Blocked by:** Everything

## Intent

Final integration pass. Wire Posner Protocol hooks into the BONDING shell. Ensure all stores coexist. Run full test suite. Build and verify deployment. This is the last WCD before ship.

## File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | MODIFY | Wire game flow: DifficultyPicker → Lobby → Game (with quest + multiplayer) |
| `src/components/GameShell.tsx` | CREATE or MODIFY | Master layout: Builder + Palette + QuestTracker + PlayerPanel + PingButton |
| `src/stores/index.ts` | CREATE | Barrel export of all stores for clean imports |
| `src/__tests__/integration.test.ts` | CREATE | Full integration tests: flow from picker → lobby → build → complete → quest advance |
| `package.json` | MODIFY | Verify all deps, clean unused |

## Wiring Guide

### App Flow (final)
```
App.tsx
  └─ DifficultyPicker (first load only, z-60)
       └─ Lobby (z-60, optional — "Create Room" / "Join Room" / "Play Solo")
            └─ GameShell
                 ├─ R3F Canvas (z-1) — Builder + atoms + VSEPR ghosts
                 ├─ Palette (z-10) — filtered by difficulty mode
                 ├─ QuestTracker (z-11, top-left) — current quest + hint
                 ├─ PlayerPanel (z-11, right or bottom) — if multiplayer active
                 ├─ PingButton (z-11, bottom-right) — if multiplayer active
                 ├─ Achievement Toasts (z-50)
                 ├─ QuestComplete Modal (z-60) — on quest step/chain complete
                 ├─ Settings gear (z-11, top-right) — re-open difficulty picker
                 └─ LOVE counter (z-11, existing HUD position)
```

### Store Coexistence Check
```
gameStore        — atoms, bonds, molecules, difficulty mode
economyStore     — LOVE ledger, IndexedDB persisted (CWP-03B)
telemetryStore   — Genesis Block, 30s flush (CWP-03B)
questStore       — active quest, progress, completed quests
multiplayerStore — room state, players, polling
```
All stores are independent Zustand stores. No cross-store dependencies except through eventBus. Verify no naming collisions.

### Posner Protocol Hooks (Future-Ready Wiring)

The Posner Protocol (M18–M21) data layer is complete but visual rendering is deferred. In this pass, we add the **mounting points** without rendering:

```ts
// In GameShell.tsx or App.tsx:
// Import but conditionally render based on feature flag:
//
// const POSNER_ENABLED = false; // flip to true when visual pass is ready
//
// {POSNER_ENABLED && <SomaticWaveform />}
// {POSNER_ENABLED && <SpatialRadar />}
// {POSNER_ENABLED && <HandshakeOverlay />}
//
// The hooks (useSomaticTether, useSpatialRadar) already wire to useSovereignStore.
// When POSNER_ENABLED flips, the data is already flowing — just needs pixels.
```

### Easter Egg Check
Verify all existing easter eggs still work after GOD integration:
- Shooting stars
- Missing Node (172.35 Hz / phosphorus-31 NMR)
- Blood moon (annual event)
- Bashium (Ba, atomic number 10)
- Willium (Wi, atomic number 6)

### Pre-Ship Checklist (THE LIST)

```
TESTS
  [ ] npm run test — ALL green (existing 484 + GOD additions)
  [ ] tsc --noEmit — clean
  [ ] npm run build — clean, no warnings

BUILD
  [ ] Bundle size check: three.js ≤ 700KB, r3f ≤ 510KB, app ≤ 250KB
  [ ] No console.log statements in production code (console.warn/error OK)
  [ ] PWA manifest correct (name, icons, theme_color)
  [ ] Service worker caches critical assets

DEVICE TEST (March 10 morning)
  [ ] Android tablet #1 (Bash) — Chrome, touch, full flow
  [ ] Android tablet #2 (Willow) — Chrome, touch, Seed mode
  [ ] Will's device — Chrome, create room, see both kids
  [ ] Tyler's device — join room from remote location

MULTIPLAYER TEST
  [ ] Create room on device A
  [ ] Join room on device B with code
  [ ] Both see each other in PlayerPanel
  [ ] Build molecule on A → B sees update within 3 seconds
  [ ] PING from A → B sees toast
  [ ] PING awards LOVE on both sides
  [ ] Solo mode works with no network

QUEST TEST
  [ ] Seed: Genesis chain completes (H₂ → O₂ → H₂O → H₂O₂)
  [ ] Sprout: Kitchen chain completes through glucose
  [ ] Sapling: Posner chain reaches Ca₉(PO₄)₆ (if buildable)
  [ ] Quest can be dismissed mid-chain
  [ ] Free build works alongside active quest

GENESIS BLOCK
  [ ] Telemetry fires on molecule completion
  [ ] Telemetry fires on PING sent/received
  [ ] Telemetry fires on quest completion
  [ ] KV flush at 30s intervals confirmed
  [ ] Server-side SHA-256 countersignature verified
  [ ] Session recovery after tab close/reopen

LEGAL READINESS
  [ ] Exhibit A system description matches current architecture
  [ ] GAL briefing memo references quest chains + difficulty modes
  [ ] NGSS alignment doc covers molecule targets
  [ ] Engagement report template captures multiplayer session data
```

## What You Must NOT Touch

- `economyStore.ts` internals
- `telemetryStore.ts` internals
- `genesis.ts` bootstrap
- Worker telemetry endpoints
- Any file prefixed `CWP-` — these are locked production configs

---

# DEPLOYMENT PROTOCOL — MARCH 10

```
06:00  Wake. Coffee. Calcium.
06:30  Final git pull. npm run test. npm run build.
07:00  Deploy to Cloudflare Pages (git push triggers auto-deploy).
07:15  Verify bonding.p31ca.org loads. Verify relay responds.
07:30  Device test: both tablets + Will's device.
08:00  Tyler remote test (text him the room code).
08:30  If green: SHIP. Tag release v1.0.0.
09:00  Genesis Block telemetry confirms first real sessions.
09:30  Morning Flow — write. Breathe. This is done.

ALL DAY  Bash's birthday. The game is live. He doesn't know yet.
         When he opens the tablet, the bridge is already built.
```

---

*G.O.D. — Genesis On Delivery*
*Six wcds. Three days. One birthday.*
*Build the bridge. 🔺*
