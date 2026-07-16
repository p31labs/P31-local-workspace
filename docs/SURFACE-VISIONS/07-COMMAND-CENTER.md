# Command Center — Design Vision

## Identity

- **Name:** G.O.D. / EPCP Command Center (Grounded Operator Deck)
- **URL:** `command-center.p31ca.org`
- **Tagline:** "Edge fleet + local 127.0.0.1:3131 (P31 home) + p31ca/ops glass"
- **Audience:** P31 operator/admin (single user, behind Cloudflare Access)
- **Purpose:** Operational monitoring, fleet telemetry, emergency controls, legal/financial KPIs
- **Auth:** Cloudflare Access JWT + RBAC (admin/operator/legal/reader)
- **Tech:** Cloudflare Worker-generated HTML (no framework, no build step)

---

## Layout System

- **Container:** `max-width: 1200px`, centered
- **Page padding:** `padding: 64px 16px 32px` (top offset for fixed header)
- **Grid:** KPI cards use `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- **Single-page dashboard** — all content on one page, dynamically rendered via JS
- **No framework** — vanilla JS string concatenation for HTML generation

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a14` | Page void (slightly blue-tinted) |
| Surface | `#111827` | Card backgrounds |
| Surface alt | `#0f172a` | Worker row backgrounds |
| Border | `#1e293b` | Card borders, dividers |
| Text primary | `#e2e8f0` | Headings, values |
| Text secondary | `#94a3b8` | Body text, descriptions |
| Text muted | `#64748b` | Labels, metadata |
| Accent cyan | `#22d3ee` | Links, highlights, date labels |
| Accent violet | `#a78bfa` | Gradient title |
| Accent indigo | `#6366f1` | Header gradient start |
| Accent rose | `#e8636f` | Header gradient end |
| Status online | `#22c55e` | Online dot + glow |
| Status offline | `#ef4444` | Offline dot + glow |
| Status degraded | `#eab308` | Degraded dot + glow |
| Danger | `#ef4444` | Destructive buttons |
| Success | `#22c55e` | Safe actions |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Title | system-ui | `22px` | 700 | Gradient text (violet → cyan → cyan) |
| Subtitle | system-ui | `12px` | 400 | `#64748b` |
| KPI value | system-ui | `24px` | 700 | `#e2e8f0` |
| KPI label | system-ui | `11px` | 400 | `uppercase, letter-spacing: 1px, #64748b` |
| Card title | system-ui | `11px` | 600 | `uppercase, letter-spacing: 1px, #64748b` |
| Button text | system-ui | `13px` | 600 | On action buttons |
| Worker name | system-ui | `13px` | 400 | In worker rows |
| Code/inline | monospace | `12px` | 400 | `#22d3ee` color |

**Note:** Command Center uses `system-ui` (not Inter) — intentional for operator tool aesthetic.

---

## Component Inventory

### Header (Fixed)
```
position: fixed, top: 0, left: 0, right: 0, z-index: 99
height: 48px
background: linear-gradient(90deg, #6366f1, #22d3ee, #a78bfa, #e8636f)
No text — pure gradient bar
```

### Title Block
```
<h1>: gradient text (violet → cyan → cyan), font-size: 22px
Subtitle: "Grounded Operator Deck — edge fleet + local 127.0.0.1:3131 + p31ca/ops glass"
Auth status: "Logged in as {email} ({role})" or "Not authenticated"
```

### KPI Card
```
background: #111827
border: 1px solid #1e293b
border-radius: 12px
padding: 16px
Value: 24px, font-weight: 700
Label: 11px, uppercase, letter-spacing: 1px, #64748b
```

### KPI Grid
```
display: grid
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))
gap: 16px
margin-bottom: 16px
```

### Worker Row
```
display: flex, justify-content: space-between, align-items: center
padding: 12px
background: #0f172a
border: 1px solid #1e293b
border-radius: 8px
margin-bottom: 8px
cursor: pointer
hover: background: #1e293b
Status dot: 8px circle (green/yellow/red with glow)
```

### Worker Details (Expandable)
```
display: none (toggled via JS)
padding: 12px
background: #0a0a14
border: 1px solid #1e293b
border-radius: 8px
margin-top: 8px
font-size: 12px
```

