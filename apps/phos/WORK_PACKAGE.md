# PHOS Ambient Workspace — Final Optimization Work Package

## Executive Summary

Refactor `PHOSCore.tsx` from a monolithic prototype to a production-hardened ambient workspace. The implementation is grounded in 2026 web research across GPU compositing, nanostore hydration, WCAG accessibility, and glassmorphism contrast enforcement.

**Core constraint:** The main floor must remain pristine — zero jargon, zero popups. All complexity lives in the Magic Drawer. The starfield itself serves as the ambient notification layer.

## Research-Backed Guidelines

### 1. GPU Performance — Starfield Compositing (Animation Machine, May 2026; CSS GPU Acceleration, Jan 2026; Progressive Robot, May 2026)

- **Only animate `transform` and `opacity`** — these are compositor-only properties that never trigger layout or paint. Everything else (`width`, `height`, `top`, `left`, `filter`) runs on the main thread and blocks JavaScript.
- **`will-change: transform, opacity`** warns the browser to promote the element to its own GPU compositing layer *before* the animation starts. Apply it on the star nodes, not the container.
- **`transform: translateZ(0)`** forces GPU compositing layer promotion as a fallback for browsers that ignore `will-change`.
- **`backface-visibility: hidden`** prevents flicker during 3D transform drift on Safari and Firefox.
- **Keep composited layers under 20** to avoid video memory bloat on low-end mobile devices.
- **Scale node count by `navigator.hardwareConcurrency`**: `Math.min(base, Math.max(15, base * (cores / 8)))`. 4-core devices get half the stars of 8-core.
- **Wrap `SmartStarfield` in `React.memo`** to prevent re-render when only `activeNodes` changes (which happens on every mesh event).

### 2. State Hydration — Preventing Flash of Wrong State (nanostores/react SSR docs, TkDodo useSyncExternalStore guide)

- **`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`** is the canonical React 19 API for subscribing to external stores. The third argument (server snapshot) prevents hydration mismatch.
- **`getServerSnapshot` must return the initial/default value**, not the localStorage value. This guarantees server and client first render produce identical HTML.
- **`@nanostores/persistent`** with `persistentAtom` stores to localStorage and syncs across tabs. Subscribe via `useSyncExternalStore` directly (no `@nanostores/react` dependency needed).
- **Lazy initialization**: `useState(() => { if (typeof window === 'undefined') return 4; ... })` avoids `useEffect` flash entirely.

### 3. Accessibility — Icon Buttons & Dynamic Content (WCAG 4.1.2, SubUX Best Practices, IconVectors Tutorial, Axess Lab)

- **Every icon-only `button` MUST have `aria-label`** describing the action verb (e.g., `aria-label="Send message"`, *not* `aria-label="send button"`).
- **Every `<svg>` inside a labelled button MUST have `aria-hidden="true"`** — screen readers should announce the button label, not the SVG.
- **Dynamic content (mesh events) MUST be wrapped in `aria-live="polite"` with `role="log"`** so screen readers announce new events without interrupting the user.
- **Focus management**: When the Magic Drawer opens, focus moves to the first interactive element inside. When it closes, focus returns to the toggle button. Use `useRef` + `useEffect`.
- **Touch targets**: Minimum 44×44px for all interactive elements (WCAG 2.5.8). Use `p-3` (12px padding) on 20px icons.
- **`focus-visible` outlines** must be visible on all interactive elements. Do not set `outline: none` without a custom `:focus-visible` replacement.

### 4. Glassmorphism — WCAG Contrast Enforcement (Codexical, Apr 2026; Axess Lab; Newtarget Web Insights)

- **Rule #2: Never put body text directly on raw glass.** The `glass-text-scrim` gradient overlay is mandatory on any glass panel containing body text.
- **`prefers-reduced-transparency: reduce` must disable ALL `backdrop-filter` and fall back to a tinted solid background.** This is non-negotiable for users with vestibular disorders.
- **Test against 5 background extremes**: bright photo, dark photo, textured, gradient, solid white. The scrim must maintain 4.5:1 contrast ratio in all cases.
- **One thickness per surface type:** Glass on glass (drawer overlay) needs stronger tint (+10% opacity) than glass on solid.

### 5. Smart Mesh Notification — Ambient Starfield Feedback

- The starfield *is* the notification layer. When a mesh event occurs (intercept/sync/error), random nodes flare with increased opacity, scale (2.5×), and box-shadow (accent-colored glow), then decay after 2 seconds.
- **No popups, no toasts, no banners.** The ambient layer handles it. The event text is logged silently in the Magic Drawer for users who open it.
- **Event deduplication**: Use a `Set<string>` with a `type:message` key and a 5-second TTL to prevent repeated events from flooding the starfield.

## Task Checklist

