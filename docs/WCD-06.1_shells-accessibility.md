# WCD-06.1: Shells + Accessibility Contract

**Status:** Active  
**Date:** 2026-07-25  
**Scope:** All macro-shells (`LandingShell`, `WorkspaceShell`, `ConversationShell`) and their chrome (`SiteNav`, `SkipLink`)

---

## 1. Purpose

This document is the authoritative accessibility and behavioral contract for the three canonical layout shells. It ensures that:

- Every shell is keyboard-navigable.
- Off-canvas drawers trap focus and close on Escape.
- ARIA landmarks are present and correct.
- `data-spoons` motion scaling is respected.
- The same shell behaves identically across all 5 consumer apps.

---

## 2. Shell Contracts

### 2.1 LandingShell

| Property | Requirement |
|----------|-------------|
| Root element | `<div>` with `flex flex-col min-h-screen` |
| Viewport | No fixed height; natural document scroll |
| Nav | `<SiteNav brand="p31ca\|phosphorus" />` |
| Main | `<main id="main-content">` with centered max-width |
| Footer | `<LayoutFooter>` with `shrink-0` |
| Skip link | `<SkipLink />` rendered before `<LandingShell>` |

### 2.2 WorkspaceShell

| Property | Requirement |
|----------|-------------|
| Root element | `<div>` with `flex flex-col h-dvh overflow-hidden` |
| Viewport | Locked to `100dvh`; internal scroll only |
| Nav | `<SiteNav brand="phos" headerActions={...} />` |
| Sidebar | `<aside>` docked left, `hidden md:flex`, scrollable |
| Main | `<main id="main-content" className="flex-1 overflow-y-auto">` |
| Mobile sidebar | Fixed overlay with `z-[var(--p31-z-nav-drawer)]` |

### 2.3 ConversationShell

| Property | Requirement |
|----------|-------------|
| Root element | `<div>` with `flex flex-col h-dvh overflow-hidden` |
| Viewport | Locked to `100dvh`; middle scroll only |
| Nav | `<SiteNav brand="willow" />` |
| Main | `<main id="main-content" className="flex-1 overflow-y-auto">` |
| Input bar | `<footer>` docked bottom, `shrink-0` |
| Crisis mode | `data-spoons="0"` hides chrome, shows breathing overlay |

---

## 3. ARIA Landmarks

Every shell MUST include these landmarks in this order:

```tsx
<SkipLink />                    {/* Landmark: navigation bypass */}
<header role="banner">...</header>   {/* SiteNav renders this */}
<main id="main-content">...</main>   {/* Primary content */}
<footer role="contentinfo">...</footer>  {/* Optional: footer */}
```

**Rules:**
- `<header>` inside `<SiteNav>` carries `role="banner"` implicitly; no duplicate banner.
- `<nav>` inside SiteNav has `aria-label="Desktop navigation"` or similar.
- `<main>` MUST have `id="main-content"` for skip-link target.
- Drawer `<nav>` has `aria-label="Mobile navigation"`.

---

## 4. Off-Canvas Drawer Accessibility

### 4.1 Focus Trap

When the drawer opens:
1. Focus moves to the first focusable element inside the drawer.
2. Tab cycles within the drawer only.
3. Shift+Tab cycles backward within the drawer.
4. Focus returns to the triggering button when the drawer closes.

### 4.2 Escape Key

Pressing Escape MUST close the drawer and return focus to the hamburger button.

### 4.3 ARIA States

| Attribute | Value | When |
|-----------|-------|------|
| `aria-hidden` | `true` / `false` | On the portal container when closed/open |
| `aria-modal` | `true` | On the drawer panel |
| `aria-expanded` | `true` / `false` | On the hamburger button |
| `aria-label` | `"Mobile navigation"` | On the drawer panel |
| `role` | `dialog` | On the drawer panel |

### 4.4 Backdrop Click

Clicking the backdrop closes the drawer. The backdrop is `pointer-events-none` when closed, `pointer-events-auto` when open.

---

## 5. Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `Tab` | Moves focus forward through interactive elements |
| `Shift+Tab` | Moves focus backward |
| `Escape` | Closes any open drawer/modal |
| `Enter` / `Space` | Activates focused button/link |

**Constraint:** No component may intercept Tab or Escape unless it is an overlay (drawer, modal, tooltip).