### Action Button
```
padding: 10px 16px
border-radius: 8px
border: 1px solid #334155
background: #1e293b
color: #e2e8f0
font-size: 13px, font-weight: 600
cursor: pointer
hover: background: #334155
```

### Danger Button
```
Same as action button but:
border-color: #ef4444
color: #ef4444
hover: background: rgba(239,68,68,0.12)
```

### Success Button
```
Same as action button but:
border-color: #22c55e
color: #22c55e
```

### Alert Banner
```
padding: 12px
border-radius: 8px
margin-bottom: 12px
font-size: 13px
Warning: background: rgba(234,179,8,0.12), border: 1px solid #eab308, color: #eab308
```

### Status Dot
```
width: 8px, height: 8px, border-radius: 50%, display: inline-block, margin-right: 8px
Online: background: #22c55e, box-shadow: 0 0 8px #22c55e
Offline: background: #ef4444, box-shadow: 0 0 8px #ef4444
Degraded: background: #eab308, box-shadow: 0 0 8px #eab308
```

### Local Deck Card
```
Special card with indigo tint:
border-color: #4f46e5
background: linear-gradient(180deg, rgba(79,70,229,0.12), #111827)
Contains: localhost connection info, repo links, lattice table
```

### Date Row (Legal/Financial)
```
display: flex, gap: 10px, padding: 5px 6px
font-size: 13px
border-bottom: 1px solid #1e293b
Date label: font-weight: 700, min-width: 70px, font-size: 12px, color: #22d3ee
```

---

## Glass/Visual Language

- **No glassmorphism** — Command Center uses solid card backgrounds (`#111827`)
- **No backdrop-filter** — operator tool prioritizes readability over ambient aesthetic
- **Border radius:** `12px` for cards, `8px` for buttons/rows
- **Borders:** `1px solid #1e293b` throughout
- **Shadows:** None — flat design
- **Gradient header:** The only decorative element — `linear-gradient(90deg, #6366f1, #22d3ee, #a78bfa, #e8636f)`

---

## Motion

- **No animations** — Command Center is a static dashboard
- **Hover transitions:** `background` color change on worker rows and buttons
- **No spoon-aware motion** — operator tools are always at full functionality
- **Fleet data:** Fetched via `fetch("/api/status")`, rendered via JS DOM manipulation

---

## Data Flow

```
Load → fetch("/api/whoami") → get user role
     → fetch("/api/status") → get fleet status
     → renderDashboard(whoami, status)
     → populate KPI grid, worker list, alerts
```

---

## Content Sections (Dashboard Anatomy)

1. **Gradient Header** — fixed 48px bar
2. **Title Block** — gradient title + auth status
3. **Local Deck Card** — localhost connection info, repo links
4. **KPI Grid** — fleet metrics (workers online, D1 databases, KV stores, etc.)
5. **Worker List** — expandable rows with status dots
6. **Action Buttons** — panic buttons, emergency controls
7. **Legal/Financial Cards** — date-stamped records
8. **Alert Banners** — warnings for degraded services

---

## Interactive States

- **Worker row hover:** `background: #1e293b`
- **Worker row click:** Toggle details panel (display: none → block)
- **Button hover:** `background: #334155` (standard), `rgba(239,68,68,0.12)` (danger)
- **Status dot:** Constant glow animation (box-shadow pulse)

---

## Accessibility

- **Authentication:** Cloudflare Access JWT required
- **RBAC:** Admin/operator/legal/reader roles
- **Keyboard:** All buttons keyboard-accessible
- **Color contrast:** `#e2e8f0` on `#111827` ≈ 10:1 (passes AAA)
- **Status indicators:** Color + text (dot + "ONLINE"/"OFFLINE")

---

## Gemini Prompt Notes

- Command Center is an **operator tool** — NOT a public-facing surface
- It uses `system-ui` font (not Inter) — intentional for the dashboard aesthetic
- No glassmorphism — solid cards with clear borders for maximum readability
- The gradient header is the ONLY decorative element — keep it
- Cards use `#111827` background with `#1e293b` borders — NOT glass panels
- The dashboard is generated entirely by the Worker — no build step, no framework
- Fleet data is fetched from `/api/status` — include the fetch pattern
- KPI grid uses `repeat(auto-fill, minmax(200px, 1fr))` for responsive layout
- Worker rows are expandable — include the toggle pattern
- Danger buttons (panic controls) use `#ef4444` — clearly distinct from standard buttons
