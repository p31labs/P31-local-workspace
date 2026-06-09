# P31 ANDROMEDA — Technical Spec Sheet
### Phosphorus-31 Labs | March 7, 2026

---

## Platform Overview

P31 Andromeda is a neurodivergent-first operating system comprising two production applications deployed on Cloudflare infrastructure:

| Product | Domain | Purpose |
|---------|--------|---------|
| **Spaceship Earth** | p31ca.org | Cognitive dashboard + sovereign cockpit OS |
| **BONDING** | bonding.p31ca.org | Multiplayer chemistry education game |
| **Bonding Relay** | bonding-relay.trimtab-signal.workers.dev | Real-time multiplayer Worker API |

---

# SPACESHIP EARTH

## Architecture

- **Stack**: React 18.3 + Three.js r159 (R3F 8.15 + Drei 9.88) + Zustand 4.4 + Vite 5.4 + TypeScript 5.5 (strict)
- **Rendering**: WebGL canvas (z-0) + DOM overlays (z-10 through z-60), bloom post-processing
- **State**: Zustand curried store (100+ actions) + React Context bridge (NodeContext)
- **Deploy**: Cloudflare Pages (static) + Cloudflare Worker (telemetry relay)
- **Tests**: 115/115 passing (7 suites, Vitest)

## Dual-View System

| View | Engine | Use Case |
|------|--------|----------|
| **Immersive Cockpit** | Three.js 3D canvas + DOM overlays | Daily driving, room navigation |
| **Classic Diagnostic** | 2D terminal grid (3x2 system cards) | Dev/ops introspection |

Toggle between views at any time. ESC key navigates back. P31-OS logo returns home.

## The Nine Rooms

### 1. Observatory — Geodesic Command Center
- Subdivision-2 icosphere (80 triangular faces), each face = a data node
- Click faces to drill into node state; filter by status (countdown/active/deployed/complete) and bus type (vital/AC/DC)
- CSS2DRenderer labels, bloom pipeline, dust motes, edge pulse animation, aurora shader

### 2. Collider — Particle Physics Engine
- Newtonian physics simulation with proximity-triggered VSEPR bonding
- Two modes: **Drift** (passive bonding) and **Cyclotron** (accelerated collision)
- 5-20 LOVE per successful molecule synthesis

### 3. Bonding — Multiplayer Chemistry Game
- Iframe-isolated instance of the BONDING game (separate IndexedDB genesis block)
- Relay sync for co-presence; every atom/ping = timestamped engagement evidence

### 4. Bridge — LOVE Economy Dashboard
- L.O.V.E. = Ledger of Ontological Volume and Entropy
- Ring gauges: balance, rate, tier (REFLEX/PATTERN/FULL)
- Tabs: LOVE | Wallet (Phenix integration) | Stealth | Ledger (Automerge CRDT) | Hardware (BLE/LoRA)
- Earn formula: `SUM(T_proximity x Q_resonance) + Tasks_verified` with 24h half-life decay

### 5. Buffer — Voltage Processor + Breathing
- **Samson V2 PID Controller**: Target attractor H = pi/9, Kp=1.0, Ki=0.1, Kd=0.3
- **Voltage Detection**: NLP regex scoring Urgency, Emotion, Complexity (1-10 each)
- **PA Detection**: 13 passive-aggressive linguistic patterns
- **Fawn Guard**: Activates on sustained biometric stress (HR > baseline x 1.20, HRV < baseline x 0.85 for 10s+). Drains 2 spoons, 3-minute cooldown
- **Breathing Exercise**: 4-2-6 cadence (inhale-hold-exhale), max 3 cycles, minimal visual (single scaling circle + phase color). Note: Buffer uses 4-2-6 (12s clinical cycle); BONDING atom pulsing uses 4-4-6 (14s relaxation cycle) — intentional difference.

### 6. Copilot / Brain — Centaur Engine
- LLM-powered AI agent (Claude Sonnet 4 or Gemini 1.5 Pro, configurable)
- Jitterbug compiler: parses vibe-code, emits React components into dynamic module slots
- Real-time markdown output + error tracing

### 7. Landing — QG-IDE (Quantum Geodesic IDE)
- In-browser code editor with tabs: Code | View | Terminal | Copilot | PHX | Files
- localStorage-backed file persistence
- Default modules: SIC-POVM, QuantumTetrahedron, quantum measurement theory

