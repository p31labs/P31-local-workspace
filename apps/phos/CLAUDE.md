# PHOS Ambient Workspace — Controlled Work Package

## Executive Summary

Refactor the PHOS main screen from a "submarine CRT" hacker terminal to an ambient, glassmorphic workspace inspired by Gemini Neural Expressive (2026). The implementation is grounded in peer-reviewed UX research and optimized for neurodivergent users on low-spec hardware.

**Core constraint:** Zero jargon on the main view. Complexity is hidden in the Magic Drawer. UI is a pure CSS state machine driven by `data-spoons`, `data-theme`, `data-accessibility`.

---

## Research-Backed Optimizations (from 2026 deep-web survey)

### 1. GPU Starfield — will-change + translateZ(0)
- Source: Animation Machine (May 2026), CSSTools (Feb 2026), KeyCDN
- Animate only `transform` and `opacity` (compositor-only properties)
- Add `will-change: transform, opacity` to star nodes (warns browser before animation)
- Add `transform: translateZ(0)` to force GPU compositing layer
- Add `backface-visibility: hidden` to prevent flicker during drift
- Keep animated DOM nodes under 100 total; max 3 compositing layers
- Remove `will-change` after animation ends (not applicable for infinite animations — keep it)

### 2. Nanostore Hydration — Preventing "Flash of Wrong State"
- Source: @nanostores/react v1.1.0 docs (Mar 2026), Github Issues
- `useStore()` with `ssr: 'initial'` option prevents hydration errors
- `persistentMap` from `@nanostores/persistent` for localStorage
- Bind spoons state to nanostore directly, not `useState` — prevents flash on reload
- Already in package.json: `@nanostores/persistent@^1.3.4`

### 3. Glassmorphism — Rule #2: No Text on Raw Glass
- Source: VRWAN (Feb 2026), Axess Lab (Jun 2026), Codexical (Apr 2026)
- All glass panels containing body text MUST have `.glass-text-scrim`
- `prefers-reduced-transparency` media query fallback
- Add tint to glass backgrounds (not just blur) for stable contrast
- Test against 5 background extremes

### 4. Accessibility — Aria-labels on Icon Buttons
- Source: WCAG 4.1.2 (Mar 2026), Axess Lab
- Every icon-only button MUST have `aria-label` describing the action verb
- Add `aria-hidden="true"` on the `<svg>` itself (screen reader reads the label, not the SVG)
- Touch targets minimum 44x44px

---

## Current Codebase State (surveyed)

| File | Status | Issue |
|------|--------|-------|
| `src/store/accessibility.ts` | ✅ Exists | Nanostore for a11y settings — correct pattern |
| `src/store/spoons.ts` | ❌ Missing | Need persistent spoons store |
| `src/components/PHOSWorkspace.tsx` | ✅ Exists | Uses `useState(4)` — hydration flash on reload; no nanostore |
| `src/components/PHOSPromptBar.tsx` | ✅ Exists | Send button SVG missing `aria-hidden`, no `aria-label` on submit |
| `src/components/PHOSSidebar.tsx` | ✅ Exists | Already has aria-labels ✓; glass rounded-2xl |
| `src/components/PHOSMagicDrawer.tsx` | ✅ Exists | No glass-text-scrim; close button missing aria-label |
| `src/components/PHOSOrb.tsx` | ✅ Exists | GPU pulse animation — add translateZ |
| `src/components/ambient/` | ✅ Exists | HexRain, DustMotes, EmberParticles, etc. — none GPU-optimized |
| `src/styles/starfield.css` | ❌ Missing | Need GPU-optimized starfield styles |
| `src/styles/glass.css` | ❌ Missing | Need glass-text-scrim + thickness tokens |
| `src/styles/globals.css` | ✅ Exists | Has glass/pill utils, keyframes — needs `prefers-reduced-transparency` |
| `src/styles/themes.css` | ✅ Exists | 4 biological themes ✓ |
| `src/styles/spacing.css` | ✅ Exists | Spoon-driven spacing ✓ |
| `src/styles/motion.css` | ✅ Exists | Tiered durations, Crisis override ✓ |
| `src/styles/dyslexia.css` | ✅ Exists | Structural overrides ✓ |
| `tailwind.config.mjs` | ✅ Exists | Maps to CSS vars ✓ |
| `package.json` | ✅ Exists | nanostores/persistent already installed ✓ |
| `index.astro` | ✅ Exists | `client:only="react"` — no SSR hydration issues |

---

## Task Checklist

### Phase 1 — P0: Critical Fixes (do first)

