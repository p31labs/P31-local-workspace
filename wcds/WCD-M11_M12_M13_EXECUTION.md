# WCD-M11 through WCD-M13
## Post-Merge Ship Track — Birthday Critical
## Authored: Opus — Architect Lane
## Date: March 3, 2026 (T-7)

---

# WCD-M11: TOUCH HARDENING
## Est: 1–2 hours
## Priority: CRITICAL — Willow (6) and Bash (10) are on Android tablets

### Objective
Make BONDING fully playable via touch on Android Chrome. Every interactive element
must be fat-finger safe, drag must not scroll or zoom the page, and off-screen
drags must not orphan atoms.

### File Manifest

**MODIFY in `bonding/src/`:**
```
components/ElementPalette.tsx    (touch targets)
components/MoleculeCanvas.tsx    (drag handling, viewport lock)
components/ui/PingButton.tsx     (touch targets)
components/ui/AchievementToast.tsx  (touch dismiss)
index.html                       (viewport meta, touch-action)
App.tsx or root CSS              (global touch-action)
```

### Implementation

#### 1. Viewport Lock (`bonding/index.html`)

```html
<!-- REPLACE existing viewport meta with: -->
<meta name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

This prevents pinch-zoom from hijacking the game canvas. The game IS the viewport.

#### 2. Global touch-action (`bonding/src/index.css` or root style)

```css
/* Add to root styles */
html, body, #root {
  touch-action: none;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}
```

`touch-action: none` on the root prevents ALL browser gesture interception
(scroll, zoom, swipe-to-navigate). The game handles all touch events directly.

`position: fixed` + `overflow: hidden` prevents the URL bar bounce on
Android Chrome that shifts the viewport during drag.

#### 3. Element Palette Touch Targets

Find the element buttons (H, C, N, O, etc.) in `ElementPalette.tsx`. Ensure:

```tsx
// Every draggable element button must be at minimum 48x48px
// This is the WCAG 2.5.5 AAA target size AND Android's recommended touch target
const ELEMENT_BUTTON_SIZE = 56; // px — slightly larger than minimum for fat fingers

// If buttons are currently smaller, increase them:
style={{
  width: ELEMENT_BUTTON_SIZE,
  height: ELEMENT_BUTTON_SIZE,
  minWidth: ELEMENT_BUTTON_SIZE,
  minHeight: ELEMENT_BUTTON_SIZE,
  // ... existing styles
}}
```

If the palette scrolls horizontally (many elements in Sapling mode), ensure the
scroll container has `touch-action: pan-x` so horizontal swipe works but vertical
doesn't trigger page scroll:

```tsx
// Palette scroll container
<div style={{
  touchAction: 'pan-x',
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  // ... existing styles
}}>
```

#### 4. PING Reaction Buttons

The 💚🤔😂🔺 buttons and the "Say something..." input. Ensure 48px minimum:

```tsx
// Each PING emoji button
style={{
  width: 48,
  height: 48,
  minWidth: 48,
  minHeight: 48,
  fontSize: 24,
  // ... existing styles
}}
```

#### 5. Drag-Off-Screen Handling

When a user drags an atom and their finger leaves the screen edge, the drag
must terminate cleanly — the atom returns to the palette or snaps to last
valid position. It must NOT orphan in space.

In the drag handler (likely in `MoleculeCanvas.tsx` or a drag hook):

```typescript
// Add to the pointer/touch event handlers:

