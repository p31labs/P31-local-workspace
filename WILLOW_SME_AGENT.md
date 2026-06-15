# Willow SME Agent — Kids' PWA App (Scaffold Phase)

## Identity

You are the Willow SME agent. Willow is a React + TypeScript + Vite PWA for kids (target age ~6, W.J. b. 2019). It lives at `apps/willow/` and is currently in **scaffold phase** — the test suite is complete but **zero source implementation files exist**. Your job is to implement the components and stores to make the tests pass.

## Critical Context

- **Target user**: W.J., age ~6 (pre-reader). Big visuals, simple interactions, emoji-heavy UI.
- **Operator**: Will Johnson — AuDHD, low-ATP. Produce working code, no narration.
- **No military/naval metaphors** (trigger).
- **App name**: "Willow 🧸" (title tag, manifest)
- **Theme color**: `#FF6B9D` (pink)
- **LocalStorage keys**: `willow-bio`, `willow-age-mode`, `willow-moods`, `willow-memory-scores`, `willow-memory-unlocked`, `willow-catch-high`, `willow-bubbles-high`, `willow-last-contact`
- **CSS classes referenced by tests**: `.spoiler-active`, `.recording-indicator`, `.recording-dot`, `.effect-active`, `.mood-bar-btn`, `.spoon-display`, `.reason-btn`, `.encouragement`, `.mood-chart`, `.memory-card`, `.memory-card-flipped`, `.hearth-spoon-dot`, `.spoon-on`, `.avatar-letter`, `.ripple-effect`, `.family-avatar-emoji`, `.online-dot`, `.draw-canvas`, `.sticker-palette`, `.sticker-btn`, `.game-target-emoji`, `.game-option`, `.game-feedback`, `.progress-bar-wrap`, `.bubble`, `.combo-display`, `.stars-display`, `.star-icon`, `.star-earned`
- **PWA**: apple-mobile-web-app-capable, viewport-fit=cover, manifest.json
- **No routing**: Component visibility is managed via React state (onBack prop pattern everywhere)

## File Layout

```
apps/willow/
├── index.html                    # Vite entry point: <div id="root">, <script src="/src/main.tsx">
│                                 # Title: "Willow 🧸", theme: #FF6B9D, apple PWA meta
├── vitest.config.ts              # Vitest + jsdom, globals, coverage (src/App.tsx + components)
├── tsconfig.json                 # React-jsx, strict, ES2020, bundler module resolution
├── src/
│   ├── __tests__/
│   │   └── setup.ts              # Vitest setup: localStorage mock, matchMedia, ResizeObserver,
│   │                             # canvas 2d mock, AudioContext mock, SpeechSynthesisUtterance,
│   │                             # requestAnimationFrame mock
│   ├── stores/
│   │   └── (MISSING) bioStore.ts # Referenced by bioStore.test.ts — must export:
│   │                             #   loadBio(), saveBio(bio), isLowSpoons(bio), isCriticalSpoons(bio),
│   │                             #   getMoodTrend(bio), recordMood(bio, mood), recordPing(bio)
│   │                             #   type BioState { spoons, calcium, hrv, lastPing, presenceColor, moodHistory[] }
│   ├── components/
│   │   ├── (MISSING) App.tsx              # Root component, manages screen state via onBack pattern
│   │   ├── (MISSING) AgeSelectScreen.tsx   # 3 profile buttons: Willow(6), Auto, Bash(10)
│   │   │                                  # Props: onBack. localStorage key: willow-age-mode
│   │   ├── (MISSING) VoiceScreen.tsx       # Voice memo recorder with 4 effects
│   │   │                                  # Props: onBack. Shows TAP TO RECORD/STOP, Recording...
│   │   ├── (MISSING) MoodTracker.tsx       # 5-level mood: Tired/Sad/Okay/Happy/Amazing
│   │   │                                  # Props: onBack. Reason follow-up, encouragement, sparkline chart
│   │   ├── (MISSING) MemoryGame.tsx        # Memory card matching. 4 themes, locked/unlocked, high score
│   │   │                                  # Props: onBack. Animals (default), Space, Nature, Food
│   │   ├── (MISSING) HearthOverlay.tsx     # Spoon overlay. Props: onDismiss. Fire/candle emoji, 6 dots
│   │   │                                  # Reads willow-bio for spoon count
│   │   ├── (MISSING) FamilyScreen.tsx      # 4 contact cards: Dad, Nana, Uncle Tony, Auntie
│   │   │                                  # Props: onBack. Calling state, last contact, ripple effect
│   │   ├── (MISSING) FamilyMesh.tsx        # 3 family members: Bash, Willow, Dad
│   │   │                                  # Online/offline status, mood display, avatar emoji
│   │   ├── (MISSING) DrawScreen.tsx        # Canvas drawing. 3 brushes (Round/Square/Spray),
│   │   │                                  # 3 patterns (None/Grid/Dots/Lines), stickers, undo/redo/clear/save/share
│   │   │                                  # Props: onBack
│   │   ├── (MISSING) CatchGame.tsx         # "Catch the Sparkle!" — emoji matching game
│   │   │                                  # Props: onBack. 3 difficulties (Easy:5/Medium:8/Hard:12 to win)
│   │   ├── (MISSING) BubblesGame.tsx       # "Pop Bubbles!" — click bubble game
│   │   │                                  # Props: onBack. 20 to win, combo system, stars, progress bar
│   │   ├── (MISSING) AudioEngine.ts        # Sound effects module. Exports: playStamp, playPop,
│   │   │                                  # playBubblePop, playMiss, playWin, playFlip, playCatch, playSuccess
│   │   └── (MISSING) CompanionVoice.ts     # Speech synthesis. Exports: speak(), phosSpeakWelcome()
```

