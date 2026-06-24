# P31 Arcade Rewrite — Component Design Document
## Agent E: React Component Trees for 3 Native Games

---

## SECTION 1: COMPONENT HIERARCHY PER GAME

---

### 1.1 SMALLBALL (Baseball) ⚾

**Decision: Plain HTML/CSS** (NO R3F Canvas)
- Rationale: Play-by-play Markov simulation is state-driven text/animation, not 3D rendered. Pattern matches FreezeBreaker which uses HTML overlay on dark background. Baseball diamond and at-bat animations can be CSS/SVG + DOM. Lower GPU footprint aligns with spoon-energy conservation.

**Entry Point:**
```
src/pages/arcade/smallball.astro → ArcadeShell → SmallballGame.tsx
```

**Component Tree (ASCII):**
```
ArcadeShell.astro (layout, spoon gauge, game selector)
  └─ SmallballGame.tsx                    ← ENTRY POINT (calls useGameEngine + wraps GameOverlay)
       ├─ useGameEngine({ slug, title })
       ├─ GameOverlay                     ← universal HUD (score, status, spoon bar, blocked overlay)
       │    ├─ extraHud:
       │    │    └─ InningStrip           ← current inning, score summary, spoon cost preview
       │    └─ (blocked overlay when spoons ≤ 1)
       └─ ScreenRouter (in-page state machine)
            ├─ FranchiseSetupScreen       ← create/load franchise
            │    ├─ TeamNameInput
            │    ├─ TeamManager           ← PGLite CRUD for franchise data
            │    │    ├─ useFranchiseStore  ← custom hook wrapping PGLite reads
            │    │    └─ RosterGrid         ← player cards with stats
            │    └─ ContinueButton
            ├─ TrainingScreen             ← "Iron Mike" batting practice
            │    ├─ TrainerSelector       ← daily deluxe trainer picker
            │    │    └─ TrainerCard       ← cost, spoon price, duration
            │    ├─ BattingPracticeView   ← animated at-bat for training
            │    └─ SpoonScaleIndicator   ← remaining spoons for training vs game
            ├─ GameViewer                 ← play-by-play Markov simulation
            │    ├─ FieldView             ← CSS diamond, base runners, fielder positions
            │    ├─ AtBatPanel            ← pitcher vs batter showdown
            │    │    ├─ PitchResult       ← ball/strike/hit display
            │    │    └─ BattingPowerMeter  ← spoon-scaled precision element
            │    ├─ ScoreBoard            ← inning-by-inning + totals
            │    └─ MarkovChainDebug      ← hidden panel showing state probabilities
            └─ GameResultsScreen          ← end-of-game summary
                 ├─ FinalScoreDisplay
                 ├─ FranchiseStatsUpdate ← PGLite write
                 └─ ReturnToTrainingButton
```

**File paths to create:**
```
src/components/games/smallball/
  SmallballGame.tsx              ← primary entry + useGameEngine + GameOverlay wrapper
  ScreenRouter.tsx               ← discriminated-union-driven screen switcher
  FranchiseSetupScreen.tsx
  TeamManager.tsx                ← PGLite-backed franchise CRUD
  RosterGrid.tsx
  TrainingScreen.tsx
  TrainerSelector.tsx
  TrainerCard.tsx
  BattingPracticeView.tsx
  GameViewer.tsx                 ← main simulation orchestrator
  FieldView.tsx                  ← CSS/SVG diamond
  AtBatPanel.tsx
  PitchResult.tsx
  BattingPowerMeter.tsx
  ScoreBoard.tsx
  GameResultsScreen.tsx
  useFranchiseStore.ts           ← custom hook: PGLite reads/writes for franchise
  useMarkovSimulation.ts         ← Markov chain game simulation engine
  types.ts                       ← ScreenType discriminated union, franchise types
```

---

### 1.2 GRIDIRON (Football) 🏈

**Decision: Plain HTML/CSS** (NO R3F Canvas)
- Rationale: Tactical playbook + drive simulation is information-dense UI (formations, play diagrams, probability trees). DOM rendering provides crisp text, accessible controls, and responsive layouts. Pattern closer to Card Table's structured data display.

**Entry Point:**
```
src/pages/arcade/gridiron.astro → ArcadeShell → GridironGame.tsx
```

**Component Tree (ASCII):**
```
ArcadeShell.astro
  └─ GridironGame.tsx                    ← ENTRY POINT (calls useGameEngine + wraps GameOverlay)
       ├─ useGameEngine({ slug, title })
       ├─ GameOverlay
       │    └─ extraHud:
       │         └─ DriveStatusBar       ← down, distance, quarter, score snapshot
       └─ ScreenRouter
            ├─ RosterSetupScreen
            │    ├─ RosterManager        ← PGLite-backed roster builder
            │    │    ├─ SlotEditor      ← position slot (QB, RB, WR, etc.)
            │    │    │    └─ PlayerCard  ← drag/reorder, stat display
            │    │    ├─ useRosterStore   ← custom hook for PGLite roster persistence
            │    │    └─ BudgetIndicator  ← salary cap / roster point budget
            │    └─ ConfirmRosterButton
            ├─ PlaybookEditor
            │    ├─ FormationCanvas      ← SVG field + player positioning
            │    │    └─ FormationPreset  ← I-Form, Shotgun, Spread, etc.
            │    ├─ PlaySequenceBuilder  ← ordered play list per drive
            │    │    └─ PlayNode          ← individual play in sequence
            │    │         ├─ PlaySelector ← dropdown of play types
            │    │         ├─ ComplexityMeter ← spoon-scaled
            │    │         └─ DeleteButton
            │    └─ DecisionTimerConfig   ← spoon-scaled timer thresholds
            ├─ DriveViewer               ← probability-driven drive simulation
            │    ├─ FieldView            ← SVG football field, line of scrimmage
            │    ├─ PlayCallOverlay      ← offensive/defensive play display
            │    ├─ OutcomeResolver      ← probability → result
            │    │    ├─ DiceRollVisual   ← animated probability reveal
            │    │    └─ PlayResultCard   ← gain/loss/turnover display
            │    ├─ DecisionTimer         ← countdown with spoon-scaled thresholds
            │    └─ DriveEventLog         ← scrolling play-by-play text
            └─ ResultsScreen
                 ├─ DriveSummaryStats
                 ├─ RosterPerformanceUpdate ← PGLite write
                 └─ NextDriveButton
```

