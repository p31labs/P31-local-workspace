# SONNET INTEGRATION GUIDE — LITTLE DETAILS
## Drop these files into src/config/ and wire them up
## Date: March 3, 2026 | Ship: March 10

---

## FILES TO ADD

Copy these 6 files into `src/config/`:

| File | Purpose |
|------|---------|
| `funFacts.ts` | Molecule fun facts — one per formula |
| `questMessages.ts` | Quest step congrats + bridge lines |
| `questNarrative.ts` | Quest chain narrative arcs for QuestBlock |
| `bashium.ts` | Bash's secret element config + all text content |
| `willium.ts` | Willow + Will's secret element config + all text content |
| `easterEggs.ts` | Console log, footer, first molecule, confetti config, sound frequencies |

---

## WIRING — IN ORDER OF PRIORITY

### 1. Fun Facts in CompletionModal

In the component that shows after molecule completion (CompletionModal, CompletionScreen, or whatever it's called):

```typescript
import { getFunFact } from '../config/funFacts';

// In the render, after the formula display:
const fact = getFunFact(completedFormula); // use the Hill system key
{fact && (
  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: 8 }}>
    {fact}
  </p>
)}
```

**NOTE:** Verify your molecule dictionary keys match the keys in `funFacts.ts`. Ammonia might be `NH3` or `H3N` depending on your Hill system implementation. Check and adjust.

### 2. Quest Messages in CompletionModal

When a quest step advances, show the congrats/bridge lines instead of (or in addition to) the generic completion:

```typescript
import { getQuestMessage } from '../config/questMessages';

// After quest step is detected:
const qMsg = getQuestMessage(quest.id, stepIndex);
{qMsg && (
  <div style={{ textAlign: 'center', marginTop: 12 }}>
    <p style={{ fontSize: 16, fontWeight: 600, color: '#4ade80' }}>{qMsg.congratsLine}</p>
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{qMsg.bridgeLine}</p>
  </div>
)}
```

### 3. Console Easter Egg

In `main.tsx` or `App.tsx`, at the top level:

```typescript
import { logBirthdayConsole } from './config/easterEggs';
logBirthdayConsole();
```

One line. Done.

### 4. Wonky Footer

In ModeSelect.tsx or the idle state screen:

```typescript
import { WONKY_FOOTER } from './config/easterEggs';

<p style={{
  position: 'fixed',
  bottom: 12,
  width: '100%',
  textAlign: 'center',
  fontSize: 11,
  fontStyle: 'italic',
  color: 'rgba(255,255,255,0.3)',
  pointerEvents: 'none',
}}>
  {WONKY_FOOTER}
</p>
```

### 5. First Molecule Message

In the completion handler (gameStore.ts or CompletionModal):

```typescript
import { FIRST_MOLECULE } from './config/easterEggs';

// Check on first-ever completion:
const isFirst = !localStorage.getItem(FIRST_MOLECULE.storageKey);
if (isFirst) {
  localStorage.setItem(FIRST_MOLECULE.storageKey, '1');
  // Show special overlay or modify the toast:
  // line1: FIRST_MOLECULE.line1
  // line2: FIRST_MOLECULE.line2
}
```

### 6. Secret Elements — Bashium & Willium

Two secret elements. Each unlocks after completing a quest chain.

| Element | Symbol | Unlocks After | Appears In |
|---------|--------|---------------|------------|
| Bashium | Ba | Genesis (Seed) complete | Seed palette |
| Willium | Wi | Kitchen (Sprout) complete | Sprout palette |

The Posner Quest (Sapling) has no secret element — the Posner molecule itself IS the reward.

**a) Add both to elements config** (wherever H, O, C, etc. are defined):
```typescript
import { BASHIUM_ELEMENT } from '../config/bashium';
import { WILLIUM_ELEMENT } from '../config/willium';

// In the elements array — gate by quest completion + current mode
const secretElements = [
  ...(genesisComplete && currentMode === 'seed' ? [BASHIUM_ELEMENT] : []),
  ...(kitchenComplete && currentMode === 'sprout' ? [WILLIUM_ELEMENT] : []),
];
const elements = [...baseElements, ...secretElements];
```

**b) Gate palette visibility:**
Each secret element only shows in its home mode after the corresponding quest chain completes.

