# 🧬 BONDING: THE MOLECULE BUILDER
## Manufacturing Order — Ship Date: March 3, 2026
## Playtester: Sebastian "Bash" Johnson, turning 10

---

## WHAT THIS IS

A turn-based molecule builder where a parent and child take turns placing voxel atoms on a 3D canvas and forming bonds. Real chemistry. Real sounds. Real beauty. Every turn is a timestamped moment of connection.

This is not an educational game disguised as fun. This is a fun game that happens to teach chemistry. The kid who builds water (H₂O) doesn't know they just learned about valence bonds. They know they made something glow and heard a chord.

---

## THE EXPERIENCE (What Bash Sees)

### First Load
Dark space. A single carbon atom floats in the center — chunky, voxel-style, warm green glow. It slowly rotates. Four ghostly bond sites pulse around it (carbon has 4 bonds). Soft ambient tone (262 Hz, C4).

Text appears: **"Place your first atom."**

A periodic table strip sits at the bottom — 6 elements, each a colored voxel cube with its symbol. Tap one. It lights up in your hand. Tap a bond site on the carbon. SNAP. The atom locks in. Its note plays. The bond glows. A line of light connects them.

**"Your turn is over. Ping your partner!"**

### The Turn Loop
1. Pick an element from the palette
2. Rotate the molecule (touch/drag) to find an open bond site
3. Tap the bond site to place your atom
4. Hear the notes — placement note + bond interval
5. See the stability meter climb
6. Hit PING to notify your partner
7. Watch their atom appear on your screen next turn

### Molecule Complete
When all valences are satisfied:
- The molecule pulses with light
- The FULL CHORD plays (all element notes together)
- The molecule gets a personality and starts MOVING
- Achievement unlocked
- LOVE tokens earned
- "Build another?"

---

## THE 6 ELEMENTS (Phase 1)

| Element | Symbol | Color | Valence | Frequency | Note | Voxel Style |
|---------|--------|-------|---------|-----------|------|-------------|
| Hydrogen | H | White/Ice Blue | 1 | 523 Hz | C5 | Tiny cube, bright glow |
| Carbon | C | Forest Green | 4 | 262 Hz | C4 | Medium cube, warm glow |
| Oxygen | O | Crimson Red | 2 | 330 Hz | E4 | Medium cube, pulsing glow |
| Sodium | Na | Gold/Amber | 1 | 196 Hz | G3 | Medium cube, metallic sheen |
| Phosphorus | P | Electric Purple | 3* | 172 Hz | F3 | Medium cube, volatile flicker |
| Calcium | Ca | Silver/Pearl | 2 | 147 Hz | D3 | Large cube, steady glow |

*Phosphorus valence simplified to 3 for gameplay (most common bonding state).

---

## VOXEL RENDERING