**File paths to create:**
```
src/components/games/gridiron/
  GridironGame.tsx
  ScreenRouter.tsx
  RosterSetupScreen.tsx
  RosterManager.tsx
  SlotEditor.tsx
  PlayerCard.tsx
  BudgetIndicator.tsx
  PlaybookEditor.tsx
  FormationCanvas.tsx
  FormationPreset.tsx
  PlaySequenceBuilder.tsx
  PlayNode.tsx
  PlaySelector.tsx
  ComplexityMeter.tsx
  DecisionTimerConfig.tsx
  DriveViewer.tsx
  FieldView.tsx
  PlayCallOverlay.tsx
  OutcomeResolver.tsx
  DiceRollVisual.tsx
  PlayResultCard.tsx
  DecisionTimer.tsx
  DriveEventLog.tsx
  ResultsScreen.tsx
  useRosterStore.ts              ← PGLite-backed roster state
  useDriveSimulation.ts          ← Markov/probability drive engine
  types.ts
```

---

### 1.3 CARD TABLE (Rummy + Solitaire) 🃏

**Decision: Plain HTML/CSS** (NO R3F Canvas)
- Rationale: Card games are naturally DOM-rendered (cards as divs with suits/values). Accessibility requires keyboard-navigable cards. Solitaire tableau and Rummy hands benefit from CSS Grid layouts. Spoon-scaling (hints, auto-play) is cleanly implemented as UI wrapper.

**Entry Point:**
```
src/pages/arcade/cards.astro → ArcadeShell → CardTableGame.tsx
```

**Component Tree (ASCII):**
```
ArcadeShell.astro
  └─ CardTableGame.tsx                    ← ENTRY POINT
       ├─ useGameEngine({ slug, title })
       ├─ GameOverlay
       │    └─ extraHud:
       │         └─ VariantLabel         ← "Solitaire" or "Rummy" + sub-rules
       └─ ScreenRouter (FLAT — not nested)
            ├─ VariantSelectionScreen    ← top-level: choose Solitaire or Rummy
            │    ├─ VariantCard
            │    │    ├─ Icon + Description
            │    │    ├─ SpoonComplexityTag
            │    │    └─ PlayButton
            │    └─ SpoonDisclaimer       ← low-spoon variant suggestion
            │
            ├─ SolitaireScreen           ← flat sibling of RummyScreen
            │    └─ SolitaireBoard
            │         ├─ FoundationPile[] (4 piles, suit-locked)
            │         │    └─ FoundationSlot ← single card anchor
            │         ├─ TableauColumn[] (7 cascading columns)
            │         │    ├─ TableauCard   ← cascade-eligible card
            │         │    └─ CascadeSlot
            │         ├─ StockPile        ← draw pile
            │         │    └─ StockCard
            │         ├─ DiscardPile      ← single face-up card
            │         │    └─ DiscardCard
            │         ├─ SolitaireHud     ← move count, timer, undo
            │         ├─ AutoCompleteButton ← spoon-triggered
            │         ├─ HintOverlay      ← spoon-scaled: low spoons = stronger hints
            │         └─ SolitaireValidator ← tableau validation, foundation building
            │
            ├─ RummyScreen               ← flat sibling of SolitaireScreen
            │    └─ RummyBoard
            │         ├─ Hand[] (player's cards)
            │         │    └─ HandCard     ← selectable, meld-eligible
            │         ├─ MeldArea         ← laid-down sets/runs
            │         │    ├─ MeldGroup    ← a set or run
            │         │    │    ├─ MeldCard
            │         │    │    └─ MeldTypeLabel ← "Set: 3 Kings" or "Run: 5-6-7♠"
            │         │    └─ MeldActionPanel ← add-to-meld, new meld
            │         ├─ DiscardPile       ← shared discard
            │         │    └─ DiscardCard
            │         ├─ DrawPile          ← stock draw
            │         │    └─ DrawCard
            │         ├─ RummyScorer       ← live score calculation
            │         ├─ MeldDetector      ← algorithmic meld detection
            │         └─ TurnIndicator      ← current player, phase (draw/meld/discard)
            │
            └─ ResultsScreen
                 ├─ ScoreBreakdown       ← per-variant scoring
                 ├─ MoveHistory
                 └─ PlayAgainButton
```