**c) Wire unlock toasts — both elements:**
```typescript
import { BASHIUM } from '../config/bashium';
import { WILLIUM } from '../config/willium';

// In the quest chain completion handler:
if (questId === 'genesis') {
  showToast(BASHIUM.unlockToast.line1);
  setTimeout(() => showToast(BASHIUM.unlockToast.line2), 2000);
}
if (questId === 'kitchen') {
  showToast(WILLIUM.unlockToast.line1);
  setTimeout(() => showToast(WILLIUM.unlockToast.line2), 2000);
}
```

**d) Wire completion messages — check for EITHER secret element:**
```typescript
import { BASHIUM } from '../config/bashium';
import { WILLIUM } from '../config/willium';

// Check if completed molecule contains a secret element:
const hasBashium = atoms.some(a => a.symbol === 'Ba');
const hasWillium = atoms.some(a => a.symbol === 'Wi');

if (hasBashium) {
  // Show BASHIUM.completionMessage lines + DOUBLE confetti
}
if (hasWillium) {
  // Show WILLIUM.completionMessage lines + DOUBLE confetti
}
```

### 7. Quest Narratives in QuestBlock

If QuestBlock.tsx exists (from the execution brief), wire the narrative:

```typescript
import { getQuestNarrative } from '../config/questNarrative';

const narrative = getQuestNarrative(quest.id);

// In the expanded panel, before the step list:
{narrative && (
  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', marginBottom: 8 }}>
    {narrative.intro}
  </p>
)}

// After each completed step, show its narrative:
{narrative && isDone && (
  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 20 }}>
    {narrative.stepNarratives[i]}
  </p>
)}

// After chain complete:
{isComplete && narrative && (
  <p style={{ color: '#4ade80', fontSize: 15, fontWeight: 600, textAlign: 'center', marginTop: 12 }}>
    {narrative.completionLine}
  </p>
)}
```

### 8. Confetti

Lightweight CSS confetti (no canvas needed):

```typescript
import { CONFETTI } from './config/easterEggs';

function spawnConfetti(count: number = CONFETTI.normalCount) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const color = CONFETTI.colors[Math.floor(Math.random() * CONFETTI.colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = 4 + Math.random() * 8;
    piece.style.cssText = `
      position:absolute;top:-20px;left:${left}%;
      width:${size}px;height:${size * 1.5}px;
      background:${color};border-radius:1px;
      animation:confetti-fall ${1.5 + Math.random()}s ease-in ${delay}s forwards;
    `;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), CONFETTI.duration + 500);
}

// Add this CSS to global styles or inject via style tag:
// @keyframes confetti-fall {
//   0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//   100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
// }
```

Call `spawnConfetti()` on normal completion, `spawnConfetti(CONFETTI.questCompleteCount)` on quest chain completion, `spawnConfetti(CONFETTI.bashiumCount)` on Bashium.

### 9. Element Sound Frequencies

In `sound.ts`, update `playAtomPlace()` to use per-element frequencies:

```typescript
import { ELEMENT_TONES } from '../config/easterEggs';

export function playAtomPlace(elementSymbol?: string): void {
  const ctx = getCtx();
  if (!ctx) return;
  const freq = (elementSymbol && ELEMENT_TONES[elementSymbol]) || 349.23;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}
```

---

## VERIFICATION

After all integrations:

```bash
npx tsc --noEmit        # zero errors
npx vitest run           # 486+ pass
npx vite build           # under 1.5 MB
```

Manual checks:
- [ ] Complete H₂ in Seed → fun fact appears
- [ ] Complete H₂ (first ever) → "⚡ You made your first molecule!" overlay
- [ ] Complete H₂ as genesis step 1 → "Perfect! Two hydrogens holding hands."
- [ ] Complete all 4 genesis steps → Bashium unlock toast
- [ ] Ba appears in Seed palette after genesis complete
- [ ] Build a molecule with Ba → birthday message + double confetti
- [ ] Complete all 4 kitchen steps → Willium unlock toast
- [ ] Wi appears in Sprout palette after kitchen complete
- [ ] Build a molecule with Wi → Willium message + double confetti
- [ ] Open DevTools console → birthday message visible
- [ ] "It's okay to be a little wonky. 🔺" visible on mode select
- [ ] Each element plays different tone when placed
- [ ] Mode select → expanded quest shows narrative intro

---

*The details are the game. The game is the bridge. The bridge is love.*