### Visual Style: "Minecraft meets molecular modeling"
- Each atom is a **rounded voxel cube** (box geometry with slight bevel/chamfer)
- Atoms have an **inner glow** (emissive material + bloom post-processing)
- Bond connections are **glowing beam geometry** between atom centers
- Bond sites (unfilled) are **ghost cubes** — translucent, slowly pulsing, slightly smaller
- Molecule rotates in space — player can orbit/zoom with touch or mouse
- Background: deep space dark (#0a0a1a) with subtle star particles
- Each element has its own glow color that tints nearby space

### Rendering Stack
- **Three.js r128** via React Three Fiber (@react-three/fiber + @react-three/drei)
- **Bloom post-processing** via @react-three/postprocessing (UnrealBloomPass)
- **Box geometry** with rounded edges for voxel atoms (RoundedBoxGeometry from drei)
- **Line geometry** for bonds (MeshLine or simple cylinder geometry)
- **Instanced meshes** if performance matters (unlikely at 6-20 atoms)

### Camera
- Orbit controls (touch-friendly for mobile/tablet)
- Auto-rotate when idle (slow, cinematic)
- Snap to front when placing atom (ease transition)
- Pull out to show full molecule on completion

---

## SOUND DESIGN

All Web Audio API. Zero audio files. Everything synthesized.

### Atom Placement
- Triangle wave at element frequency
- 200ms attack, 500ms decay
- Slight detuning (+2 cents) for warmth
- Reverb tail (ConvolverNode or simple delay feedback)

### Bond Formation
- Both element notes play as an interval
- Staggered by 50ms (bottom note first)
- Sine wave base + triangle harmonic
- 300ms sustain, 800ms release

### Molecule Completion — THE CHORD
- All unique element notes play simultaneously
- Sustained pad (2 seconds)
- Slow filter sweep (low-pass opening)
- Shimmer effect (high-frequency oscillator at very low volume)
- Then the Larmor tone (863 Hz) fades in underneath for 1 second — the P31 signature

### Ping Sound
- Quick ascending two-note chirp
- 100ms total
- Bright, attention-getting

### Ambient
- Very low volume drone at 131 Hz (C3, one octave below carbon)
- Only plays during idle / molecule rotation
- Cuts when placing atom

---

## GAME MECHANICS

### Valence Rules (Real Chemistry, Simplified)
- Each atom has N bond sites (valence number)
- Bonds consume one site from each atom
- An atom with all sites filled cannot accept more bonds
- The molecule is COMPLETE when every placed atom has all sites filled
- **Stability meter** = (filled bonds / total possible bonds) × 100%

### Placement Rules
1. First atom of a new molecule places at origin
2. Subsequent atoms MUST bond to an existing atom (no floating atoms)
3. Player selects element first, then taps an available bond site
4. Bond site availability shown by ghost cubes (available) vs nothing (filled)
5. Invalid placements are rejected with a gentle "nope" sound (low buzz, 50ms)

### Turn System
- Two players, alternating turns
- Each turn = place exactly one atom
- Between turns: can rotate molecule, ping partner, check stats
- Turn state stored in shared persistent storage
- No time limit per turn (this is bonding, not competition)

### Ping System
- After placing an atom, player can PING their partner
- Ping = "your turn" notification + the note of the atom just placed
- Ping is logged with timestamp in the engagement ledger
- Players can also ping any existing atom at any time (makes it glow + play its note)
- "Poke" mechanic — tap any atom to hear it. Curiosity encouraged.

---

## ACHIEVEMENTS

| Achievement | Trigger | LOVE Earned | Icon |
|-------------|---------|------------|------|
| **First Bond** | Place your first atom ever | 10 | 🔗 |
| **Water World** | Build H₂O | 25 | 💧 |
| **Salty** | Build NaCl | 25 | 🧂 |
| **Breathe** | Build CO₂ | 25 | 💨 |
| **Life Fuel** | Build C₆H₁₂O₆ (glucose) | 100 | ⚡ |
| **Methane Madness** | Build CH₄ | 25 | 💨 |
| **Bone Builder** | Build Ca₃(PO₄)₂ | 75 | 🦴 |
| **The Posner** | Build Ca₉(PO₄)₆ | 500 | 🧬 |
| **Speed Round** | Complete a molecule in under 60 seconds total | 50 | ⏱️ |
| **Pinger** | Send 10 pings in one session | 10 | 📡 |
| **Scientist** | Build 5 different molecules | 50 | 🔬 |
| **Discovery** | Build a valid molecule not in the common database | 100 | 🌟 |

---

## MOLECULE PERSONALITIES (Post-Completion Animations)

When a molecule is complete, it comes alive:

| Molecule Type | Personality | Animation |
|--------------|-------------|-----------|
| Water (has H + O, small) | **Mediator** | Gentle orbit, slightly bouncy |
| Ionic (has Na or Ca + non-metal) | **Rock** | Sits heavy, slow pulse/vibrate |
| Hydrocarbon (C + H only) | **Loner** | Drifts slowly away, spins lazily |
| Organic + O (glucose, etc.) | **Fuel** | Rapid pulse, energetic glow |
| Phosphorus compound | **Spark** | Volatile flicker, random small jumps |
| The Posner | **Guardian** | Slow majestic rotation, strong steady glow, ambient Larmor tone |

---

## MULTIPLAYER (No Backend Required)

### Shared Persistent Storage API
```typescript
// Create game
await window.storage.set(`bonding:game:${gameId}`, JSON.stringify(gameState), true);

// Read game (poll every 2 seconds for partner's turn)
const result = await window.storage.get(`bonding:game:${gameId}`, true);

// List player's games
const keys = await window.storage.list('bonding:game:', true);
```

### Game State Schema
```typescript
interface BondingGame {
  id: string;
  name: string;                    // "Will & Bash's Molecule"
  players: Player[];
  currentTurn: number;             // index into players
  atoms: PlacedAtom[];
  bonds: Bond[];
  pings: PingEvent[];
  achievements: string[];
  status: 'lobby' | 'active' | 'complete';
  createdAt: string;               // ISO timestamp
  updatedAt: string;
}

interface Player {
  name: string;
  odometer: string;               // fingerprint/device ID
  color: string;                  // player accent color
  atomsPlaced: number;
}

interface PlacedAtom {
  id: number;
  element: ElementSymbol;
  position: { x: number; y: number; z: number };
  bondSites: number;              // total sites (valence)
  bondedTo: number[];             // IDs of bonded atoms
  placedBy: number;               // player index
  timestamp: string;
}

interface Bond {
  id: number;
  from: number;                   // atom ID
  to: number;                     // atom ID
  timestamp: string;
}

interface PingEvent {
  from: number;                   // player index
  atomId: number;                 // which atom was pinged
  timestamp: string;
  message?: string;               // optional "nice one!"
}
```

### Join Flow
1. Player 1 creates game → gets a 4-character code (e.g., "BASH")
2. Player 2 enters code → joins the game
3. Game code = last 4 chars of game ID (displayed large, friendly font)
4. No accounts. No passwords. Just a code and a name.

---

## ENGAGEMENT LEDGER (The Legal Evidence)

Every action is logged. This is the "Exhibit A" layer.

```typescript
interface EngagementEvent {
  timestamp: string;              // ISO 8601
  gameId: string;
  sessionId: string;
  playerId: number;
  playerName: string;
  eventType: 'atom_placed' | 'bond_formed' | 'ping_sent' | 'ping_received' | 
             'molecule_completed' | 'achievement_earned' | 'session_start' | 'session_end';
  metadata: Record<string, any>;  // element, position, achievement name, etc.
}
```

Log stored locally AND in shared storage. Can be exported as JSON or CSV.

---

## TECH ARCHITECTURE

```
bonding/
├── src/
│   ├── App.tsx                    # Router: Lobby → Game → Complete
│   ├── components/
│   │   ├── MoleculeCanvas.tsx     # Three.js scene (R3F)
│   │   ├── VoxelAtom.tsx          # Single atom (RoundedBox + glow)
│   │   ├── BondBeam.tsx           # Bond connection geometry
│   │   ├── GhostSite.tsx          # Available bond site indicator
│   │   ├── ElementPalette.tsx     # Bottom strip — pick your element
│   │   ├── StabilityMeter.tsx     # Progress bar
│   │   ├── PingButton.tsx         # The ping
│   │   ├── TurnIndicator.tsx      # Whose turn + player colors
│   │   ├── AchievementToast.tsx   # Pop-up on unlock
│   │   ├── MoleculePersonality.tsx # Post-completion animation controller
│   │   └── GameLobby.tsx          # Create/join game
│   ├── engine/
│   │   ├── chemistry.ts           # Valence rules, molecule validation, formula generation
│   │   ├── sound.ts               # Web Audio API — all synthesis
│   │   ├── storage.ts             # window.storage wrapper + polling
│   │   ├── ledger.ts              # Engagement event logging
│   │   └── achievements.ts        # Achievement detection + LOVE calculation
│   ├── data/
│   │   ├── elements.ts            # Element definitions (symbol, valence, color, freq, etc.)
│   │   └── molecules.ts           # Known molecule database for achievement matching
│   └── types.ts                   # All TypeScript interfaces
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

### Dependencies (Minimal)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "@react-three/postprocessing": "^2.15.0",
    "three": "^0.128.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 4-DAY BUILD PLAN

### Day 1 (Feb 27 — TODAY, remaining hours)
**GOAL: Atoms render. Sound plays. Chemistry works.**
- [ ] Scaffold project (Vite + React + R3F + Tailwind)
- [ ] `elements.ts` — all 6 elements with properties
- [ ] `chemistry.ts` — valence rules, bond validation, stability calc, formula generator
- [ ] `VoxelAtom.tsx` — rounded box + emissive glow + bloom
- [ ] `MoleculeCanvas.tsx` — scene, lighting, orbit controls, background
- [ ] `sound.ts` — atom placement notes, bond intervals
- [ ] Place a single carbon. See it glow. Hear it ring. 🎯

### Day 2 (Feb 28)
**GOAL: Full single-player placement loop.**
- [ ] `GhostSite.tsx` — bond site indicators
- [ ] `ElementPalette.tsx` — pick element, tap bond site, place atom
- [ ] `BondBeam.tsx` — glowing connections between atoms
- [ ] `StabilityMeter.tsx` — progress toward completion
- [ ] `chemistry.ts` — molecule completion detection, formula display
- [ ] Sound: bond intervals, completion chord
- [ ] Build H₂O. See it complete. Hear the chord. 🎯

### Day 3 (March 1)
**GOAL: Multiplayer works. Ping works.**
- [ ] `storage.ts` — shared storage wrapper, polling for partner turns
- [ ] `GameLobby.tsx` — create game, get code, join game
- [ ] `TurnIndicator.tsx` — whose turn, player colors
- [ ] `PingButton.tsx` — ping + notification sound
- [ ] `ledger.ts` — engagement event logging
- [ ] Two devices, one game. Place atoms together. 🎯

### Day 4 (March 2)
**GOAL: Polish. Achievements. Personality animations. Playtestable.**
- [ ] `achievements.ts` — detection + toast notifications
- [ ] `MoleculePersonality.tsx` — post-completion animations
- [ ] `molecules.ts` — known molecule database
- [ ] Completion chord + Larmor signature
- [ ] Mobile responsive (works on phone for Bash)
- [ ] Export engagement log as JSON
- [ ] Test on multiple devices
- [ ] Ship to p31ca.org/bonding 🎯

### March 3: PLAYTEST DAY
- Will and Bash play BONDING together
- Fix anything broken
- The game IS the playtest

### March 10: BASH'S BIRTHDAY
- "Hey Bash, want to build a molecule?"

---

## THE VIBE

This game should feel like:
- **Minecraft** — chunky, tactile, "I built this"
- **Monument Valley** — beautiful, calm, surprising
- **Tetris Effect** — synesthetic, sound and light fused to action

Not like:
- A textbook
- A coding exercise
- A tech demo

When Bash places his first hydrogen next to Will's carbon and hears the C5 + C4 interval ring out while both cubes glow brighter — that's the moment. That's what we're building toward.

---

*"There is no winning. There is only building."*
*Every turn is a timestamp. Every ping is proof. Every molecule is a memory.*