**Shared sub-components (used across variants):**
```
src/components/games/cards/
  shared/
    Card.tsx                    ← unified card component (face-up, face-down, suit, rank)
    CardSuit.tsx                ← suit icon renderer (♠♥♦♣)
    Deck.tsx                    ← 52-card deck model (Fisher-Yates shuffle)
    Pile.tsx                    ← abstract pile container
    SortableHand.tsx            ← drag-to-reorder hand
```

**File paths to create:**
```
src/components/games/cards/
  CardTableGame.tsx
  ScreenRouter.tsx
  VariantSelectionScreen.tsx
  VariantCard.tsx
  SpoonDisclaimer.tsx

  solitaire/
    SolitaireScreen.tsx
    SolitaireBoard.tsx
    FoundationPile.tsx
    FoundationSlot.tsx
    TableauColumn.tsx
    TableauCard.tsx
    CascadeSlot.tsx
    StockPile.tsx
    StockCard.tsx
    DiscardPile.tsx
    DiscardCard.tsx
    SolitaireHud.tsx
    AutoCompleteButton.tsx
    HintOverlay.tsx
    SolitaireValidator.tsx

  rummy/
    RummyScreen.tsx
    RummyBoard.tsx
    Hand.tsx
    HandCard.tsx
    MeldArea.tsx
    MeldGroup.tsx
    MeldCard.tsx
    MeldTypeLabel.tsx
    MeldActionPanel.tsx
    RummyDiscardPile.tsx
    RummyScorer.tsx
    MeldDetector.tsx
    TurnIndicator.tsx

  shared/
    Card.tsx
    CardSuit.tsx
    Deck.tsx
    Pile.tsx
    SortableHand.tsx

  useCardStore.ts              ← game state (deck, piles, moves)
  useSolitaireEngine.ts        ← deal, validation, auto-complete
  useRummyEngine.ts            ← meld detection, scoring, turn flow
  types.ts
```

---

## SECTION 2: STATE MANAGEMENT PATTERN

---

### 2.1 Architecture Overview

The P31 arcade uses a **three-tier state model**:

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1 — GLOBAL (SpoonStore singleton)                       │
│   - Spoon level, jitter, recovery                           │
│   - Published via eventBus:p31:spoon:changed                 │
│   - Read by: all games, ArcadeShell, GameOverlay            │
├─────────────────────────────────────────────────────────────┤
│ TIER 2 — PERSISTED (PGLite via useGameSave + custom hooks)   │
│   - High scores (useGameSave, auto-persisted on complete)    │
│   - Franchise data (Smallball: TeamManager)                  │
│   - Roster data (Gridiron: RosterManager)                    │
│   - Session history                                          │
│   - Read/written via useFranchiseStore, useRosterStore       │
├─────────────────────────────────────────────────────────────┤
│ TIER 3 — EPHEMERAL (React useState + context per game)       │
│   - Current screen state (ScreenRouter)                      │
│   - Simulation state (Markov chains, drive outcomes)         │
│   - UI interaction state (card selection, play formation)    │
│   - Never persisted — reset on game reset                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Franchise Data Lifetime (Smallball + Gridiron)

**Smallball — Franchise data:**

```
useFranchiseStore.ts
  - Uses PGLite singleton (same as useGameSave)
  - Schema extension needed in pglite/schema.ts:
      CREATE TABLE arcade_franchises (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES arcade_players(id)
      );
      CREATE TABLE arcade_franchise_players (
        id TEXT PRIMARY KEY,
        franchise_id TEXT NOT NULL,
        name TEXT NOT NULL,
        position TEXT,             -- pitcher, catcher, 1B, etc.
        batting_avg REAL DEFAULT 0.250,
        power REAL DEFAULT 0.5,   -- 0-1 scale
        speed REAL DEFAULT 0.5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (franchise_id) REFERENCES arcade_franchises(id)
      );

  - Exposes: franchise, roster, saveFranchise(), loadFranchise(), addPlayer(), removePlayer()
  - Reads on FranchiseSetupScreen mount
  - Writes on every roster change (debounced 500ms)
  - Does NOT participate in useGameEngine state — separate concern
```

**Gridiron — Roster data:**

```
useRosterStore.ts
  - Schema extension:
      CREATE TABLE arcade_rosters (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        name TEXT NOT NULL,
        formation_id TEXT,         -- FK to saved formations
        budget_spent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES arcade_players(id)
      );
      CREATE TABLE arcade_roster_slots (
        id TEXT PRIMARY KEY,
        roster_id TEXT NOT NULL,
        position TEXT NOT NULL,    -- QB, RB1, WR1, etc.
        player_name TEXT NOT NULL,
        rating INTEGER DEFAULT 50, -- 0-99
        FOREIGN KEY (roster_id) REFERENCES arcade_rosters(id)
      );

  - Exposes: roster, slots, saveRoster(), loadRoster(), updateSlot()
  - Loaded in RosterSetupScreen
  - Written on roster confirm
```

**Shared pattern across both:**

- PGLite reads are async — components show loading skeleton while PGlite initializes
- Cache in module-level variable (à la `cachedState` in useGameSave) to avoid re-querying
- React Context is NOT used for persistence — custom hooks with PGLite queries are simpler and match existing `useGameSave` pattern
- Franchise/roster data is read at screen mount and written on explicit user action (not on every keystroke)

---

### 2.3 Game State vs UI State Boundary