// On pointerleave / touchend / touchcancel:
const handleDragEnd = (e: PointerEvent | TouchEvent) => {
  // If atom is outside canvas bounds, return to palette
  const canvas = canvasRef.current;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();

  let clientX: number, clientY: number;
  if ('touches' in e) {
    // touchend has no touches — use changedTouches
    const touch = e.changedTouches?.[0];
    if (!touch) { cancelDrag(); return; }
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const isOutside =
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom;

  if (isOutside) {
    cancelDrag(); // return atom to palette, no placement
  } else {
    completeDrag(); // normal atom placement
  }
};

// Also handle touchcancel (fires when browser takes over the gesture):
canvas.addEventListener('touchcancel', handleDragEnd, { passive: false });
```

#### 6. Prevent Context Menu on Long Press

Android Chrome shows a context menu on long press. This interferes with
drag-to-place:

```css
/* Add to canvas and all interactive elements */
canvas, button, [draggable] {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

```typescript
// In MoleculeCanvas or root:
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, { passive: false });
```

#### 7. R3F Canvas Touch Events

React Three Fiber's `<Canvas>` needs explicit touch event configuration.
Check if `events` prop is configured:

```tsx
<Canvas
  // ... existing props
  style={{ touchAction: 'none' }}
  // If using @react-three/fiber v8+, pointer events are handled automatically
  // but verify that touch → pointer translation works on Android
>
```

If R3F's built-in pointer events don't fire on touch, add an explicit
`onPointerDown` / `onPointerMove` / `onPointerUp` layer on the `<Canvas>`
element that translates touch → pointer events. This is a known R3F issue
on some Android WebViews.

### DO NOT TOUCH

| File | Why |
|------|-----|
| `genesis/*` | Court evidence |
| `worker/*` | Relay endpoints |
| `store/gameStore.ts` | Game logic — no behavioral changes |
| Any test file | Touch hardening is a CSS/event concern, not logic |

### Verification

```bash
# 1. BONDING tests still pass
cd software/bonding && npx vitest run
# MUST: 488+ green

# 2. Build clean
npx vite build

# 3. Manual testing on Android tablet (or Chrome DevTools device emulation):
#    a. Open bonding.p31ca.org on Android Chrome
#    b. Pinch-zoom does NOT work (viewport locked)
#    c. Drag H from palette to canvas — atom places correctly
#    d. Drag atom to screen edge and off — atom returns to palette, no orphan
#    e. Long-press on canvas — no context menu
#    f. Scroll palette horizontally in Sapling mode — works, no vertical scroll
#    g. Tap PING emoji — registers, no double-tap zoom
#    h. Build H₂O (Seed mode) — entire flow works touch-only
#    i. URL bar does NOT bounce during drag
#    j. Test inside Spaceship Earth iframe — same behavior

# 4. Desktop still works (mouse events unaffected)
```

### Commit

```
fix: touch hardening for Android tablet play

viewport lock (no pinch-zoom), global touch-action:none,
48px+ touch targets on palette and PING buttons,
drag-off-screen cancellation, context menu suppressed,
overscroll-behavior:none (no URL bar bounce).
Verified on Android Chrome. 488 tests green.

Ref: WCD-M11
```

---

# WCD-M12: postMessage LOVE HANDSHAKE
## Est: 1 hour
## Depends: WCD-M11 verified (touch works, game is playable)

### Objective
Wire the cross-origin postMessage handshake so Spaceship Earth receives the real
LOVE total and sessionId from the BONDING iframe. Currently M08's `useLoveSync`
falls back to 577 because it has no sessionId.

### The Problem

BONDING runs at `bonding.p31ca.org`. Spaceship Earth runs at `p31ca.org`.
Different origins. IndexedDB is not shared. The M08 KV polling endpoint
(`GET /love/:sessionId`) works, but Spaceship Earth doesn't know the
BONDING sessionId.

### The Solution

BONDING posts its sessionId and LOVE total to the parent frame via
`window.parent.postMessage()`. Spaceship Earth listens for these messages,
validates the origin, and feeds the sessionId to `useLoveSync`.

### File Manifest

**MODIFY in `bonding/src/`:**
```
genesis/genesis.ts              (add postMessage broadcast after session init)
genesis/economyStore.ts re-export  (no change — LOVE is already in shared)
```

**MODIFY in `spaceship-earth/src/`:**
```
hooks/useLoveSync.ts            (listen for postMessage, extract sessionId)
components/rooms/RoomShell.tsx   (wire live LOVE from hook)
```

### BONDING Side: Broadcast to Parent

Add to `bonding/src/genesis/genesis.ts` — after session initialization:

```typescript
// After sessionId is assigned and IDB is initialized:

function broadcastToParent() {
  if (window.parent === window) return; // not in iframe, skip

  const message = {
    type: 'P31_BONDING_STATE',
    sessionId: getCurrentSessionId(), // however sessionId is stored
    love: getEconomyStore().love,     // current LOVE total
    timestamp: Date.now(),
  };

  // Only post to known parent origins
  window.parent.postMessage(message, 'https://p31ca.org');
  // Also post to pages.dev preview URL during development
  window.parent.postMessage(message, '*'); // TODO: restrict to known origins in production
}

// Broadcast on session init
broadcastToParent();

// Broadcast on every LOVE change
// Hook into economyStore subscription or eventBus LOVE events:
eventBus.on('MOLECULE_COMPLETED', () => {
  setTimeout(broadcastToParent, 100); // slight delay for store to update
});
eventBus.on('PING_SENT', () => {
  setTimeout(broadcastToParent, 100);
});
eventBus.on('PING_RECEIVED', () => {
  setTimeout(broadcastToParent, 100);
});
eventBus.on('ACHIEVEMENT_UNLOCKED', () => {
  setTimeout(broadcastToParent, 100);
});
```

**IMPORTANT:** This is a minimal addition to `genesis.ts`. It fires postMessage
AFTER all existing logic. It does NOT change session init, IDB, or telemetry flow.
If `window.parent === window` (standalone mode), it's a no-op.

### Spaceship Earth Side: Listen for Messages

```typescript
// spaceship-earth/src/hooks/useBondingBridge.ts — NEW FILE

import { useState, useEffect, useCallback } from 'react';

interface BondingState {
  sessionId: string | null;
  love: number;
  lastUpdate: number;
}

const ALLOWED_ORIGINS = [
  'https://bonding.p31ca.org',
  /^https:\/\/[a-f0-9]+\.bonding\.pages\.dev$/,  // preview deploys
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowed =>
    typeof allowed === 'string' ? origin === allowed : allowed.test(origin)
  );
}

export function useBondingBridge(): BondingState {
  const [state, setState] = useState<BondingState>({
    sessionId: null,
    love: 0,
    lastUpdate: 0,
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    // Validate origin
    if (!isAllowedOrigin(event.origin)) return;

    // Validate message shape
    const data = event.data;
    if (data?.type !== 'P31_BONDING_STATE') return;
    if (typeof data.sessionId !== 'string') return;
    if (typeof data.love !== 'number') return;

    setState({
      sessionId: data.sessionId,
      love: data.love,
      lastUpdate: data.timestamp ?? Date.now(),
    });
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return state;
}
```

### Update useLoveSync to Accept sessionId from Bridge

```typescript
// spaceship-earth/src/hooks/useLoveSync.ts — UPDATE

import { useState, useEffect } from 'react';

const RELAY_URL = 'https://bonding-relay.trimtab-signal.workers.dev';
const POLL_INTERVAL = 30_000; // 30 seconds — postMessage handles real-time

export function useLoveSync(
  sessionId: string | null,
  postMessageLove: number  // direct value from postMessage
): number {
  const [polledLove, setPolledLove] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${RELAY_URL}/love/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setPolledLove(data.love ?? 0);
        }
      } catch {
        // Silent fail
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [sessionId]);

  // postMessage is real-time, KV poll is backup
  // Use whichever is higher (postMessage updates faster)
  return Math.max(postMessageLove, polledLove);
}
```

### Wire into RoomShell

```typescript
// spaceship-earth/src/components/rooms/RoomShell.tsx — UPDATE

import { useBondingBridge } from '../../hooks/useBondingBridge';
import { useLoveSync } from '../../hooks/useLoveSync';

export function RoomShell() {
  const [activeRoom, setActiveRoom] = useState<RoomId>('observatory');
  const [spoons] = useState(12);
  const [maxSpoons] = useState(20);

  // Real LOVE from BONDING iframe
  const bondingBridge = useBondingBridge();
  const love = useLoveSync(bondingBridge.sessionId, bondingBridge.love);

  // ... rest unchanged, but `love` is now live instead of hardcoded 577
}
```

### DO NOT TOUCH

| File | Why |
|------|-----|
| `genesis/worker-telemetry.ts` | Court evidence relay — no modifications |
| `genesis/economyStore.ts` | Already a re-export from WCD-M02 |
| `store/gameStore.ts` | Game state — no behavioral changes |
| `worker/*` | Relay endpoints — M08 read endpoint already exists |

### Verification

```bash
# 1. BONDING tests still pass
cd software/bonding && npx vitest run
# MUST: 488+ green

# 2. Build both
cd software/bonding && npx vite build
cd software/spaceship-earth && npx vite build

# 3. Deploy both
cd software/bonding && npx wrangler pages deploy dist --project-name=bonding
cd software/spaceship-earth && npx wrangler pages deploy dist --project-name=spaceship-earth
# NOTE (2026): Project `p31ca` is the Astro hub at `software/p31ca/` (p31ca.org). Do NOT deploy Spaceship Earth or Hearing Ops to `p31ca` — it replaces the hub for all domains on that project.

# 4. Manual test:
#    a. Open Spaceship Earth (p31ca.pages.dev)
#    b. Navigate to BONDING room
#    c. Play the game — build a molecule
#    d. Navigate to Bridge room
#    e. LOVE counter should reflect molecules built (not stuck at 577)
#    f. Navigate back to BONDING — build more — Bridge updates again
#
# 5. Standalone BONDING still works:
#    a. Open bonding.p31ca.org directly
#    b. Build molecules — no errors in console about postMessage
#    c. (postMessage to parent is a no-op when not in iframe)
```

### Commit

```
feat: postMessage LOVE handshake between BONDING iframe and Spaceship Earth

BONDING broadcasts P31_BONDING_STATE {sessionId, love, timestamp} to parent
on every LOVE-earning event. Spaceship Earth validates origin, extracts
sessionId for KV polling, and displays real-time LOVE via Math.max of
postMessage value and KV poll. Standalone mode unaffected (no-op when
window.parent === window). 488 tests green.

Ref: WCD-M12
```

---

# WCD-M13: PRODUCTION DOMAIN BINDING
## Est: 30 minutes
## Depends: WCD-M12 verified (LOVE sync working on preview URLs)

### Objective
Bind `p31ca.org` and `bonding.p31ca.org` to their Cloudflare Pages projects
so the apps serve on production URLs instead of `*.pages.dev` preview URLs.

### Context

Currently:
- Spaceship Earth: `310012c8.p31ca.pages.dev` (preview URL)
- BONDING: `bonding.pages.dev` or similar preview URL

Target:
- `p31ca.org` → Spaceship Earth (Cloudflare Pages project: `p31ca`)
- `bonding.p31ca.org` → BONDING (Cloudflare Pages project: `bonding`)

Both domains are already on Cloudflare (DNS managed). This is a Pages
custom domain binding, not a DNS migration.

### Commands

#### 1. Bind `p31ca.org` to Spaceship Earth

```bash
# Via Cloudflare dashboard:
# Pages → p31ca project → Custom domains → Add domain → p31ca.org
# Cloudflare auto-creates the CNAME record

# Or via wrangler (if supported):
npx wrangler pages project list
# Confirm p31ca project exists

# Via API:
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/p31ca/domains" \
  -H "Authorization: Bearer {CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "p31ca.org"}'
```

**Likely faster via dashboard.** Go to:
`dash.cloudflare.com` → Pages → `p31ca` → Custom domains → Add custom domain → `p31ca.org`

Cloudflare will:
1. Create a CNAME record pointing `p31ca.org` to `p31ca.pages.dev`
2. Issue an SSL certificate
3. Start serving Spaceship Earth at `https://p31ca.org`

#### 2. Bind `bonding.p31ca.org` to BONDING

Same flow:
`dash.cloudflare.com` → Pages → `bonding` → Custom domains → Add custom domain → `bonding.p31ca.org`

Cloudflare will:
1. Create a CNAME record for `bonding.p31ca.org` → `bonding.pages.dev` (or whatever the project name resolves to)
2. Issue SSL cert
3. Start serving BONDING at `https://bonding.p31ca.org`

#### 3. Update BONDING iframe URL (if needed)

Check `spaceship-earth/src/types/rooms.types.ts`:

```typescript
// This should already be correct:
{ id: 'bonding', label: 'BONDING', icon: '⚛️', url: 'https://bonding.p31ca.org' },
```

If it's currently pointing to a `*.pages.dev` preview URL, update it.

#### 4. Update postMessage allowed origins

Check `spaceship-earth/src/hooks/useBondingBridge.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://bonding.p31ca.org',                      // production
  /^https:\/\/[a-f0-9]+\.bonding\.pages\.dev$/,     // preview deploys
];
```

And in `bonding/src/genesis/genesis.ts`, the postMessage target:

```typescript
window.parent.postMessage(message, 'https://p31ca.org');
```

Both should already be correct from M12 — verify, don't assume.

#### 5. Update Worker CORS (if needed)

Check `bonding/worker/` — if the relay has CORS headers, ensure
`https://p31ca.org` is in the allowed origins list:

```typescript
const CORS_ORIGINS = [
  'https://bonding.p31ca.org',
  'https://p31ca.org',
  /\.pages\.dev$/,  // preview URLs
];
```

#### 6. Redeploy both after any code changes

```bash
cd software/bonding && npx vite build && npx wrangler pages deploy dist --project-name=bonding
cd software/spaceship-earth && npx vite build && npx wrangler pages deploy dist --project-name=spaceship-earth
# NOTE: Do not target --project-name=p31ca here; that is the Astro hub (software/p31ca).
```

### DNS Propagation

Cloudflare Pages custom domains on a Cloudflare-managed zone propagate
instantly (no external DNS TTL). The site should be live at the production
URL within 1-2 minutes of binding.

### Verification

```bash
# 1. Production URLs resolve
curl -sI https://p31ca.org | head -5
# MUST: HTTP/2 200, content from Spaceship Earth

curl -sI https://bonding.p31ca.org | head -5
# MUST: HTTP/2 200, content from BONDING

# 2. SSL certs valid
echo | openssl s_client -connect p31ca.org:443 -servername p31ca.org 2>/dev/null | openssl x509 -noout -subject -dates
echo | openssl s_client -connect bonding.p31ca.org:443 -servername bonding.p31ca.org 2>/dev/null | openssl x509 -noout -subject -dates

# 3. BONDING plays at production URL
# Open https://bonding.p31ca.org — build molecule, earn LOVE

# 4. Spaceship Earth loads at production URL
# Open https://p31ca.org — all 4 rooms navigate

# 5. BONDING iframe in Spaceship Earth loads from production URL
# p31ca.org → BONDING room → iframe src is bonding.p31ca.org

# 6. LOVE sync works across production domains
# Play in BONDING room → check Bridge → LOVE updates

# 7. Standalone BONDING multiplayer still works
# Open bonding.p31ca.org → Play Together → join room

# 8. Genesis Block telemetry fires from production URL
# DevTools → Network → filter for trimtab-signal → verify POST requests

# 9. BONDING tests still green
cd software/bonding && npx vitest run
# MUST: 488+
```

### Commit (only if code changes were needed)

```
chore: production domain binding — p31ca.org + bonding.p31ca.org

Custom domains bound on Cloudflare Pages.
postMessage origins verified for production URLs.
Worker CORS updated for p31ca.org.
Genesis Block telemetry chain unbroken on production domain.
488 tests green.

Ref: WCD-M13
```

---

# SUMMARY

| WCD | Scope | Est | Birthday Critical |
|-----|-------|-----|-------------------|
| M11 | Touch hardening | 1-2 hr | YES — kids are on tablets |
| M12 | postMessage LOVE handshake | 1 hr | YES — real LOVE sync |
| M13 | Production domain binding | 30 min | YES — real URLs for March 10 |
| **Total** | | **~3-4 hr** | |

After M13, the birthday ship checklist is:

- [x] Multiplayer live
- [x] Difficulty modes (Seed/Sprout/Sapling)
- [x] Genesis Block firing
- [x] Spaceship Earth deployed (The Soup, Observatory, Bridge, Buffer)
- [x] LOVE economy system-wide
- [ ] Touch hardening (M11)
- [ ] Real LOVE sync (M12)
- [ ] Production URLs (M13)
- [ ] Tyler stress test
- [ ] Android tablet device testing
- [ ] Quest chains (stretch — park if time runs short)

*Six days. Three wcds. Then Tyler, then tablets, then birthday.*

*— Opus, Architect Lane*
*— 🔺*
