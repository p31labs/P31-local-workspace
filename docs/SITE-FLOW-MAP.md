# P31 Ecosystem — SITE/FLOW MAP

> Master reference for all 10 P31 surfaces, their navigation relationships, audience flows, and visual language.

---

## Surface Registry

| # | Surface | URL | Purpose | Audience | Routes | Layout System | Tech Stack |
|---|---------|-----|---------|----------|--------|---------------|------------|
| 1 | **P31 Hub** | `p31ca.org` | Technical hub — fleet status, product registry, ops tools | Developers, operators, contributors | 54 pages | `BaseLayout` (landing) + `AppShell` (inner) | Astro, Tailwind, dual token systems |
| 2 | **Phosphorus31** | `phosphorus31.org` | Nonprofit portal — mission, fundraising, research | Families, donors, researchers | 9 routes | Single `Layout.astro` wrapper | Astro hybrid, Tailwind |
| 3 | **PHOS** | `phos.p31ca.org` | Ambient workspace — cognitive prosthetic, care coordination | Neurodivergent users (primary), families | 17+ surfaces | Full-screen SPA, surface router | React 19, Vite, Tailwind, nanostores |
| 4 | **BONDING** | `bonding.p31ca.org` | Molecule-building chemistry game | Children, families | 2 modes (splash + UIG) | Single-page, mode-switched | Vite React SPA |
| 5 | **Willow** | `willow.p31ca.org` | Child-facing activity companion | Children, families | 6 screens | Single-page, panel-switched | Vite React SPA |
| 6 | **Spatial Oasis** | `site/` (deployed to Pages) | Public landing, marketing, genesis gate | General public, developers | 1 page (multi-section) | Single HTML, vanilla JS | Static HTML, Xterm.js, inline CSS |
| 7 | **Command Center** | `command-center.p31ca.org` | Operator dashboard — fleet monitoring, EPCP | P31 operator/admin | 1 dashboard | Worker-generated HTML | Cloudflare Worker, vanilla JS |
| 8 | **Federation Bridge** | `federation.p31ca.org` | ActivityPub federation, credentialing | Federated network participants | API only (no UI) | N/A (JSON endpoints) | Hono, D1, Ed25519 |
| 9 | **Status** | `status.p31ca.org` | Health monitoring | Operators, users | 1 dashboard + API | Worker-generated HTML | Cloudflare Worker, D1 |
| 10 | **Gateway** | `gateway.p31ca.org` | AI proxy, API routing | Other apps (not user-facing) | API only (no UI) | N/A (JSON endpoints) | Hono, service bindings |

---

## Navigation Graph

```
                    ┌─────────────────────────────────────┐
                    │         PUBLIC ENTRY POINTS          │
                    └─────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
     │  phosphorus31 │    │   site/ (Spatial  │    │    p31ca     │
     │    .org       │    │      Oasis)       │    │    .org      │
     │  Nonprofit    │    │   Marketing       │    │  Tech Hub    │
     │  Portal       │    │   Landing         │    │              │
     └──────┬───────┘    └────────┬─────────┘    └──────┬───────┘
            │                     │                      │
    ┌───────┼───────┐             │            ┌─────────┼─────────┐
    ▼       ▼       ▼             ▼            ▼         ▼         ▼
 ┌──────┐┌──────┐┌──────┐  ┌──────────┐  ┌────────┐┌────────┐┌────────┐
 │Donate││Prod- ││Reach │  │ Genesis  │  │ Fleet  ││Product ││  Ops   │
 │      ││ucts  ││-     │  │   Gate   │  │ Status ││Registry││ Tools  │
 │      ││      ││earch │  │          │  │        ││        ││        │
 └──┬───┘└──┬───┘└──┬───┘  └──────────┘  └────────┘└────────┘└────────┘
    │       │       │
    │       │       │    ┌───────────────────────────────────┐
    │       │       └───►│     EDGE APPS (via header/CTA)     │
    │       │            └───────────────────────────────────┘
    │       │                     │
    │       │         ┌───────────┼───────────┐
    │       │         ▼           ▼           ▼
    │       │   ┌──────────┐┌──────────┐┌──────────┐
    │       │   │  PHOS    ││ BONDING  ││  WILLOW  │
    │       │   │ Ambient  ││ Molecule ││ Activity │
    │       │   │Workspace ││  Game    ││Companion │
    │       │   └──────────┘└──────────┘└──────────┘
    │       │
    │       │    ┌──────────────────────────────┐
    │       └───►│    INFRASTRUCTURE LAYER       │
    │            │  command-center  (operator)   │
    │            │  federation      (ActivityPub) │
    │            │  status          (health)     │
    │            │  gateway         (API proxy)  │
    │            └──────────────────────────────┘
    │
    └──► Ko-fi / Discord / GitHub (external)
```