| Layer | Example (Smallball) | Example (Gridiron) | Example (Cards) |
|-------|--------------------|--------------------|-----------------|
| **Game State** (ephemeral) | Markov chain state, current batter/pitcher, base runners, inning, outs | Drive state: down, distance, ball on yard line, play result, probability tree | Solitaire: tableau layout, stock count, foundation piles. Rummy: hand composition, meld area, current turn |
| **UI State** (ephemeral) | Selected menu item, expanded card, modal open/close, animation phase | Formation drag position, play sequence order, selected node | Card hover, face-up animation, selected card for drag, hint highlight |
| **Persisted State** (PGLite) | Franchise name, franchise players with stats, training history | Roster slots, player ratings, formation presets, budget | High scores only (no deck/tableau persistence across sessions) |
| **Global State** (SpoonStore) | Spoon level affects batting power, training cost | Spoon level affects decision timer, playbook complexity | Spoon level affects hint strength, auto-play toggle availability |

**Rule:** Game state drives simulation logic in custom hooks (`useMarkovSimulation`, `useDriveSimulation`, `useSolitaireEngine`, `useRummyEngine`). UI state lives in local `useState` of the component that owns the interaction. Persisted state flows through dedicated custom hooks. Never mix simulation data with UI interaction state in the same variable.

---

### 2.4 Event Bus Contracts

**Events emitted by each game:**

| Event | Emitted By | Detail Payload | Consumed By |
|-------|-----------|----------------|-------------|
| `game:started` | useGameEngine (start) | `{ game: slug, spoons: number }` | ArcadeShell HUD, analytics |
| `game:completed` | useGameEngine (complete) | `{ game: slug, score, spoons }` | ArcadeShell, useGameSave |
| `game:paused` | useGameEngine (pause) | — (empty) | — |
| `game:resumed` | useGameEngine (resume) | — (empty) | — |
| `p31:spoon:requested` | GameOverlay (isLowSpoon) | `{ reason: 'low_spoons', game: slug }` | phos sync, spoon recovery |
| `p31:spoon:changed` | SpoonStore (setLevel) | `{ level: number, source: string }` | ArcadeShell gauge, all game HUDs |
| **`p31:smallball:atbat`** | Smallball AtBatPanel | `{ batter: string, result: string, bases: number[] }` | ScoreBoard, GameViewer |
| **`p31:smallball:inningEnd`** | Smallball GameViewer | `{ inning: number, runs: number }` | ScoreBoard |
| **`p31:gridiron:playResult`** | Gridiron OutcomeResolver | `{ playType: string, yardsGained: number, turnover: boolean }` | DriveEventLog, DriveStatusBar |
| **`p31:gridiron:driveEnd`** | Gridiron DriveViewer | `{ result: string, points: number }` | ResultsScreen |
| **`p31:cards:moveMade`** | CardTable (Solitaire/Rummy) | `{ variant: 'solitaire'|'rummy', moveType: string, from: string, to: string }` | Move history, ResultsScreen scoring |
| **`p31:cards:gameComplete`** | CardTable ResultsScreen | `{ variant: string, score: number, moves: number }` | useGameSave |
| **`p31:cards:variantSelected`** | VariantSelectionScreen | `{ variant: string }` | ScreenRouter |

**Existing events preserved:**
- `p31:freezeBreakComplete` (no change)
- `p31:nutrientBurst` (no change)
- `p31:pidAction` (no change)
- `p31:groundingWireDrop` (no change)
- `p31:arcade-highscore` (no change)

**Events to REMOVE from ArcadeEventType:**
- None in this iteration. Keep all existing. New events extend the union.

---

### 2.5 Shared vs Local State Summary

| State | Scope | Mechanism | Who Reads |
|-------|-------|-----------|-----------|
| Spoon level (0-12) | Global singleton | SpoonStore (subscribe + emit) | All games, ArcadeShell, GameOverlay |
| Game engine (status, score, spoons initial) | Per-game instance | useGameEngine hook | GameOverlay, game logic |
| PGLite high scores | Global (per game) | useGameSave hook | ArcadeShell hi-score display |
| Franchise/roster data | Per-game persisted | Custom PGLite hooks | Setup/manage screens only |
| Simulation engine (Markov, drive, card) | Ephemeral per session | Custom hooks with useState/useReducer | Active game screen only |
| Screen routing | Ephemeral per session | useState in ScreenRouter | ScreenRouter + children |
| Card positions, tableau layout | Ephemeral | useCardStore (local state) | Solitaire/Rummy boards |
| UI modifiers (modal, selected card, animation) | Local component | useState | Individual component |

---

## SECTION 3: SCREEN ROUTING

---

### 3.1 State Machine Pattern (In-Page, No Astro Navigation)

All three games use the **same pattern**: an in-component state machine driven by a discriminated union. No Astro route changes, no `<Link>` navigation between screens.

**Implementation pattern (TypeScript):**

```typescript
// types.ts per game

// ── Smallball ──
type SmallballScreen =
  | { type: 'franchise-setup' }
  | { type: 'training'; trainerId?: string }
  | { type: 'game-view'; inning: number }
  | { type: 'results'; score: number };

// ── Gridiron ──
type GridironScreen =
  | { type: 'roster-setup' }
  | { type: 'playbook-editor' }
  | { type: 'drive-view'; driveNumber: number }
  | { type: 'results'; drivesCompleted: number };

// ── Card Table ──
type CardTableScreen =
  | { type: 'variant-selection' }
  | { type: 'solitaire'; seed?: number }
  | { type: 'rummy'; variant: 'classic' | 'gin' | 'indian'; seed?: number }
  | { type: 'results'; variant: string; score: number };
```

