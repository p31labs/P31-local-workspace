# Phosphorus31 — Design Vision

## Identity

- **Name:** Phosphorus31 (P31 Labs, Inc.)
- **URL:** `phosphorus31.org`
- **Tagline:** "Technology that moves at the speed of your child's brain."
- **Audience:** Families, donors, researchers, neurodivergent community
- **Purpose:** Nonprofit portal — mission, fundraising, research publications, transparency, community
- **Status:** Georgia nonprofit corporation, 501(c)(3) application pending

---

## Layout System

- **Max width:** `max-w-7xl` (1280px) for hero/needs grid, `max-w-6xl` (1152px) for research
- **Page padding:** `px-6` (24px) horizontal
- **Grid:** 1-column mobile → 3-column responsive (`grid-cols-1 md:grid-cols-3`)
- **Section spacing:** `py-20 md:py-32` (hero), `py-24` (needs grid), `py-16` (3 doors), `py-20` (research/community/donate)
- **Layout wrapper:** `Layout.astro` — single consistent shell for all 9 routes

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0F` | Page void |
| Surface | `#12121A` | Section backgrounds (`bg-surface`) |
| Surface2 | `#1C1C2A` | Alternate sections (`bg-surface2`) |
| Text primary | `#FFFFFF` | Headings, bold text |
| Text cloud | `rgba(161,161,170,0.7)` | Body text (`text-cloud/70`) |
| Quantum cyan | `#00F0FF` | Primary accent — CTAs, highlights, links |
| Quantum violet | `#A78BFA` | Secondary accent — donate buttons, badges |
| Quantum gold | `#FBBF24` | Tertiary — donation support, metrics |
| Quantum green | `#34D399` | Stats ($0 cost indicator) |
| Glass surface | `rgba(255,255,255,0.04)` | Card backgrounds |
| Glass border | `rgba(255,255,255,0.08)` | Card borders |

---

## Typography

| Element | Font | Size | Weight | Line Height | Notes |
|---------|------|------|--------|-------------|-------|
| Hero title | Inter | `text-5xl md:text-7xl` (48-72px) | 900 (black) | `leading-[1.1]` | `font-heading` class |
| Section title | Inter | `text-3xl md:text-4xl` (30-36px) | 900 (black) | 1.2 | `font-heading` |
| Card title | Inter | `text-2xl` (24px) | 700 (bold) | 1.3 | `font-heading` |
| Body text | Inter | `text-lg md:text-xl` (18-20px) | 400 | 1.6 | `text-cloud/70` |
| Badge | Inter | `text-xs` (12px) | 700 (bold) | 1 | `px-4 py-1.5 rounded-full` |
| Metric value | Inter | `text-4xl` (36px) | 900 (black) | 1 | Colored by quantum palette |
| Metric label | Inter | `text-sm` (14px) | 500 | 1 | `uppercase tracking-widest text-cloud/80` |
| CTA text | Inter | `text-lg` (18px) | 700 (bold) | 1 | On buttons |

---

## Component Inventory

### Navbar
- Not present in current implementation — navigation is via CTAs within sections
- This is intentional: the nonprofit portal is a **scrolling landing experience**

### Hero Section
```
flex-col-reverse md:flex-row items-center gap-16
Left: badge + title + description + 3 CTA buttons
Right: K4 tetrahedron SVG (280x280px)
Badge: "Evidence-Based Assistive Technology" (bg-quantum-violet/20, text-quantum-violet, rounded-full, border-quantum-violet/40)
Title: "Technology that moves at the speed of your child's brain." (quantum-cyan span for emphasis)
CTAs: "Find Tools for My Family" (quantum-violet solid), "Technical Hub" (quantum-cyan outline), "Join Discord" (surface2 solid)
```

### Metrics Bar
```
bg-surface, py-12
4-column grid (grid-cols-2 md:grid-cols-4), divide-x divide-white/10
Each: metric value (text-4xl, font-black, quantum color) + label (text-sm, uppercase, tracking-widest)
Metrics: BONDING tests, 100% Open Source, Routes count, $0 Cost
```

### Family Needs Grid
```
3-column grid (grid-cols-1 md:grid-cols-3), gap-8
Each card: glass-box, p-8, rounded-3xl, border-t-4 (colored by category)
Icon: 14x14 circle with emoji, bg-{color}/10, rounded-2xl
Title: font-heading, font-bold, text-2xl
Description: text-cloud/70, text-sm
CTA: "{color} font-bold flex items-center gap-2"
Categories: Remote Connection (cyan), Cognitive Prosthetics (violet), Communication Shields (gold)
```