---

## User Journey Flows

### Journey 1: Visitor → Donor → Volunteer

```
site/ (Spatial Oasis landing)
  → phosphorus31.org (learn mission)
    → /donate (PayPal or Ko-fi)
      → /research (see publications)
        → p31ca.org (technical details)
          → GitHub (contribute code)
```

### Journey 2: Parent/Child

```
phosphorus31.org (find tools)
  → /products (browse suite)
    → bonding.p31ca.org (remote connection game)
    → willow.p31ca.org (activity companion)
      → phos.p31ca.org (ambient workspace)
        → /compass (care coordination)
```

### Journey 3: Developer → Contributor

```
p31ca.org (technical hub)
  → /syl.html (syllabus/learning path)
    → GitHub repos
      → command-center.p31ca.org (fleet ops)
        → gateway.p31ca.org (API endpoints)
```

### Journey 4: Operator

```
command-center.p31ca.org (dashboard)
  → status.p31ca.org (health checks)
    → federation.p31ca.org (federation state)
      → gateway.p31ca.org (API routing)
```

---

## Visual Language Matrix

| Token | Canonical Value | Hub | Phosphorus31 | PHOS | BONDING | Willow | Site | CmdCenter | Status |
|-------|----------------|-----|--------------|------|---------|--------|------|-----------|--------|
| Background | `#0A0A0F` | `#0A0A0F` | `#0A0A0F` | `#0A0A0F` | `#0a0e14` | `#0A0A0F` | `#030305` | `#0a0a14` | `#0a0a0f` |
| Text primary | `#F5F5F7` | `#FFFFFF` | `#FFFFFF` | `#F5F5F7` | `#e2e8f0` | `#F5F5F7` | `#ffffff` | `#e2e8f0` | `#e0e0e0` |
| Accent primary | `#00F0FF` | `#E8636F` (rose) | `#00F0FF` | `#00F0FF` | `#00F0FF` | `#00F0FF` | `#00f0ff` | `#22d3ee` | `#00e5ff` |
| Font family | Inter | Tailwind default | Tailwind default | Inter + JetBrains Mono | Inter | Inter | Inter + JetBrains Mono | system-ui | system-ui |
| Glass blur | `12px` | `backdrop-blur-md` | `backdrop-blur-sm` | `blur(12px)` | N/A | N/A | `16px` | N/A | N/A |
| Border radius | `24px` | `rounded-xl` (12px) | `rounded-2xl` (16px) | `24px` | `8px` | `12px` | `12px` | `12px` | `12px` |
| Glass surface | `rgba(255,255,255,0.04)` | Tailwind classes | `bg-surface/5` | CSS var | N/A | N/A | `rgba(10,12,28,0.35)` | `#111827` | `rgba(255,255,255,0.03)` |

### Intentional Divergences

- **Hub (p31ca.org):** Uses rose/coral accent (`#E8636F`) for brand differentiation from the quantum palette. Dual token systems: `hub-tokens` for landing, `p31-qmu-tokens` for inner pages.
- **Site (Spatial Oasis):** Deeper void (`#030305`), more aggressive glass (`rgba(10,12,28,0.35)` with `16px` blur), extended animation system (unicorn, rainbow, spatial grid).
- **Command Center:** Solid cards (`#111827`) instead of glass — operator dashboard prioritizes readability over ambient aesthetic.
- **BONDING:** Slightly different void (`#0a0e14`) — child-friendly dark, not clinical dark.
- **PHOS:** Full canonical token alignment — the reference implementation for the design system.

---

## Shared Components

| Component | Used By | Notes |
|-----------|---------|-------|
| K4 Hero SVG | Hub, Phosphorus31, PHOS, BONDING, Willow | Canonical in `packages/ui/src/k4-hero.ts` — vanilla + React wrapper |
| `@p31/design-system/tokens.css` | All 5 frontend apps | Canonical CSS custom properties |
| `@p31/design-system/themes.css` | PHOS, Willow, BONDING | quantum/sanctuary/crisis theme overrides |
| `@p31/design-system/motion.css` | All 5 frontend apps | 6-tier spoon-aware motion scaling |
| Glass panel CSS | Hub, Phosphorus31, PHOS | `backdrop-filter: blur(12px)`, `24px` radius, `rgba(255,255,255,0.04)` surface |
| Fixed navbar | Hub, Phosphorus31 | Glass-panel navbar, fixed top, centered |
| Skip link | All apps | `<a href="#main-content">Skip to main content</a>` |