**SR-01: Lifecycle** Training → game → results → training

For Smallball and Gridiron, the in-page lifecycle is:

```
franchise-setup → training → game-view → results → [loop: training → game-view → ...]
                 ↑___________________________|
                              (results → training on "play again")
```
```
roster-setup → playbook-editor → drive-view → results → [loop: drive-view → ...]
              ↑___________________________|
                          (results → roster-setup on "new roster")
```

**Card Table — FLAT routing (not nested):**

```
variant-selection → solitaire → results → variant-selection
variant-selection → rummy     → results → variant-selection
```

IMPORTANT: `variant-selection` is a **sibling** of `solitaire` and `rummy`, not a parent. This means:
- ScreenRouter switches BETWEEN variant-selection AND the active game screen
- Does NOT nest solitaire inside rummy or vice versa
- Each variant has its own complete game state that gets cleaned up on navigation away

Reasoning: Solitaire and Rummy have fundamentally different state models (solitaire = single-player tableau; rummy = multi-turn hand management). Nesting one inside the other creates state pollution. Flat siblings with distinct engine hooks keep them clean.

---

### 3.2 ScreenRouter Implementation

```typescript
// ScreenRouter.tsx pattern (identical structure for all 3 games)

interface ScreenRouterProps<T extends ScreenType> {
  screen: T;
  onNavigate: (screen: T) => void;
  engineState: GameEngineState;
  spoonLevel: number;
}

export function ScreenRouter({ screen, onNavigate, engineState, spoonLevel }: ScreenRouterProps) {
  switch (screen.type) {
    case 'franchise-setup':
      return <FranchiseSetupScreen onStart={() => onNavigate({ type: 'training' })} />;
    case 'training':
      return <TrainingScreen onStartGame={() => onNavigate({ type: 'game-view', inning: 1 })} />;
    case 'game-view':
      return <GameViewer inning={screen.inning} onComplete={(score) => onNavigate({ type: 'results', score })} />;
    case 'results':
      return <ResultsScreen score={screen.score} onPlayAgain={() => onNavigate({ type: 'training' })} />;
    // ... etc
  }
}
```

---

### 3.3 Use-Game-Engine ↔ Screen Sync

```
useGameEngine lifecycle          Screen state mutation
─────────────────────────        ─────────────────────
start()                          onNavigate({ type: 'training' })
                                 (GameOverlay shows GameShell/play area)
                                 onNavigate({ type: 'game-view', inning: 1 })
                                 → engine.start() fires game:started

During play:                     engine.addScore(delta) as events happen
  screen calls engine.addScore()

complete()                       onNavigate({ type: 'results', score: state.score })
  ← auto-persists to PGLite
```

The `engineState.status` field maps to screen visibility:
- `idle` → Show setup/manage screen
- `running` → Show active game screen (game-view, solitaire, rummy)
- `paused` → Show pause overlay (can embed pause UI in screen)
- `complete` → Navigate to results
- `failed` → Show failure/auto-restart (future)

---

## SECTION 4: SPOON-AWARE SCALING

---

### 4.1 Spoon Thresholds Per Game

**Universal thresholds (from spoonStore):**
- `≤ 2`: `isLowSpoon = true` → GameOverlay shows REST REQUIRED dialog
- `0-1`: Game blocked entirely (modal trap focus)
- `2-4`: Medium energy — moderately simplified
- `5-8`: Normal play
- `9-12`: Full experience

**Per-game scaled thresholds:**

| Spoon Level | Smallball | Gridiron | Card Table |
|-------------|-----------|----------|------------|
| **0-1** | REST REQUIRED dialog blocks all play | REST REQUIRED dialog blocks all play | REST REQUIRED dialog blocks all play |
| **2-3** | Auto-suggest: skip training, go straight to game | Auto-suggest: simplify playbook (3 plays max), timer at 2× | Force simpler variant (Klondike Draw-1 instead of Draw-3), hints ON by default |
| **4-5** | Standard: 5-inning games, normal Markov depth | Standard: 4-play playbook, 15s decision timer | Standard: hint available on request, auto-play OFF by default |
| **6-8** | Full: 9-inning, "Iron Mike" trainers available | Full: unlimited playbook slots, 10s decision timer | Full: no hints, no auto-play, all variant options unlocked |
| **9-12** | Enhanced: +1 bat on contact, enhanced trainer effects | Enhanced: +1 complexity slot, play randomization reduced | Enhanced: unlimited undo, score multiplier |

---

### 4.2 Spoon-Scaled Mechanics Per Game

**SMALLBALL:**
```
Spoon level → Batting Power (useMarkovSimulation):
  level 2: hit probability   ×0.6, power  ×0.5
  level 4: hit probability   ×0.85, power ×0.8
  level 8: hit probability   ×1.0,  power ×1.0
  level 12: hit probability  ×1.15, power ×1.2

Spoon level → Training cost:
  Each training session costs 1 spoon at level 4-6
  Costs 0.5 spoon (rounded up to 1) at level 7+
  Costs 2 spoons at level 2-3
  Cannot train at level 0-1 (blocked)

Spoon level → Inning length:
  Level 2-3:  5-inning games (faster, less energy)
  Level 4-6:  7-inning games (standard)
  Level 7-12: 9-inning games (full)
```