- [ ] **P0.1** Create `src/store/spoons.ts` — persistent nanostore
- [ ] **P0.2** Update `PHOSWorkspace.tsx` — use nanostore, no hydration flash
- [ ] **P0.3** Add `will-change + translateZ + backface-visibility` to all ambient animations in `src/components/ambient/*.tsx`
- [ ] **P0.4** Create `src/styles/glass.css` — glass-text-scrim, thickness tokens, `prefers-reduced-transparency`
- [ ] **P0.5** Update `src/styles/globals.css` — import glass.css, add `prefers-reduced-transparency` fallback
- [ ] **P0.6** Update `PHOSMagicDrawer.tsx` — wrap content in glass-text-scrim, add aria-label to close button, add `aria-hidden="true"` to SVG
- [ ] **P0.7** Update `PHOSPromptBar.tsx` — add `aria-hidden="true"` to send SVG, add `aria-label` to submit button, ensure 44x44px touch target

### Phase 2 — P1: Polish & Complete

- [ ] **P1.1** Verify `PHOSSidebar.tsx` — SVG icons have `aria-hidden="true"`, touch targets 44x44
- [ ] **P1.2** Verify `index.astro` — proper meta tags, theme-color, favicon
- [ ] **P1.3** Build verification — `npm run build` passes cleanly

### Phase 3 — P2: Deploy

- [ ] **P2.1** `npm run build && npm run typecheck` pass
- [ ] **P2.2** Deploy to Cloudflare Pages via `npx wrangler pages deploy`

---

## Detailed Implementation

### P0.1 — `src/store/spoons.ts`

```typescript
import { persistentAtom } from '@nanostores/persistent';

export type SpoonsState = 0 | 1 | 2 | 3 | 4 | 5;

export const spoonsStore = persistentAtom<SpoonsState>('phos:spoons', '4', {
  encode: JSON.stringify,
  decode: JSON.parse,
});
```

### P0.2 — `src/components/PHOSWorkspace.tsx` (key changes)

Replace:
```typescript
const [spoons, setSpoons] = useState<SpoonsState>(4);
```
With:
```typescript
import { useStore } from '@nanostores/react';
import { spoonsStore } from '../store/spoons';

const spoons = useStore(spoonsStore);
```

Replace `setSpoons(n)` calls with:
```typescript
spoonsStore.set(n);
```

### P0.3 — GPU acceleration for ambient components

Add to every animated element in `src/components/ambient/*.tsx`:

```typescript
style={{
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
}}
```

Files to update:
- `AtomOrbitals.tsx`
- `DustMotes.tsx`
- `EmberParticles.tsx`
- `HexRain.tsx`
- `PixelGrid.tsx`
- `VagusBreath.tsx`
- `VaultScanlines.tsx`
- Also check for floating/pulsing class-based animations in `PHOSWorkspace.tsx`

### P0.4 — `src/styles/glass.css` (new file)

```css
@layer components {
  .glass-text-scrim {
    position: relative;
    isolation: isolate;
  }

  .glass-text-scrim::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--phos-bg) 60%, transparent) 0%,
      color-mix(in srgb, var(--phos-bg) 30%, transparent) 50%,
      color-mix(in srgb, var(--phos-bg) 60%, transparent) 100%
    );
    opacity: 0.85;
    border-radius: inherit;
    z-index: -1;
    pointer-events: none;
  }

  .glass-text-scrim > * {
    position: relative;
    z-index: 1;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .phos-glass,
  .phos-glass-strong,
  .phos-pill,
  .glass-text-scrim {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: color-mix(in srgb, var(--phos-bg) 85%, transparent) !important;
  }
}
```

### P0.5 — `src/styles/globals.css` changes

Add after existing imports:
```css
@import './glass.css';
```

Update `.phos-glass` and `.phos-glass-strong` to use tint (add `background` using `color-mix`):
```css
.phos-glass {
  background: color-mix(in srgb, var(--phos-bg) 85%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--phos-border);
}
```

### P0.6 — `src/components/PHOSMagicDrawer.tsx` changes

1. Wrap content div in `glass-text-scrim` class
2. Add `aria-label="Close panel"` to close button
3. Add `aria-hidden="true"` to close button SVG
4. Ensure touch target 44x44px on close button

### P0.7 — `src/components/PHOSPromptBar.tsx` changes

1. Add `aria-hidden="true"` to send SVG `<svg>` element
2. Add `aria-label="Send message"` to submit button
3. Ensure submit button has min 44x44px touch target (`p-3` instead of `p-1.5`)
4. Add `aria-label="Type your message"` to input

---

## Build & Deploy

```bash
cd /home/p31/P31-local-workspace/phos

# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name phos

# Verify
curl https://phos.p31ca.org
```

---

## Success Criteria

- [ ] `npm run build` exits with code 0 (no TS errors, no bundling errors)
- [ ] `npm run typecheck` clean
- [ ] Zero hydration flash: reload page at Crisis spoons (0), page loads at Crisis not Quantum
- [ ] Screen reader: each icon button announces distinct action ("Send message", "Close panel", etc.)
- [ ] GPU: Chrome DevTools Layers panel shows star nodes on composited layers
- [ ] Glass: text remains readable over drifting starfield (WCAG 4.5:1 min)
- [ ] Reduced transparency: `prefers-reduced-transparency: reduce` disables all backdrop-filter