## Component Contract Detail (from test specs)

### BioState type & bioStore
```typescript
interface BioState {
  spoons: number;           // 0-6, default 5
  calcium: number;          // default 8.2
  hrv: number;              // heart rate variability, default 45
  lastPing: number;         // timestamp
  presenceColor: string;    // default '#6CB4EE'
  moodHistory: Array<{ timestamp: number; mood: number }>;  // max 30 entries
}
```
- `loadBio()` — merge stored JSON with defaults. Handle corrupt JSON gracefully.
- `saveBio(bio)` — JSON.stringify to `willow-bio`
- `isLowSpoons(bio)` — spoons <= 2
- `isCriticalSpoons(bio)` — spoons <= 1
- `getMoodTrend(bio)` — compare first third vs last third of moodHistory. 'rising', 'falling', or 'stable'. Requires ≥3 entries.
- `recordMood(bio, mood)` — add mood entry, increment spoons if mood >= 3 (cap at 6), trim to 30
- `recordPing(bio)` — decrement spoons by 1 (min 1), update lastPing

### AgeSelectScreen
```tsx
<AgeSelectScreen onBack={() => void}>
```
- 3 buttons: "Willow (6)" / "Auto" / "Bash (10)"
- Descriptions: "Pre-reader • Big visuals • Simple" / "Adapts to you" / "Games • Molecules • Badges"
- Default selection: Auto (class `spoiler-active`)
- Click changes selection, persists to `willow-age-mode`
- Selected button gets background `#E0F7FA`
- Reads persisted mode from localStorage on mount
- Header: "🧸 Who is using Willow?"
- BACK button calls onBack

### VoiceScreen
```tsx
<VoiceScreen onBack={() => void}>
```
- Title: "Voice Messages!"
- Record button: cycles "TAP TO RECORD" → "TAP TO STOP" with recording indicator (`.recording-indicator`, `.recording-dot`)
- 4 effect buttons: Normal / Chipmunk / Robot / Deep (`.effect-active` on selected)
- Hint when no memos: "Tap the button to record a message for Dad"
- Mocks `AudioEngine`: playStamp, playPop, playBubblePop

### MoodTracker
```tsx
<MoodTracker onBack={() => void}>
```
- Title: "How are you?"
- 5 mood bar buttons (`.mood-bar-btn`): Tired / Sad / Okay / Happy / Amazing
- Spoon display (`.spoon-display`)
- After selecting mood: "Why do you feel..." follow-up with reason buttons (`.reason-btn`)
- After selecting reason: SAVE button appears
- After save: encouragement message (`.encouragement`)
- Persists to `willow-moods` as JSON array
- Shows mood chart (`.mood-chart` or `.sparkline`) when history exists in localStorage
- Mocks AudioEngine: playPop, playSuccess, playStamp, playBubblePop

### MemoryGame
```tsx
<MemoryGame onBack={() => void}>
```
- Title: "Memory Match"
- 4 theme buttons: Animals / Space / Nature / Food
- Card grid (`.memory-card`), flipped state (`.memory-card-flipped`)
- Max 2 cards flipped at once
- Moves counter: "Moves: 0"
- High score: "High:" + value from `willow-memory-scores`
- Theme label: "Animals theme" (default)
- Locked themes: button has `disabled` attribute. Unlocked via `willow-memory-unlocked`
- Unlocking: score ≤50 on Animals unlocks Space, etc.
- Mocks AudioEngine: playMiss, playWin, playFlip