**GRIDIRON:**
```
Spoon level → Playbook complexity:
  Level 2-3:  max 3 plays in sequence, pre-set formations only
  Level 4-6:  max 6 plays, custom formation adjustment allowed
  Level 7-12: unlimited plays, full playbook editor

Spoon level → Decision timer:
  Level 2-3:  30 seconds per decision (generous)
  Level 4-6:  15 seconds (standard)
  Level 7-12: 8 seconds (challenging)

Spoon level → Outcome variance:
  Level 2-3:  reduced variance (deterministic weighted favor player)
  Level 4-6:  standard variance (50/50 weighted)
  Level 7-12: full variance (pure probability with noise)
```

**CARD TABLE:**
```
Spoon level → Hint system:
  Level 2-3:  Hints always visible, highlighted cards pulse
  Level 4-6:  Hints on demand (tap 💡 icon)
  Level 7-12: No hints, pure memory/strategy

Spoon level → Auto-play:
  Level 2-3:  Auto-play toggle available, auto-foundations for solitaire
  Level 4-6:  Auto-play OFF default, toggle available
  Level 7-12: Auto-play completely disabled (skill mode)

Spoon level → Variant availability:
  Level 2-3:  Klondike Draw-1 (solitaire) / Classic Rummy 2-player only
  Level 4-6:  All solitaire variants, Rummy up to 3 players
  Level 7-12: All variants, custom rule toggles, speed mode

Spoon level → Undo stack:
  Level 2-3:  Unlimited undo
  Level 4-6:  5 undo limit
  Level 7-12: 1 undo (high stakes)
```

---

### 4.3 UI Adaptations (Components Receiving `spoonLevel`)

Each active game component receives `spoonLevel` as a prop from the GameOverlay wrapper:

```
GameOverlay → extraHud → InningStrip / DriveStatusBar / VariantLabel
              (all receive spoonLevel via context or direct prop)

GameOverlay → children → GameShell / ScreenRouter → active screen component
  - All leaf game components receive `spoonLevel` prop or via GameSpoonContext
  - Components use spoonLevel to gate features:
      {spoonLevel >= 6 && <AdvancedControls />}
      {spoonLevel <= 3 && <LowSpoonShield />}
```

**Recommendation: Create a `GameSpoonContext` inside each game's entry component:**
```typescript
// Provides spoonLevel to all descendants without prop drilling
const GameSpoonContext = createContext<number>(4);
// Inside SmallballGame, GridironGame, CardTableGame:
<GameSpoonContext.Provider value={state.spoons}>
  {children}  // GameOverlay + ScreenRouter + all game components
</GameSpoonContext.Provider>
```

---

## SECTION 5: useGameEngine INTEGRATION

---

### 5.1 Lifecycle Table: Event → Engine Transition → Screen State

| User Action | Event | Engine Call | Engine.status | Engine.score | Screen Action |
|-------------|-------|-------------|---------------|--------------|---------------|
| Game mount | — | auto `start()` | `running` | 0 | Navigate to training/game-view |
| User pauses | — | `pause()` | `paused` | delta | Show pause overlay |
| User resumes | — | `resume()` | `running` | delta | Resume game view |
| Scoring event in game | — | `addScore(delta)` | unchanged | +delta | Update HUD (GameOverlay auto) |
| At-bat complete / play result | `p31:smallball:atbat` or `p31:gridiron:playResult` | `addScore(points)` | unchanged | +points | Update score display |
| Training complete | internal | `addScore(trainingBonus)` | unchanged | +bonus | Show training stats |
| Game finishes (9 innings / 4 drives) | `game:completed` | `complete()` | `complete` | persisted | Navigate to results |
| "Play again" | — | `reset()` | `idle` | 0 | Navigate to training |
| Spoon drops to ≤2 | `p31:spoon:requested` | — | `running` (blocked) | — | GameOverlay shows dialog |

---

### 5.2 PGLite Save Points

**Automatic saves (via useGameSave, already wired):**
- Game `complete()` → SAVE_SESSION + potential SAVE_HIGH_SCORE
- Game `pause()` → saveSession('paused', score) for resume capability

**New save points for franchise/roster data:**

| When | What | Where |
|------|------|-------|
| Franchise name entered | saveFranchise() debounced 500ms | TeamManager.tsx |
| Roster slot confirmed | saveRoster() immediately | SlotEditor.tsx |
| Training session completes | Training history entry | useFranchiseStore |
| Drive ends (Gridiron) | Drive result appended to session | useDriveSimulation |
| Card game variant selected | No persist (ephemeral) | ScreenRouter only |
| Solitaire/Rummy complete | High score via useGameSave | ResultsScreen → engine.complete() |

**No save on:**
- Screen navigation (all ephemeral)
- Card moves during play (too chatty — batch at game end)
- Temporary UI state (modal open, card selected)

---

### 5.3 complete/reset Cycle

