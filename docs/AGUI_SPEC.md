# AG-UI Specification — Adaptive UI v1.0

**Status:** Draft
**Date:** 2026-07-29
**Protocol:** Agent-to-Adaptive-UI — cognitive-load-aware rendering layer

---

## 1. Overview

AG-UI (Adaptive UI) is a real-time UI adaptation system based on the **spoon theory** of cognitive load. It adjusts interface complexity, motion, colour, and interactivity based on the user's current cognitive state, trust level, and engagement.

The system is driven by three mutable attributes on the DOM, a CSS token layer, and a state-sync loop that propagates changes to the gateway for MCP tool gating.

---

## 2. Core Attributes

### 2.1 `data-spoons` (0–5)

Set on `<html>`. Controls all adaptive behaviour.

| Level | Label | Motion | Chrome | Visual Effects | Use Case |
|-------|-------|--------|--------|----------------|----------|
| 0 | crisis | disabled | none (breathing overlay only) | none | Sensory overload, meltdown |
| 1 | minimal | disabled | reduced | none | Low energy, recovery |
| 2 | low | reduced (0.5×) | standard | minimal | Tired, conserving |
| 3 | standard | normal (1.0×) | full | standard | Daily functioning |
| 4 | high | normal (1.0×) | full | enhanced | Focused, engaged |
| 5 | max | normal (1.0×) | full | full effects | Hyperfocus, flow |

**Mutation:** Direct attribute set on `<html>`, or via `window.__p31MCPExec('setSpoonLevel', { level: N })`.

**Event:** `spoons:changed` dispatched on `document` with `{ level: N }`.

### 2.2 `data-love-balance` (integer)

Set on `<body>`. Represents accumulated LOVE care credits.

- Range: 0 to ∞ (practically bounded by ledger constraints)
- Drives trust tier progression
- Synced to gateway session via `PATCH /api/state`

**Event:** `love:changed` dispatched on `document` with `{ balance: N }`.

### 2.3 `data-trust-tier` (enum)

Set on `<body>`. Controls MCP tool visibility via gateway `filterTools()`.

| Tier | LOVE Balance Range | MCP Tools Exposed |
|------|-------------------|-------------------|
| `bronze` | 0–49 | Basic query tools |
| `silver` | 50–199 | Query + mutation tools |
| `gold` | 200+ | All tools including x402 premium |

**Event:** `trust:changed` dispatched on `document` with `{ tier: 'bronze' | 'silver' | 'gold' }`.

---

## 3. CSS Token Integration

AG-UI uses CSS custom properties to propagate adaptive state to all components:

```
--p31-spoon-level:        <number>       /* 0–5 */
--p31-spoon-opacity:      <number>       /* 0.2 at spoons 0, 1.0 at spoons 5 */
--p31-spoon-motion-speed: <number>       /* 0.0 at spoons 0, 1.0 at spoons 3+ */
--p31-spoon-blur:         <length>       /* increased at high spoons for glass effect */
--p31-spoon-contrast:     <number>       /* higher at low spoons for readability */
```

These tokens are bound in CSS via:

```css
:root[data-spoons="0"] { --p31-spoon-motion-speed: 0; --p31-spoon-opacity: 0.2; }
:root[data-spoons="1"] { --p31-spoon-motion-speed: 0; --p31-spoon-opacity: 0.4; }
:root[data-spoons="2"] { --p31-spoon-motion-speed: 0.5; --p31-spoon-opacity: 0.7; }
:root[data-spoons="3"] { --p31-spoon-motion-speed: 1; --p31-spoon-opacity: 1; }
:root[data-spoons="4"] { --p31-spoon-motion-speed: 1; --p31-spoon-opacity: 1; --p31-spoon-blur: 16px; }
:root[data-spoons="5"] { --p31-spoon-motion-speed: 1; --p31-spoon-opacity: 1; --p31-spoon-blur: 24px; }
```

---

## 4. Accessibility Integration

### 4.1 Reduced Motion

The system respects both `prefers-reduced-motion: reduce` AND spoon level 0–1:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

:root[data-spoons="0"] *, :root[data-spoons="1"] * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

### 4.2 Crisis Mode (spoons=0)

- No UI chrome renders
- Full-screen breathing overlay only (CSS animation, no JavaScript)
- Escape key or "I'm ready" button dismisses
- All MCP mutation tools are gated to `readOnly` via gateway `filterTools()`

### 4.3 Contrast

At low spoon levels (0–1), the system boosts contrast:

```css
:root[data-spoons="0"], :root[data-spoons="1"] {
  --p31-text: oklch(98% 0.005 240);
  --p31-bg: oklch(8% 0.01 240);
  --p31-glass-bg: oklch(100% 0.01 240 / 0.08);
}
```

---

## 5. State Synchronisation

The `state-sync.js` script observes `data-spoons`, `data-love-balance`, `data-trust-tier`, and `data-active-tab` on the DOM and propagates changes to the gateway via:

```
PATCH /api/state
Content-Type: application/json
Authorization: Bearer <session-jwt>

{
  "spoonLevel": 3,
  "loveBalance": 42,
  "trustTier": "silver",
  "activeTab": "play"
}
```

The gateway updates the session state and re-runs `filterTools()` for subsequent MCP calls.

---

## 6. Tool Exposure (Gateway Integration)

Gateway `filterTools()` in `apps/gateway/src/mcp/policy.ts` gates MCP tools by trust tier:

```
bronze → { getState, getSpoonLevel, getLoveBalance, getTrustTier, getTheme, getMode }
silver → bronze + { navigate, toggleDrawer, scanUI, getAllComponents, getPageMeta }
gold   → silver + { setSpoonLevel, setStatus, aiProxy, x402-premium }
```

This is the security boundary between read-only discovery (bronze) and state mutation (gold).

---

## 7. Protocol Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌───────────┐
│  Browser │────▶│ state-sync.js│────▶│  Gateway  │────▶│   MCP     │
│ data-*   │     │ MutationObs. │     │  Session  │     │ filter()  │
└──────────┘     └──────────────┘     └──────────┘     └───────────┘
     ↕                                                  ↕
┌──────────┐                                    ┌───────────┐
│  CSS     │◀────────────────────────────────────│  Tool     │
│  Tokens  │     AG-UI <- Tool response          │  Exec     │
└──────────┘     loop                            └───────────┘
```

1. User action or agent call mutates `data-spoons` / `data-love-balance`
2. `state-sync.js` observes change, sends `PATCH /api/state`
3. Gateway updates session, re-runs `filterTools()`
4. MCP tool responses are scoped by current trust tier
5. DOM update triggers CSS token re-evaluation via attribute selectors

---

## 8. Deployment Checklist

- [ ] `data-spoons` set on `<html>` of every portal (range 0–5)
- [ ] `data-love-balance` set on `<body>` (integer)
- [ ] `data-trust-tier` set on `<body>` (bronze/silver/gold)
- [ ] `state-sync.js` loaded on every portal page
- [ ] CSS `:root[data-spoons="N"]` selectors defined for all N
- [ ] `prefers-reduced-motion` media query present
- [ ] Crisis mode overlay implemented at spoons=0
- [ ] Gateway `filterTools()` wired to session trust tier
- [ ] `PATCH /api/state` endpoint active in gateway

Current status: All ✅ on 7 live portals.