### 8. Resonance — Conversation-to-Music Engine
- Base frequency: 172.35 Hz (derived from P-31 NMR frequency 17.235 MHz)
- Phosphorus pentatonic scale (intervals: 0, 2, 4, 7, 9 semitones), 3 octaves
- Text analysis: word count -> velocity, vowel density -> timbre, emotion -> pitch shift
- 7 mood classifications: warm, curious, vulnerable, joyful, pain, calm, urgent

### 9. Forge — Content Pipeline
- Seed bank for written ideas: seed -> draft -> review -> published
- Pre-built framework snippets (Posner Molecule, Wye-Delta, Tetrahedron Protocol, Spoon Theory, Centaur Protocol, LOVE Economy)
- Future: direct Substack export

## Protocols

### M18: Somatic Tether (Biometrics)
- WebSocket connection to ESP32-S3 hardware or Termux bridge @ ws://localhost:8080
- 1 Hz sampling into circular buffers (300-sample calibration window, 120-sample rolling waveform)
- State machine: disconnected -> calibrating (5 min) -> active -> stress
- Stress detection: HR > baseline x 1.20 AND HRV < baseline x 0.85 for 10s+
- Triggers fawn guard activation + spoon drain

### M19: Reactor Core (Mint Engine)
- Ed25519 signature collection from both devices
- K4 graph edge creation: `{ from: didA, to: didB, timestamp, signature }`
- State machine: idle -> collecting-signatures -> minting -> success/error

### M20: Spatial Mesh (BLE Radar)
- Web Bluetooth API primary, WebSocket bridge fallback, graceful degradation
- RSSI zones: immediate (< 1m, > -50dBm), near (1-10m), far (10-30m), lost
- EMA-smoothed signal strength (alpha = 0.3), 2s prune cycle for stale nodes

### M21: K4 Handshake (Rhythm Consensus)
- Two devices achieve impedance matching via 86 BPM synchronized tapping
- Tolerance: +/- 80ms per beat interval (697ms target)
- 4 valid taps required, 2s lock window, 30s timeout
- Phase machine: tapping -> locked -> waiting -> bonded/failed
- Audio: 600 Hz sine metronome, pitch sweep on lock, chord flourish on bond

## Spoon Theory Energy System

| Tier | Color | Spoons | State |
|------|-------|--------|-------|
| REFLEX | #FF4444 (red) | Low | Hyper-vigilance, minimal reserve |
| PATTERN | #FFD700 (amber) | Mid | Moderate function, task-aware |
| FULL | #00FFFF (cyan) | High | Optimal engagement, full capacity |

- Max 12 spoons. Drained by fawn guard (2 per trigger). 30s hysteresis on tier downgrades (prevents flicker).
- SpoonGauge: gradient fill bar + numerator/denominator + tier label + LOVE counter

## Visual Design Language

