# Status — Design Vision

## Identity

- **Name:** P31 Status
- **URL:** `status.p31ca.org`
- **Tagline:** "Service health monitoring"
- **Audience:** Operators, users checking service health
- **Purpose:** Health checks for 7 core P31 services, latency tracking, historical data
- **Tech:** Cloudflare Worker + D1 database, Worker-generated HTML
- **Schedule:** Cron trigger runs health checks every 15 minutes

---

## Layout System

- **Container:** `max-width: 720px`, centered
- **Page padding:** `32px`
- **Centered vertically and horizontally:** `min-height: 100vh, display: flex, align-items: center, justify-content: center`
- **Single-page dashboard** — table of service health
- **No framework** — vanilla HTML string generation

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0f` | Page void (canonical) |
| Surface | `rgba(255,255,255,0.03)` | Table background |
| Text primary | `#e0e0e0` | Body text, headings |
| Text muted | `#94a3b8` | Table headers, footer, error text |
| Status up | `#00e5ff` | "UP" status text, summary when all healthy |
| Status degraded | `#fbbf24` | "DEGRADED" status, summary when some degraded |
| Status down | `#fca5a5` | "DOWN" status text |
| Border | `rgba(255,255,255,0.06)` | Table header border |
| Row border | `rgba(255,255,255,0.04)` | Table row borders |
| Row hover | `rgba(255,255,255,0.02)` | Table row hover |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Title | system-ui | `24px` | 400 | `#e0e0e0` |
| Summary | system-ui | `14px` | 400 | Color varies by health |
| Table header | system-ui | `12px` | 400 | `uppercase, letter-spacing: 1px, #94a3b8` |
| Table cell | system-ui | `14px` (default) | 400 | `#e0e0e0` |
| Service name | system-ui | `14px` | 600 | `#e0e0e0` |
| Error text | system-ui | `12px` | 400 | `#94a3b8` |
| Footer | system-ui | `12px` | 400 | `#94a3b8, text-align: center` |

---

## Component Inventory

### Title
```
<h1>P31 Status</h1>: font-size: 24px, margin-bottom: 4px
```

### Summary Line
```
<p class="summary">N/M services operational</p>
Color: #00e5ff (all up), #fbbf24 (some degraded/down)
margin-bottom: 24px
```

### Health Table
```
width: 100%
border-collapse: collapse
background: rgba(255,255,255,0.03)
border-radius: 12px
overflow: hidden
```

### Table Header
```
padding: 12px 16px
text-align: left
font-size: 12px
text-transform: uppercase
letter-spacing: 1px
color: #94a3b8
border-bottom: 1px solid rgba(255,255,255,0.06)
Columns: Service, Status, Latency, Error
```

### Table Row
```
padding: 8px 16px
border-bottom: 1px solid rgba(255,255,255,0.04)
hover: background: rgba(255,255,255,0.02)
Service name: font-weight: 600
Status: colored text (#00e5ff UP, #fbbf24 DEGRADED, #fca5a5 DOWN)
Latency: text-align: right
Error: font-size: 12px, color: #94a3b8
```

### Footer
```
margin-top: 24px
font-size: 12px
color: #94a3b8
text-align: center
Content: "Last checked: ISO timestamp"
```

---

## Glass/Visual Language

- **No glassmorphism** — Status uses minimal, clean design
- **No backdrop-filter** — pure readability
- **Border radius:** `12px` on table (via `border-radius: 12px; overflow: hidden`)
- **Background:** `rgba(255,255,255,0.03)` on table — very subtle
- **No shadows** — flat design

---

## Motion

- **No animations** — Status is a static health snapshot
- **No spoon-aware motion** — health data is always presented at full fidelity
- **Data freshness:** Cron trigger runs every 15 minutes, dashboard shows latest results

---

## Services Monitored

| Service | Health URL | Expected Response |
|---------|-----------|-------------------|
| phos | `https://phos.p31ca.org/health` | `ok` |
| gateway | `https://gateway.p31ca.org/health` | `ok` |
| p31ca | `https://p31ca.org` | `<!doctype` |
| willow | `https://willow.p31ca.org` | `<!doctype` |
| bonding | `https://bonding.p31ca.org` | `<!doctype` |
| love-ledger | `https://love-ledger.p31ca.org/health` | `ok` |
| status | `https://status.p31ca.org/health` | `ok` |

### Status Classification

| Condition | Status | Color |
|-----------|--------|-------|
| HTTP 200 + expected body + latency < 3000ms | `up` | `#00e5ff` |
| HTTP 200 + expected body + latency ≥ 3000ms | `degraded` | `#fbbf24` |
| HTTP error or unexpected body | `down` | `#fca5a5` |
| Timeout (10s) or network error | `down` | `#fca5a5` |

---

## API Endpoints

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | HTML dashboard |
| GET | `/health` | `{ status: "ok"|"degraded", services: [...] }` |
| GET | `/api/checks` | Last 100 health check records from D1 |

---

## Data Storage (D1)

```sql
health_checks (
  id INTEGER PRIMARY KEY,
  service TEXT,
  status TEXT,
  latency_ms INTEGER,
  checked_at TEXT,
  error TEXT
)
```

- Results written after each check
- Old entries pruned (keep 7 days)

---

## Content Sections (Dashboard Anatomy)

1. **Title** — "P31 Status"
2. **Summary** — "N/M services operational" (colored by health)
3. **Health Table** — 4-column table (Service, Status, Latency, Error)
4. **Footer** — Last checked timestamp

---

## Interactive States

- **Row hover:** `background: rgba(255,255,255,0.02)` — subtle highlight
- **No click interactions** — dashboard is read-only
- **Auto-refresh:** Page reloads with fresh data on each visit

---

## Accessibility

- **Color contrast:** `#e0e0e0` on `#0a0a0f` ≈ 15:1 (passes AAA)
- **Status colors:** All status colors on dark background exceed 4.5:1 contrast
- **Semantic HTML:** `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- **No keyboard traps** — simple table layout
- **Screen reader:** Table headers provide context for data cells

---

## Gemini Prompt Notes

- Status is the **simplest surface** — just a title, summary, and table
- No glassmorphism, no animations, no spoon-awareness
- The table uses `border-radius: 12px; overflow: hidden` for rounded corners
- Status colors are the key visual element — green/cyan for up, yellow for degraded, red for down
- The summary line color matches the worst status
- Include the fetch pattern for `/health` and `/api/checks` endpoints
- The footer shows the last check timestamp
- This is a **utility page** — prioritize clarity and speed over visual richness