### Phase 1 — P0: Critical Fixes

| Task | Files | Status |
|------|-------|--------|
| P0.1 Split PHOSCore.tsx into modular files | `PHOSShell.tsx`, `SmartStarfield.tsx`, `MagicDrawer.tsx`, `PhosButton.tsx` | ⬜ |
| P0.2 GPU-accelerate starfield nodes | `SmartStarfield.tsx` (will-change, translateZ, backface-visibility, React.memo) | ⬜ |
| P0.3 Scale starfield nodes by device capability | `SmartStarfield.tsx` (navigator.hardwareConcurrency) | ⬜ |
| P0.4 Fix hydration flash — persistent spoons state | `PHOSShell.tsx`, `store/spoons.ts` | ⬜ |
| P0.5 Add glass-text-scrim to Magic Drawer content | `MagicDrawer.tsx` | ⬜ |
| P0.6 Add prefers-reduced-transparency fallback | `globals.css`, `glass.css` | ⬜ |
| P0.7 Add aria-live to mesh event log | `MagicDrawer.tsx` | ⬜ |
| P0.8 Focus management for Magic Drawer | `MagicDrawer.tsx` | ⬜ |
| P0.9 Event deduplication for mesh notifications | `PHOSShell.tsx` (triggerMeshEvent) | ⬜ |

### Phase 2 — P1: Polish & Verification

| Task | Files | Status |
|------|-------|--------|
| P1.1 Verify all icon buttons have aria-label | `PHOSShell.tsx` | ⬜ |
| P1.2 Verify all SVGs have aria-hidden="true" | `PHOSShell.tsx` | ⬜ |
| P1.3 Verify 44×44px touch targets | `PHOSShell.tsx` | ⬜ |
| P1.4 Verify focus-visible outlines | `globals.css` | ⬜ |
| P1.5 Test Crisis mode (spoons=0) disables all interactions | `PHOSShell.tsx` | ⬜ |
| P1.6 Test mesh event — starfield flare + drawer log | `SmartStarfield.tsx`, `MagicDrawer.tsx` | ⬜ |

### Phase 3 — P2: Build & Deploy

| Task | Command | Status |
|------|---------|--------|
| P2.1 TypeScript check | `npx tsc --noEmit` | ⬜ |
| P2.2 Build | `npm run build` | ⬜ |
| P2.3 Deploy | `npx wrangler pages deploy dist --project-name phos` | ⬜ |
| P2.4 Verify | `curl https://phos.p31ca.org` | ⬜ |

## Detailed Implementation

### P0.1 — File Split

Current monolithic file `PHOSCore.tsx` (~400 lines) should be split into:

```
src/components/
├── PHOSShell.tsx          # Main container (was PHOSCore.tsx)
├── SmartStarfield.tsx     # Starfield component (extracted)
├── MagicDrawer.tsx        # Right panel (extracted)
└── PhosButton.tsx         # Button component (extracted)
```

Each extracted component gets its own file with its own interface. The `handleSend`, `triggerMeshEvent`, `meshEvents`, and `activeNodes` state live in `PHOSShell.tsx` and are passed down as props.

<details>
<summary><b>SmartStarfield.tsx — Full optimized component</b></summary>

```tsx
import React, { useMemo } from 'react';

interface StarfieldProps {
  spoons: SpoonsState;
  theme: ThemeState;
  activeNodes: number[];
}

const SmartStarfield = React.memo(({ spoons, theme, activeNodes }: StarfieldProps) => {
  const nodes = useMemo(() => {
    if (spoons === 0 || theme === 'crisis') return [];

    const baseCount =
      theme === 'sanctuary' ? 25 :
      theme === 'bridge' ? 45 :
      75;

    // Scale by device capability
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
    const scaled = Math.min(baseCount, Math.max(15, Math.floor(baseCount * (cores / 8))));

    return Array.from({ length: scaled }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.85 ? 3 : 1.5,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -20,
    }));
  }, [theme, spoons]);

  if (spoons === 0 || nodes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {nodes.map((node) => {
        const isActive = activeNodes.includes(node.id);
        return (
          <div
            key={node.id}
            className="absolute rounded-full"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              animation: `drift ${node.duration}s ease-in-out infinite`,
              animationDelay: `${node.delay}s`,
              backgroundColor: 'var(--phos-primary)',
              opacity: isActive ? 1 : 0.15,
              boxShadow: isActive ? '0 0 20px 6px var(--phos-accent)' : 'none',
              transition: 'opacity 400ms ease-out, transform 400ms ease-out, box-shadow 400ms ease-out',
              transform: isActive ? 'scale(2.5)' : 'scale(1)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
            }}
          />
        );
      })}
    </div>
  );
});

SmartStarfield.displayName = 'SmartStarfield';
```

</details>