### Glass Box Card
```
class: glass-box
background: rgba(255,255,255,0.04)
backdrop-filter: blur(12px)
border: 1px solid rgba(255,255,255,0.08)
border-radius: rounded-3xl (24px)
padding: p-8 (32px)
border-top: 4px solid (category color)
hover: shadow-xl, group-hover:scale-110 on icon
```

### Research Publication Card
```
bg-surface/5, backdrop-blur-sm, border-white/10, rounded-2xl, p-6
hover: border-quantum-cyan/30
DOI badge: bg-quantum-cyan, text-void, text-xs, font-bold, px-3 py-1, rounded-full
DOI number: text-white/40, text-xs, font-mono
Title: text-xl, font-heading, font-bold, white
Description: text-white/60, text-sm, leading-relaxed
Link: text-quantum-cyan, text-sm, font-bold
```

### Donate CTA
```
bg-gradient-to-br from-quantum-violet via-surface to-quantum-cyan, py-20
Label: "Support P31 Labs" (text-quantum-gold, font-bold, tracking-widest, uppercase)
Title: "Every atom placed is a connection." (text-3xl md:text-4xl, font-heading, font-black)
Buttons: "Donate via PayPal" (quantum-violet solid), "Ko-fi" (surface/10 with border-2)
```

---

## Glass/Visual Language

- **Glass blur:** `backdrop-filter: blur(12px)` (glass-box), `backdrop-filter: blur-sm` (research cards)
- **Border radius:** `rounded-3xl` (24px) for family cards, `rounded-2xl` (16px) for research/donate, `rounded-xl` (12px) for buttons
- **Surface sections:** Alternating `bg-surface` and `bg-surface2` for visual rhythm
- **Gradient:** Donate section uses `from-quantum-violet via-surface to-quantum-cyan`
- **Border-top accents:** 4px colored borders on family needs cards (cyan/violet/gold)

---

## Motion

- **Imported:** `@p31/design-system/motion` (6-tier spoon-aware)
- **Hero fade-in:** `animate-[fadeIn_0.4s_ease-out]` on main element
- **K4 SVG animations:** Same as Hub — inline `<animate>` elements
- **Card hover:** `hover:-translate-y-1` on CTAs, `group-hover:scale-110` on icons
- **Button transitions:** `transition-transform hover:-translate-y-1`, `transition-colors`
- **Research card hover:** `hover:border-quantum-cyan/30 transition-colors`

---

## Content Sections (Landing Page Anatomy)

1. **Hero** — badge + title + description + 3 CTAs + K4 SVG (280px)
2. **Metrics Bar** — 4 key metrics in a divided grid
3. **Family Needs Grid** — 3 cards (Remote Connection, Cognitive Prosthetics, Communication Shields)
4. **One Org, Three Doors** — nonprofit hub/technical hub/edge runtime explanation
5. **Research Publications** — 2 Zenodo DOI cards + "All Publications" CTA
6. **Community** — Discord + Ko-fi + GitHub buttons
7. **Glass Box Ethos** — mission statement about open-source accessibility
8. **Donate CTA** — gradient section with PayPal + Ko-fi buttons

---

## Interactive States

- **Card hover:** shadow-xl, icon scales 110%
- **CTA button hover:** translateY(-1px), brightness adjustment
- **Link hover:** color transitions (cyan → cyan/80, violet → violet/80)
- **Badge hover:** border-color lightens
- **All links:** `no-underline` throughout

---

## Accessibility

- Skip link: present via Layout.astro
- Semantic HTML: `<main>`, `<section>`, `<nav>` elements
- Card links use `target="_blank" rel="noopener noreferrer"` for external links
- K4 SVG has `role="img" aria-label="K4 tetrahedron"`
- Color contrast: `text-cloud/70` on `#0A0A0F` ≈ 5.5:1 (passes AA)

---

## Gemini Prompt Notes

- This is the **nonprofit public face** — prioritize warmth, trust, and clarity over technical density
- The K4 tetrahedron SVG is 280px (larger than Hub — it's the hero centerpiece)
- The "Three Doors" section explains the ecosystem relationship — important for donor understanding
- Don't include a navbar — the current design is intentionally a scrolling landing page
- The donate section uses a gradient background (violet → surface → cyan) — this is the most visually rich section
- Family needs cards use `rounded-3xl` (24px) — softer than Hub cards
- Research cards are simpler — `bg-surface/5` with thin borders, not full glass panels