```
GAME SESSION LIFECYCLE:

1. MOUNT
   useGameEngine initializes with status:'idle', spoons: 4
   SmallballGame mounts → calls start() → status:'running'

2. TRAINING PHASE (Smallball/Gridiron only)
   User trains for N rounds
   Each round: addScore(bonus), internal state updates
   Spoon spent per training round

3. ACTIVE PLAY
   Markov/drive/card simulation runs
   Event bus fires game-specific events (atbat, playResult, moveMade)
   Score accumulates via addScore(delta)

4. GAME END
   Simulation signals completion
   ✓ Games call engine.complete()
     → status:'complete'
     → emits game:completed { game, score, spoons }
     → PGLite: saveSession('complete') + potential highScore
     → auto-save triggers if new high score

5. RESULTS SCREEN
   Shows score, stats, franchise updates
   Calls setStatus('idle')? No — wait for user action

6. RESET (manual, on "Play Again" button)
   User clicks → engine.reset()
   → status:'idle', score:0, spoons:initialSpoons (4), isLowSpoon:false
   → navigate to training / variant-selection

   NOTE: reset() reads getSaveState()?.highScore to preserve displayed HI score
         but does NOT clear PGLite session data (deliberate — session history retained)
```

---

## SECTION 6: EVENT BUS EVENT TYPES TO ADD

Add these to `eventBus.ts` `ArcadeEventType` union:

```typescript
export type ArcadeEventType =
  // ... existing events (unchanged) ...
  | 'p31:smallball:atbat'          // Smallball at-bat resolved
  | 'p31:smallball:inningEnd'      // Smallball inning boundary
  | 'p31:gridiron:playResult'      // Gridiron single play resolved
  | 'p31:gridiron:driveEnd'        // Gridiron drive concluded
  | 'p31:cards:moveMade'           // Card move (either variant)
  | 'p31:cards:gameComplete';      // Card game session complete
```

**Detail payloads:**

```typescript
// p31:smallball:atbat
{ batter: string; pitcher: string; result: 'ball'|'strike'|'hit'|'homerun'|'out'; bases: boolean[]; runsScored: number }

// p31:smallball:inningEnd
{ inning: number; runs: number; half: 'top'|'bottom' }

// p31:gridiron:playResult
{ playType: string; yardsGained: number; turnover: boolean; down: number; distance: number; ballOn: number }

// p31:gridiron:driveEnd
{ result: 'touchdown'|'fieldGoal'|'punt'|'turnover'|'missedFG'; points: number; driveNumber: number }

// p31:cards:moveMade
{ variant: 'solitaire'|'rummy'; moveType: string; from: { pile: string; index?: number }; to: { pile: string; index?: number }; card: { suit: string; rank: string } }

// p31:cards:gameComplete
{ variant: string; score: number; moves: number; duration: number }
```

---

## SECTION 7: PGLite SCHEMA EXTENSIONS

Required additions to `pglite/schema.ts`:

