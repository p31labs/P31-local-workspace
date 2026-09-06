# P31 Hearing Ops

<!-- pmm-badge -->
![PMM Maturity](../../.p31/badges/p31-hearing-ops.svg)
<!-- /pmm-badge -->

Vite + React PWA for case management (Johnson v. Johnson, 2025CV936).
Offline-first, local fonts, no external CDN dependencies.

## Setup

```bash
npm install
npm run dev          # Local dev server
```

## Deploy (ops.p31ca.org)

Uses its own Cloudflare Pages project **`p31-hearing-ops`** (NOT `p31ca`).

```bash
npm run deploy       # Build + wrangler pages deploy
```

## Structure

```
src/
├── data/
│   ├── case-data.js      # Docket entries, scenarios, citations, deadlines
│   └── omnibus-data.js   # D20 oracle faces
├── components/
│   ├── StatusTab.jsx     # Current case timeline + deadlines (NEW)
│   ├── MissionTab.jsx    # Archived April 16 hearing mission
│   ├── DocketTab.jsx     # Full docket with filter
│   ├── LawTab.jsx        # Legal citations by category
│   ├── ScriptTab.jsx     # Opening script + response templates
│   ├── ScenariosTab.jsx  # Decision tree
│   ├── RulesTab.jsx      # Do/Do Not rules
│   ├── FolderTab.jsx     # Physical folder checklist
│   ├── OmnibusTab.jsx    # D20 oracle + vagal + K4
│   ├── StatBox.jsx       # Reusable stat card
│   └── StatusBadge.jsx   # Reusable docket status badge
└── App.jsx               # Tab layout + lazy loading
```

## Key Features

- **Offline-first PWA** — full functionality in airplane mode
- **Lazy-loaded tabs** — initial load under 50KB
- **Case timeline** — tracks events from April 16 through present
- **Docket with filter** — pre/post-hearing toggle
- **Deadline tracker** — ASAN, NSF SBIR, FERS, GA Annual Registration
- **Stress tools** — vagal breathing guide, K4 seal visualization

## Data Status

All case data is current through June 21, 2026.