- **Background**: OLED-black void (#000000)
- **Primary**: Cyan #00FFFF (most UI elements, Observatory, status)
- **Secondary**: Magenta #FF00FF (Bridge, K4, accents)
- **Tertiary**: Violet #BF5FFF (Centaur, Identity)
- **Quaternary**: Amber #FFD700 (data, Buffer, warnings)
- **Glass Morphism**: backdrop-blur(12-24px), border white/12%, inset glow
- **Fonts**: Oxanium (display), Space Mono (data/telemetry)
- **Bloom**: luminanceThreshold=1.0, strength=0.8, radius=0.6 (selective neon glow)

## Boot Sequence

1. GlassBox lock screen (Lorenz-like attractor, RK4 integrator)
2. User stabilizes H -> 0.35, Q -> 4.0 to unlock
3. PWA bootstrap + service worker registration
4. Protocol initialization (M18/M20/M21/Genesis)
5. Store hydration from NodeContext
6. Coherence auto-recovery loop (500ms)

---

# BONDING — Chemistry Education Game

## Architecture

- **Stack**: Vite 5.4 + React 18.3 + Three.js r170 (R3F 9 + Drei 10 + Postprocessing) + Zustand 5 + Tailwind 4 + TypeScript (strict)
- **PWA**: vite-plugin-pwa, service worker auto-update, manifest.json, offline via IndexedDB
- **Relay**: Cloudflare Worker + KV store
- **Tests**: 328 passing (21 suites, Vitest)
- **Target**: Android Chrome tablets (2x kids) + desktop (parent)

## Game Modes

| Mode | Player | Elements | Hero Goal | LOVE |
|------|--------|----------|-----------|------|
| Seed | Willow (age 6) | H, O | H2O2 | Base |
| Sprout | Bash (age 10) | H, C, N, O | C6H12O6 (Glucose) | 1.5x |
| Sapling | Will / Advanced | All 11 + 2 easter eggs | CO3Ca (Calcium Carbonate) | 2x |

## Periodic Table: 11 Core Elements + 2 Easter Eggs (13 Total)

### Core Elements

| Sym | Name | Valence | Color | Freq | Size |
|-----|------|---------|-------|------|------|
| H | Hydrogen | 1 | #AAE0FF | 523 Hz (C5) | 0.25 |
| C | Carbon | 4 | #22CC55 | 262 Hz (C4) | 0.45 |
| N | Nitrogen | 3 | #2288FF | 247 Hz (B3) | 0.42 |
| O | Oxygen | 2 | #FF2244 | 330 Hz (E4) | 0.40 |
| Na | Sodium | 1 | #FFBB22 | 196 Hz (G3) | 0.50 |
| P | Phosphorus | 3 | #AA44FF | 172 Hz (F3) | 0.48 |
| Ca | Calcium | 2 | #BBDDFF | 147 Hz (D3) | 0.65 |
| Cl | Chlorine | 1 | #22FF44 | 185 Hz | 0.99 |
| S | Sulfur | 2 | #FFEE22 | 220 Hz | 1.04 |
| Fe | Iron | 3 | #FF5533 | 110 Hz | 1.26 |
| Mn | Manganese | 2 | #FF66AA | 131 Hz (C3) | 1.17 |

### Easter Egg Elements

| Sym | Name | Valence | Color | Unlock Condition |
|-----|------|---------|-------|-----------------|
| Ba | Bashium | 4 | #CC55FF | Complete Genesis quest in Seed mode |
| Wi | Willium | 3 | #44EE88 | Complete Kitchen quest in Sprout mode |

## Chemistry Engine (VSEPR)

- **Drag-drop**: 20px activation threshold, 40px edge dead zone, directional lock on touch
- **Bond Sites**: Ghost spheres positioned by VSEPR geometry (tetrahedral/trigonal/linear/bent)
- **Snap Mechanic**: Atom dragged over ghost site triggers bond formation
- **Stability**: filledBonds / totalValence (0.0 -> 1.0); molecule complete when all sites filled
- **Formula**: Hill system ordering (C first, H second, alphabetical rest) with Unicode subscripts
- **Known Molecules**: 82 defined compounds across all three tiers

## Quest Chains (5)

| Quest | Mode | Steps | Final Target | LOVE |
|-------|------|-------|-------------|------|
| Genesis | Seed+ | 4 | H2O2 | 50 |
| Kitchen | Sprout+ | 5 | C2H6 (Ethane) | 75 |
| Posner | Sapling | 5 | O24P6Ca9 (Posner Molecule) | 200 |
| Forge | Sapling | 4 | OFe (Wustite) | 100 |
| Lab | Sapling | 5 | HNO3 (Nitric Acid) | 125 |

Steps advance on checkpoint fire (Hill-system formula match), not molecule completion.

## Achievement System

- **41 achievements** across 8 categories
- Categories: First Steps, Common Molecules, Complex Molecules, The Ultimate, Meta, New Elements, WCD-16 Additions, Element 25
- LOVE awards: 10-500 per achievement
- Trigger types: first_atom, formula match, atom_count, molecule_count, time_under, ping_count, element_diversity, full_palette, novel_molecule
- Hidden achievements: bone_builder, the_posner, discovery, version_one

## Sound System (Web Audio API, Zero Samples)

| Sound | Trigger | Implementation |
|-------|---------|---------------|
| Element Tone | Atom placed | Triangle wave @ element frequency, 0.7s decay |
| Bond Interval | Bond formed | Two-note sine+triangle stagger, 1.1s decay |
| Completion Chord | Molecule done | Ascending arpeggio + all-element sustain + 863 Hz Larmor signature |
| Achievement | Unlock | C5-E5-G5-C6 ascending arpeggio |
| LOVE Chime | Tokens earned | Dynamic pitch bell (660 + amount x 3 Hz) |
| Ping (4 types) | Emoji reaction | Heart=rising, Thinking=wobble, Laugh=trill, Alert=falling |
| Quest Step | Step advance | C5+E5 gentle chime |
| Quest Complete | Chain done | C5-E5-G5-C6-E6 triumphant arpeggio |

## Multiplayer System

### Relay API (Cloudflare Worker + KV)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /room/create | POST | Create room, return code + playerId |
| /room/{code} | GET | Fetch room state |
| /room/{code}/join | POST | Join as guest |
| /room/{code}/push | POST | Sync player state |
| /room/{code}/ping | POST | Send emoji + text message |
| /room/{code}/ping | GET | Fetch new pings |
| /room/{code}/leave | POST | Exit room |

### Lobby Flow
- Host: name + color (6 options) + difficulty -> Start Room -> 6-char code + QR
- Guest: enter code + name + color -> Join -> auto-difficulty from host
- Polling: 5s interval, 200ms debounced auto-push via Zustand subscription
- Fallback: localStorage mock relay when VITE_RELAY_URL empty (two-tab local testing)

### Connection States
- Connected (green): polling active, < 5s latency
- Reconnecting (amber): exponential backoff 5s -> 30s
- Disconnected (red): network down > 30s, continues locally

## Exhibit A Logger (Engagement Ledger)

10 event types tracked to IndexedDB with timestamps:
`atom_placed`, `bond_formed`, `molecule_completed`, `achievement_unlocked`, `ping_sent`, `ping_received`, `message_sent`, `message_received`, `quest_step_completed`, `quest_completed`

Export: JSON download or clipboard summary with session stats (molecules, atoms, LOVE, duration, unique elements).

Purpose: timestamped evidence of parent-child co-presence for legal proceedings.

## LOVE Economy

| Action | LOVE Earned |
|--------|-------------|
| Atom placed | 1 |
| Bond formed | 2 |
| Molecule completed | 10 |
| Achievement unlock | 10-500 |
| Quest completion | 50-200 (2x multiplier) |

Persisted via IndexedDB (economyStore). Hydrated on app load.

## Touch / Mobile

- Pointer events (not touch events) for cross-device support
- 20px drag threshold, directional lock (vertical > horizontal on touch)
- Tap-to-preview: ghost bond sites shown for 3s
- Haptic feedback via navigator.vibrate() (toggle in TopBar)
- Safe area insets for notch/status bar
- Portrait-locked via manifest

## UI Components

- **TopBar**: Mode emoji + multiplayer status + mute toggle | "BONDING" title | LOVE counter + streak
- **ElementDock**: Horizontal scrolling palette, filtered by mode, momentum scroll on iOS
- **CommandBar**: Ping reactions + stability meter + difficulty selector
- **QuestHUD**: Active quest + step progress (collapses on mobile)
- **RoomSidebar**: Remote player cards (name, formula, stability, breathing) + ping log
- **AchievementToast**: Centered, auto-dismiss, variants: standard/discovery/hero
- **Boot Sequence**: Fire animation, "BONDING v1.0", birthday check

## Special Features

- **Coherence Window**: Background shifts #000000 -> #050308 over 37 minutes (P31 biofield resonance)
- **Discovery System**: Novel molecules (not in known set) trigger naming modal + 100 LOVE
- **Blood Moon**: Easter egg overlay with vignette + crimson breathing haze
- **Gallery**: Persistent saved molecules by formula

---

# Infrastructure

| Service | Provider | Config |
|---------|----------|--------|
| Spaceship Earth (static) | Cloudflare Pages | p31ca project |
| Bonding (static + PWA) | Cloudflare Pages | bonding project |
| Bonding Relay (API) | Cloudflare Workers | bonding-relay + KV |
| Spaceship Relay (API) | Cloudflare Workers | spaceship-relay + KV |
| DNS | Cloudflare | p31ca.org, bonding.p31ca.org |
| Source Control | GitHub | P31_Andromeda monorepo |

## Build Output

| Product | Bundle Size | Gzip | Chunks |
|---------|------------|------|--------|
| Spaceship Earth | 1,018 kB JS + 14 kB CSS | 286 kB + 4 kB | 1 (no code split) |
| Bonding | 1,449 kB JS + 54 kB CSS | 435 kB + 10 kB | 6 (three/r3f/react split + lazy modals) |

## Monorepo Packages

| Package | Path | Purpose |
|---------|------|---------|
| @p31/shared | packages/shared | Quantum shaders, sovereign PWA bootstrap, common types |
| @p31/node-zero | packages/node-zero | Identity boot, state axis management |
| @p31/love-ledger | packages/love-ledger | LOVE token economy, vesting |
| @p31/game-engine | packages/game-engine | Quests, challenges, player progress |
| @p31/sovereign | packages/sovereign | Vault sync, Daubert export, CRDT |

---

*Built by P31 Labs. Deployed March 7, 2026.*
*TypeScript strict. Zero samples. Every atom is evidence.*