<details>
<summary><b>P0.4 — Persistent Spoons State (hydration-safe)</b></summary>

```tsx
// store/spoons.ts
import { persistentAtom } from '@nanostores/persistent';

export type SpoonsState = 0 | 1 | 2 | 3 | 4 | 5;
export type ThemeState = 'quantum' | 'bridge' | 'sanctuary' | 'crisis';

export const spoonsStore = persistentAtom<SpoonsState>('phos:spoons', 4, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// In PHOSShell.tsx
const spoons = useSyncExternalStore(
  spoonsStore.subscribe,
  () => spoonsStore.get(),
  () => 4, // server snapshot — always 4 (Quantum), prevents hydration mismatch
);
```

</details>

<details>
<summary><b>P0.5/P0.7 — MagicDrawer with glass scrim + aria-live</b></summary>

```tsx
<div ref={drawerRef} className="fixed right-0 top-0 bottom-0 w-80 phos-glass border-l border-y-0 border-r-0 transform transition-transform duration-500 ease-out z-30 flex flex-col">
  <div className="flex-1 overflow-y-auto p-6 space-y-8 glass-text-scrim">
    {/* Mesh notifications with aria-live */}
    <div className="space-y-3" aria-live="polite" role="log" aria-label="Mesh notifications">
      {meshEvents.length === 0 ? (
        <p className="text-xs opacity-40 font-light">Network is quiet.</p>
      ) : (
        meshEvents.map(event => (
          <div key={event.id} className="text-xs p-3 rounded-lg bg-white/5 flex gap-3 items-start">
            <span aria-hidden="true" style={{ color: event.type === 'intercept' ? 'var(--phos-accent)' : 'var(--phos-primary)' }}>
              {event.type === 'intercept' ? '◆' : '●'}
            </span>
            <span className="opacity-80 font-light leading-relaxed">{event.message}</span>
          </div>
        ))
      )}
    </div>
  </div>
</div>
```

</details>

<details>
<summary><b>P0.8 — Focus Management for Magic Drawer</b></summary>

```tsx
const drawerRef = useRef<HTMLDivElement>(null);
const toggleRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (drawerOpen && drawerRef.current) {
    const firstFocusable = drawerRef.current.querySelector('button, input, [tabindex="0"]');
    if (firstFocusable) (firstFocusable as HTMLElement).focus();
  } else if (!drawerOpen && toggleRef.current) {
    toggleRef.current.focus();
  }
}, [drawerOpen]);
```

</details>

<details>
<summary><b>P0.9 — Mesh Event Deduplication</b></summary>

```tsx
const eventCache = useRef<Set<string>>(new Set());

const triggerMeshEvent = (type: 'intercept' | 'sync' | 'error', message: string) => {
  const key = `${type}:${message}`;
  if (eventCache.current.has(key)) return; // deduplicate within 5s window

  eventCache.current.add(key);
  setMeshEvents(prev => [{ id: Date.now().toString(), type, message, timestamp: new Date() }, ...prev]);
  
  const randomNodes = Array.from({ length: 5 }, () => Math.floor(Math.random() * 75));
  setActiveNodes(randomNodes);
  setTimeout(() => setActiveNodes([]), 2000);
  setTimeout(() => eventCache.current.delete(key), 5000);
};
```

</details>

<details>
<summary><b>P0.6 — prefers-reduced-transparency (glass.css update)</b></summary>

```css
@media (prefers-reduced-transparency: reduce) {
  .phos-glass,
  .phos-glass-strong,
  .phos-pill {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: color-mix(in srgb, var(--phos-bg) 88%, transparent) !important;
  }
}
```

</details>

## Build & Deploy

```bash
cd /home/p31/P31-local-workspace/phos

# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name phos

# Verify
curl https://phos.p31ca.org
```

## Success Criteria

- [ ] `npm run build` exits with code 0
- [ ] `npx tsc --noEmit` clean (no pre-existing errors from Three.js/PGlite)
- [ ] Crisis mode (spoons=0): starfield hidden, input disabled, drawer closed
- [ ] Hydration: reload at spoons=0, page never flashes Quantum (4)
- [ ] GPU: Chrome DevTools Layers panel shows star nodes on composited layers (no main thread paint)
- [ ] Starfield scales: 4-core device gets ~38 stars, 8-core gets ~75
- [ ] Mesh events: starfield flares with 5 nodes for 2s, event appears in drawer log
- [ ] Screen reader: all icon buttons announce distinct action, mesh log announces via aria-live
- [ ] Focus: drawer open moves focus inside, close returns focus to toggle
- [ ] Glass: text in drawer passes WCAG 4.5:1 via glass-text-scrim
- [ ] Reduced transparency: `prefers-reduced-transparency: reduce` disables all backdrop-filter