---

## 6. Focus Visible

All interactive elements MUST have a visible `:focus-visible` indicator:

```css
:focus-visible {
  outline: 2px solid var(--p31-accent, #00F0FF);
  outline-offset: 2px;
}
```

No element may remove focus indicator with `outline: none` without providing a replacement.

---

## 7. `data-spoons` Motion Scaling

All animation/transition durations MUST be controlled by `data-spoons`:

| Spoons Level | Motion |
|--------------|--------|
| 0 (crisis) | None. Crisis overlay only. |
| 1 | Minimal. 150ms max. |
| 2 | Reduced. 300ms max. |
| 3 | Standard. 300ms default. |
| 4 | Full. 300ms default. |
| 5 | Full. 300ms default + particle effects. |

**Enforcement:** Components MUST NOT use hardcoded durations that bypass `data-spoons`. Use CSS custom properties or context-aware hooks.

---

## 8. Touch Targets

All interactive elements MUST meet WCAG 2.5.8 Enhanced (48×48px minimum):

| Element | Minimum Size |
|---------|--------------|
| Buttons | 48×48px |
| Nav links | 48×48px hit area |
| Hamburger | 48×48px |
| SpoonDial buttons | 48×48px |

**Current compliance:**
- Hamburger: `p-2` on a 20px icon → 44px. **FAIL.** Must bump to `p-2.5` or `min-h-[48px]`.
- Desktop nav links: `px-3 py-1.5` → ~36px high. **FAIL.** Must add `min-h-[48px]`.

---

## 9. Color Contrast

All text must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text):

| Token | Verified |
|-------|----------|
| `--p31-text-primary` on `--p31-void` | ✅ Pass |
| `--p31-text-secondary` on `--p31-void` | ✅ Pass |
| `--p31-accent` on `--p31-void` | ✅ Pass |
| `--p31-text-muted` on `--p31-void` | ⚠️ Verify in each app |

No pure white (`#FFFFFF`) text on dark backgrounds. Use `--p31-text-primary` instead.

---

## 10. Testing Strategy

### 10.1 Automated

```bash
# Run axe-core audit via Playwright
node scripts/audit-wcag.mjs http://localhost:4321

# Run spatial validator
node cli/validators/spatialValidator.mjs --tokens cli/tokens/tokens.yml --src apps/phos/src --strict
```

### 10.2 Manual

| Test | Steps |
|------|-------|
| Keyboard nav | Tab through entire page. No focus traps outside overlays. |
| Drawer focus trap | Open drawer, Tab forward/backward. Focus stays inside. |
| Escape closes drawer | Open drawer, press Escape. Drawer closes. |
| Skip link | Tab to skip link, activate. Focus moves to `#main-content`. |
| Crisis mode | Set `data-spoons="0"`. Chrome hides, breathing overlay shows. |
| Mobile viewport | 375px width. Drawer, sidebar, SpoonDial compact all work. |
| Desktop viewport | 1440px width. Full nav, no drawer, full SpoonDial. |

### 10.3 Visual Regression

```bash
pnpm run test:visual:update   # After intentional changes
pnpm run test:visual:ci       # In CI
```

---

## 11. Implementation Checklist

When modifying any shell or SiteNav, verify:

- [ ] Root is a macro-shell (`LandingShell`, `WorkspaceShell`, `ConversationShell`)
- [ ] `<main id="main-content">` is present
- [ ] `<SkipLink />` is rendered before the shell
- [ ] Drawer uses `createPortal` to `document.body`
- [ ] Drawer has focus trap + Escape handler
- [ ] `aria-modal="true"` and `role="dialog"` on drawer
- [ ] All z-index values use tokens
- [ ] All CSS vars have fallbacks
- [ ] Touch targets ≥ 48×48px
- [ ] `data-spoons` respected for all animations
- [ ] Build passes for all 5 consumer apps

---

## 12. Related Documents

- `.kilo/rules/ui-guardrails.md` — Machine-executable guardrails (rules 1–15)
- `docs/architecture-decisions.md` — ADL-001 through ADL-004
- `DESIGN.md` — Design contract (single accent, glass containers, spoon-aware motion)
- `AGENTS.md` — UI Verification Protocol (mandatory post-change checklist)