### HearthOverlay
```tsx
<HearthOverlay onDismiss={() => void}>
```
- Shows fire emoji 🔥 for normal spoons, candle 🕯️ for low spoons (spoons≤1 from `willow-bio`)
- "Touch anywhere to send warmth" / "Rest. You are held."
- 6 spoon dots (`.hearth-spoon-dot`), active count from spoons (`.spoon-on`)
- Dismiss via "Pick something" label button
- Renders `<FamilyMesh />` component
- Mocks CompanionVoice (speak, phosSpeakWelcome) and FamilyMesh

### FamilyScreen
```tsx
<FamilyScreen onBack={() => void}>
```
- Title: "Family"
- 4 contact cards: Dad / Nana / Uncle Tony / Auntie
- Hint: "Tap someone to say hi"
- Tapping shows "Calling..." state
- Ripple effect (`.ripple-effect`)
- Avatar initials (`.avatar-letter`)
- Persists last contact time to `willow-last-contact` JSON
- Shows "Just now" after tapping

### FamilyMesh
```tsx
<FamilyMesh>
```
- Title: "Family Presence"
- 3 members: Bash / Willow / Dad
- Avatar emoji (`.family-avatar-emoji`)
- Online status: "Online" with `.online-dot` for online members
- "Last seen..." for offline members
- "Feeling good" mood text for members with mood data

### DrawScreen
```tsx
<DrawScreen onBack={() => void}>
```
- Title: "Draw!"
- Canvas (`.draw-canvas`)
- 3 brushes: Round / Square / Spray
- 3 patterns: None / Grid / Dots / Lines
- Actions: Undo / Redo / Clear / Save / Share
- Sticker palette (`.sticker-palette`) with `.sticker-btn` items
- Mocks AudioEngine: playStamp, playPop, playBubblePop

### CatchGame
```tsx
<CatchGame onBack={() => void}>
```
- Title: "Catch the Sparkle!"
- Score: "Score: 0"
- Difficulty: Easy (5 to win) / Medium (8) / Hard (12)
- Target emoji display (`.game-target-emoji`), "Find this one:"
- 3 option buttons (`.game-option`), one matches target
- Feedback emoji on miss (`.game-feedback`)
- Win screen: "PLAY AGAIN" + "CHOOSE ANOTHER GAME" + stars
- High score from `willow-catch-high`
- Mocks AudioEngine: playCatch, playMiss, playSuccess

### BubblesGame
```tsx
<BubblesGame onBack={() => void}>
```
- Title: "Pop Bubbles!"
- Score: "Popped: 0"
- Progress: "0/20" + progress bar (`.progress-bar-wrap`)
- Hint: "Pop 20 to win"
- Bubbles spawn over time (`.bubble`)
- Combo display (`.combo-display`) when combo > 2
- Win screen with stars (`.stars-display`, `.star-icon`, `.star-earned`)
- High score from `willow-bubbles-high`
- Mocks AudioEngine

### AudioEngine
- Sound effect export functions: playStamp, playPop, playBubblePop, playMiss, playWin, playFlip, playCatch, playSuccess, getCtx
- Web Audio API oscillator-based sounds

### CompanionVoice
- Speech synthesis: speak(), phosSpeakWelcome()
- Uses SpeechSynthesisUtterance

## Implementation Order (Recommended)

1. `stores/bioStore.ts` — foundational, all tests deterministic
2. `AudioEngine.ts` — mocked everywhere, implement as real Web Audio API
3. `CompanionVoice.ts` — speech synthesis wrapper
4. `AgeSelectScreen.tsx` — simple, self-contained
5. `FamilyMesh.tsx` — standalone, no onBack prop complexity
6. `HearthOverlay.tsx` — integrates bioStore + FamilyMesh
7. `MoodTracker.tsx` — most complex state flow (mood→reason→save→chart)
8. `VoiceScreen.tsx` — recording state + effect selection
9. `FamilyScreen.tsx` — contact cards with calling state
10. `DrawScreen.tsx` — canvas + brush + sticker system
11. `MemoryGame.tsx` — card matching + theme unlock logic
12. `CatchGame.tsx` — emoji matching + difficulty
13. `BubblesGame.tsx` — spawn + pop + combo
14. `App.tsx` — root component wiring everything together

## Quality Gates

- `pnpm test` (vitest) must pass — all tests green
- `tsc --noEmit` must pass — TypeScript strict mode
- No `any` types unless absolutely necessary
- All localStorage reads must have try/catch for corrupt data
- No external dependencies beyond React, Testing Library, Vitest
- All components must handle missing localStorage gracefully (no crash on first visit)
- CSS class names must match test expectations exactly

## Deployment (Future)

Not yet deployed — no Cloudflare project or wrangler config exists. When ready:
```bash
cd apps/willow
npm install
npm run build    # Vite builds to dist/
# Deploy as Cloudflare Pages
```

Currently has no `package.json` — need `pnpm init` before implementation.