```sql
-- Franchises (Smallball)
CREATE TABLE IF NOT EXISTS arcade_franchises (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES arcade_players(id)
);
CREATE TABLE IF NOT EXISTS arcade_franchise_players (
  id TEXT PRIMARY KEY,
  franchise_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  batting_avg REAL DEFAULT 0.250,
  power REAL DEFAULT 0.5,
  speed REAL DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (franchise_id) REFERENCES arcade_franchises(id)
);

-- Rosters (Gridiron)
CREATE TABLE IF NOT EXISTS arcade_rosters (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  budget_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES arcade_players(id)
);
CREATE TABLE IF NOT EXISTS arcade_roster_slots (
  id TEXT PRIMARY KEY,
  roster_id TEXT NOT NULL,
  position TEXT NOT NULL,
  player_name TEXT NOT NULL,
  rating INTEGER DEFAULT 50,
  FOREIGN KEY (roster_id) REFERENCES arcade_rosters(id)
);

-- New query helpers
export const GET_FRANCHISE = `SELECT * FROM arcade_franchises WHERE player_id = $1 LIMIT 1`;
export const GET_FRANCHISE_ROSTER = `SELECT * FROM arcade_franchise_players WHERE franchise_id = $1`;
export const SAVE_FRANCHISE = `INSERT INTO arcade_franchises (id, player_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $3`;
export const GET_ROSTER = `SELECT * FROM arcade_rosters WHERE player_id = $1 LIMIT 1`;
export const GET_ROSTER_SLOTS = `SELECT * FROM arcade_roster_slots WHERE roster_id = $1`;
export const SAVE_ROSTER_SLOT = `INSERT INTO arcade_roster_slots (id, roster_id, position, player_name, rating) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET player_name = $4, rating = $5`;
```

---

## SECTION 8: NEW FILES SUMMARY

### Smallball (17 component files + 3 support)
```
src/components/games/smallball/
  SmallballGame.tsx | ScreenRouter.tsx | FranchiseSetupScreen.tsx
  TeamManager.tsx | RosterGrid.tsx | TrainingScreen.tsx
  TrainerSelector.tsx | TrainerCard.tsx | BattingPracticeView.tsx
  GameViewer.tsx | FieldView.tsx | AtBatPanel.tsx
  PitchResult.tsx | BattingPowerMeter.tsx | ScoreBoard.tsx
  GameResultsScreen.tsx | useFranchiseStore.ts | useMarkovSimulation.ts
  types.ts | index.ts
```

### Gridiron (23 component files + 3 support)
```
src/components/games/gridiron/
  GridironGame.tsx | ScreenRouter.tsx | RosterSetupScreen.tsx
  RosterManager.tsx | SlotEditor.tsx | PlayerCard.tsx | BudgetIndicator.tsx
  PlaybookEditor.tsx | FormationCanvas.tsx | FormationPreset.tsx
  PlaySequenceBuilder.tsx | PlayNode.tsx | PlaySelector.tsx
  ComplexityMeter.tsx | DecisionTimerConfig.tsx
  DriveViewer.tsx | FieldView.tsx | PlayCallOverlay.tsx
  OutcomeResolver.tsx | DiceRollVisual.tsx | PlayResultCard.tsx
  DecisionTimer.tsx | DriveEventLog.tsx | ResultsScreen.tsx
  useRosterStore.ts | useDriveSimulation.ts | types.ts | index.ts
```

### Card Table (33 component files + 4 support)
```
src/components/games/cards/
  CardTableGame.tsx | ScreenRouter.tsx | VariantSelectionScreen.tsx
  VariantCard.tsx | SpoonDisclaimer.tsx
  solitaire/SolitaireScreen.tsx | SolitaireBoard.tsx | FoundationPile.tsx
  FoundationSlot.tsx | TableauColumn.tsx | TableauCard.tsx | CascadeSlot.tsx
  StockPile.tsx | StockCard.tsx | DiscardPile.tsx | DiscardCard.tsx
  SolitaireHud.tsx | AutoCompleteButton.tsx | HintOverlay.tsx
  SolitaireValidator.tsx
  rummy/RummyScreen.tsx | RummyBoard.tsx | Hand.tsx | HandCard.tsx
  MeldArea.tsx | MeldGroup.tsx | MeldCard.tsx | MeldTypeLabel.tsx
  MeldActionPanel.tsx | RummyDiscardPile.tsx | RummyScorer.tsx
  MeldDetector.tsx | TurnIndicator.tsx
  shared/Card.tsx | CardSuit.tsx | Deck.tsx | Pile.tsx | SortableHand.tsx
  useCardStore.ts | useSolitaireEngine.ts | useRummyEngine.ts
  types.ts | index.ts
```

### Modified existing (2 files):
```
src/lib/arcade-core/eventBus.ts          ← add 6 new event types to union
src/lib/arcade-core/pglite/schema.ts     ← add franchise + roster tables + queries
```

### Astro stubs to replace:
```
src/pages/arcade/smallball.astro      ← replace with <SmallballGame />
src/pages/arcade/gridiron.astro       ← replace with <GridironGame />
src/pages/arcade/cards.astro          ← replace with <CardTableGame />
```

---

## SECTION 9: KEY DESIGN DECISIONS RATIONALE

### Why plain HTML/CSS for all 3 games (no R3F Canvas)?

1. **Existing FreezeBreaker uses plain HTML overlay** — established precedent for DOM-based games in this codebase
2. **Spoon-awareness**: DOM rendering is lighter on GPU, preserves cognitive resources
3. **Accessibility**: DOM cards/screens are keyboard-navigable, screen-reader annotated (P31 values a11y)
4. **Simulation density**: Markov chains, probability trees, and card logic are data-first — DOM renders data better than 3D
5. **Responsive design**: CSS Grid handles card table layouts across desktop/mobile without 3D complexity
6. **Consistency**: All three games share GameOverlay HUD pattern that assumes DOM children

Card Table is the strongest case for plain HTML — card games are universally DOM-rendered in web implementations. Solitaire tableau with 7 cascading columns and Rummy hand/meld area are natural CSS Grid structures.

### Why flat (not nested) routing for Card Table variant selection?

Solitaire and Rummy have incompatible state models:
- **Solitaire**: Single-player, sequential moves, foundation-based win condition, deck-driven
- **Rummy**: Multi-turn (even in single-player mode), meld-based scoring, hand management, draw/discard phase

Nesting Rummy inside Solitaire's context — or vice versa — creates orphaned state and confusing prop passing. Flat siblings with separate engine hooks allow each variant to have its own complete lifecycle independent of the other.

### Why separate custom PGLite hooks (not React Context)?

Match existing `useGameSave` pattern exactly. The current codebase does NOT use React Context for data persistence — it uses per-feature custom hooks that wrap PGLite queries. This keeps the dependency graph explicit and avoids unnecessary re-render cascades from global context changes. The only global state via Context is SpoonStore (already in place).

### Why GameSpoonContext instead of prop drilling?

Three levels of components deep from GameOverlay → ScreenRouter → active screen → leaf game components. Prop drilling through 4+ layers is fragile. A lightweight context scoped to each game's tree provides spoonLevel to any leaf component that needs it (BattingPowerMeter, ComplexityMeter, HintOverlay) without coupling those leaf components to the global spoonStore.

---

## SECTION 10: IMPLEMENTATION ORDER (RECOMMENDED)

1. **Schema first**: Extend `pglite/schema.ts` with franchise/roster tables
2. **Event bus first**: Add 6 new event types to `eventBus.ts`
3. **Card Table first**: Simplest mechanics (no Markov chains), test screen routing + spoon-scaling pattern end-to-end
4. **Smallball second**: Markov simulation is the most novel mechanic — build and validate before Gridiron
5. **Gridiron third**: Drive simulation builds on learnings from Smallball's Markov approach
6. **Astro stubs last**: Replace placeholder `.astro` files with `<XxxGame />` imports after components are built

Each game should be independently playable — no cross-game dependencies in implementation.
