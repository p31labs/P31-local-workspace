# CWP-2026-014: THE RESONANCE
## Production-Level Apps + Telemetry Mesh Integration | April 5–20, 2026

**STATUS:** AUTHORIZED  
**ISSUED:** 2026-04-04  
**OPERATOR:** William R. Johnson  
**GEOMETRY:** Resonance — when every component vibrates at the same frequency, the system amplifies. 22 Workers exist. 34 vectors are deployed. None of them talk to each other. This CWP makes them sing in harmony.  
**OBJECTIVE:** Bring every deployed app to production quality. Wire every Worker into a unified telemetry mesh. Make the ecosystem a single organism, not 34 disconnected organs.

---

## PREAMBLE

The build sprint is over. In 72 hours, the Triad produced an EDE, 5 whitepaper systems, 11 standalone apps, a full website rebuild, and 3 Zenodo papers. The velocity was necessary. The technical debt is real.

Most standalone apps were built in 30-minute agent sessions. They work, but they're not production-grade. They don't persist state. They don't report telemetry. They don't connect to each other. The 22 Cloudflare Workers operate independently — there's no unified event bus, no centralized health monitoring, no way to trace a user journey from phosphorus31.org → p31ca.org/ede → bonding.p31ca.org.

This CWP fixes that. Every app gets hardened. Every Worker gets wired into the telemetry mesh. The ecosystem becomes observable.

---

## TRACK 1: APP HARDENING (Bring All 34 Vectors to Production)

### WCD-R01: Audit All Deployed Apps

**Agent:** Sonnet (CC)  
**Scope:** Systematic audit of every deployed artifact

| Step | Task | OQE |
|------|------|-----|
| R01.1 | Crawl p31ca.org: list every HTML file in public/, verify each loads without JS console errors | Error inventory |
| R01.2 | Check all 12+ about pages: consistent nav, footer, branding, launch links work | About page audit |
| R01.3 | Check all 11 standalone apps: load time, console errors, mobile responsive, touch targets ≥48px | App audit |
| R01.4 | Check bonding.p31ca.org: all 413 tests still pass, multiplayer relay responds | BONDING verified |
| R01.5 | Check spaceship-earth.pages.dev: loads, Jitterbug animates, no console errors | SE verified |
| R01.6 | Check phosphorus31.org: all pages return 200, Stripe donate works, JSON-LD valid | Site verified |
| R01.7 | Produce `docs/APP_AUDIT_RESULTS.md` with pass/fail per app | Audit document |

**Signoff OQE:** Complete inventory of every deployed artifact with pass/fail status.

### WCD-R02: Standalone App Hardening Pass

**Agent:** Sonnet (CC)  
**Prereq:** R01 signed  
**Scope:** Fix every issue found in the audit. Target: zero console errors across all apps.

| Step | Task | OQE |
|------|------|-----|
| R02.1 | Fix all JS console errors identified in R01 | Zero errors |
| R02.2 | Add IndexedDB persistence to every app that has user state (EDE already has it — check larmor, switches, dome, particles, builder, economy, guardian, identity, cockpit, tomography, editor, resonance-engine, ide) | State persists across refresh |
| R02.3 | Add Service Worker registration to every standalone app (or verify existing) | Offline-capable |
| R02.4 | Verify P31 design system consistency: void=#0f1115, coral, phosphorus, Atkinson Hyperlegible | Visual consistency |
| R02.5 | Verify mobile responsiveness: all apps usable on 375px viewport | Mobile works |
| R02.6 | Verify touch: all interactive elements ≥48px, touch-action:none on drag surfaces | Touch accessible |
| R02.7 | Add `<meta name="description">` and `<meta property="og:...">` to every standalone app | SEO/social present |
| R02.8 | Verify all back-links (app → about → hub → home) create a complete navigation loop | No dead ends |

**Signoff OQE:** All apps: zero console errors, persistent state, offline-capable, mobile-responsive, SEO tags, complete nav.

### WCD-R03: EDE Production Hardening

**Agent:** Sonnet (CC)  
**Scope:** The EDE is the flagship. It gets extra attention.

| Step | Task | OQE |
|------|------|-----|
| R03.1 | Load test: open EDE, create 20 files, run 50 transpilations, verify no memory leak | No leak |
| R03.2 | Verify all 6 panels function independently (each should work if others fail) | Graceful degradation |
| R03.3 | Verify Progressive Disclosure: artificially drain spoons → panels hide → Layer 0 activates → recover → panels return | Full cycle |
| R03.4 | Verify Trimtab: drag, click, long-press all work on desktop and mobile | All gestures work |
| R03.5 | Verify file export (JSZip): create 5 files → export → verify ZIP contains all 5 | Export works |
| R03.6 | Verify file import: drag .js file onto editor → file appears in tabs | Import works |
| R03.7 | Verify settings persist: change theme/font size → refresh → settings retained | Settings persist |
| R03.8 | Performance: Lighthouse score ≥80 on EDE page | Score documented |

**Signoff OQE:** EDE is production-grade. Every feature verified. Performance acceptable.

---

## TRACK 2: WORKER INVENTORY + HEALTH MONITORING

### WCD-R04: Worker Audit

**Agent:** Sonnet (CC) or Operator  
**Scope:** Inventory all 22 Cloudflare Workers. Determine which are active, which are stale.

| Step | Task | OQE |
|------|------|-----|
| R04.1 | List all 22 Workers with: name, subdomain, custom domain (if any), last modified, request count, binding count | Full inventory |
| R04.2 | Categorize each: ACTIVE (receiving requests), DORMANT (deployed but unused), STALE (should be deleted) | Categories assigned |
| R04.3 | For each ACTIVE Worker: document purpose, endpoints, secrets required | Docs per Worker |
| R04.4 | Identify Workers that should be consolidated (e.g., p31-social-broadcast vs p31-sce-broadcaster vs p31-social-drop-automation — are these all the same thing?) | Consolidation list |
| R04.5 | Document in `docs/WORKER_INVENTORY.md` | Inventory file exists |

**Known Workers from dashboard (page 1 + page 2):**

| Worker | Domain | Requests | Purpose |
|--------|--------|----------|---------|
| kenosis-mesh | *.trimtab-signal.workers.dev | 2 | K4 7-node mesh |
| bonding-relay | *.trimtab-signal.workers.dev | 74 | BONDING multiplayer |
| p31-sce-broadcaster | *.trimtab-signal.workers.dev | 1 | Social content (Twitter blocked) |
| spaceship-relay | *.trimtab-signal.workers.dev | 1.7K | SE data relay |
| p31-multi-agent-mesh | *.trimtab-signal.workers.dev | — | Agent coordination (7 bindings) |
| p31-kofi-webhook | kofi.p31ca.org + 3 | 388 | Ko-fi payment processing |
| p31-social-worker | social.p31ca.org + 1 | 2 | Social features |
| p31-quantum-edge-staging | *.trimtab-signal.workers.dev | — | Staging (4 bindings) |
| p31-social-broadcast | *.trimtab-signal.workers.dev | — | Duplicate? |
| p31-social-drop-automation | *.trimtab-signal.workers.dev | — | Duplicate? |
| p31-mesh-discord-worker | *.trimtab-signal.workers.dev | — | Discord mesh |
| p31-cortex | *.trimtab-signal.workers.dev | 2 | AI cortex (9 bindings) |
| p31-workers | *.trimtab-signal.workers.dev | 6 | General (2 bindings) |
| donate-api | donate-api.phosphorus31.org | 19 | Stripe checkout |
| p31-quantum-entropy | *.trimtab-signal.workers.dev | — | Entropy source |
| p31-quantum-bridge | *.trimtab-signal.workers.dev | — | Quantum bridge |
| p31-kofi-telemetry | *.trimtab-signal.workers.dev | — | Ko-fi analytics |
| p31-zenodo-publisher | *.trimtab-signal.workers.dev | — | Zenodo upload |
| p31-donation-relay | *.trimtab-signal.workers.dev | — | Donation forwarding |
| stripe-donate | *.trimtab-signal.workers.dev | — | Legacy Stripe (31d ago) |

**Signoff OQE:** All 22 Workers documented. Active/dormant/stale categorized. Consolidation candidates identified.

### WCD-R05: Unified Health Endpoint

**Agent:** Sonnet (CC)  
**Scope:** Every ACTIVE Worker gets a `/health` endpoint returning standardized JSON

| Step | Task | OQE |
|------|------|-----|
| R05.1 | Define health response schema: `{ service, status, uptime, version, lastRequest, bindings }` | Schema defined |
| R05.2 | Add `/health` to kenosis-mesh (already has one — verify schema) | Endpoint works |
| R05.3 | Add `/health` to bonding-relay | Endpoint works |
| R05.4 | Add `/health` to p31-sce-broadcaster | Endpoint works |
| R05.5 | Add `/health` to donate-api | Endpoint works |
| R05.6 | Add `/health` to p31-kofi-webhook | Endpoint works |
| R05.7 | Add `/health` to p31-cortex | Endpoint works |
| R05.8 | Add `/health` to spaceship-relay | Endpoint works |
| R05.9 | Create `health-check.sh` script that curls all endpoints and reports status | Script works |

**Signoff OQE:** Every active Worker has a `/health` endpoint. Single script checks all.

### WCD-R06: Uptime Dashboard

**Agent:** Sonnet (CC)  
**New file:** `software/p31ca/public/health.html`  
**Scope:** Standalone app showing real-time health of all Workers

| Step | Task | OQE |
|------|------|-----|
| R06.1 | Build health.html: fetches all `/health` endpoints on load and every 60s | Dashboard renders |
| R06.2 | Display each Worker as a card: name, status (green/red), last response time, uptime | Cards render |
| R06.3 | Show overall system status: "All systems operational" or "N systems degraded" | Status line |
| R06.4 | P31 design system styling | Matches ecosystem |
| R06.5 | Add to p31ca.org as a card (status="LIVE") | Card visible |

**Signoff OQE:** Health dashboard live at p31ca.org/health showing real-time Worker status.

---

## TRACK 3: TELEMETRY MESH — WIRE EVERYTHING TOGETHER

### WCD-R07: Genesis Gate as Central Telemetry Hub

**Agent:** Sonnet (CC)  
**Scope:** Genesis Gate (packages/genesis-gate/) becomes the canonical event bus for the ecosystem

| Step | Task | OQE |
|------|------|-----|
| R07.1 | Define event taxonomy: `{ source, type, payload, timestamp, session_id }` | Schema in docs |
| R07.2 | Event types: `page_view`, `app_launch`, `code_run`, `spoon_decay`, `fawn_guard_trigger`, `larmor_activation`, `donation`, `error`, `health_check`, `build_result` | Types defined |
| R07.3 | Genesis Gate receives events via HTTP POST `/event` | Endpoint works |
| R07.4 | Genesis Gate stores in Cloudflare KV with TTL (30 days) | Events persist |
| R07.5 | Genesis Gate serves event feed via GET `/events?since=<timestamp>` | Feed works |
| R07.6 | GovernanceHook: alert on error rate > 5/minute, spoon_decay to MINIMAL, fawn_guard_trigger | Alerts fire |
| R07.7 | Deploy Genesis Gate as CF Worker (if not already) or verify it's accessible | Deployed |

**Signoff OQE:** Genesis Gate is the central event bus. Events flow in, persist, and trigger governance.

### WCD-R08: App → Genesis Gate Event Emission

**Agent:** Sonnet (CC)  
**Prereq:** R07 signed  
**Scope:** Every standalone app emits telemetry to Genesis Gate

| Step | Task | OQE |
|------|------|-----|
| R08.1 | Create `p31-telemetry.js` (~50 lines): shared module that apps include via `<script>` | Module exists |
| R08.2 | Module provides: `p31.track(type, payload)` → POST to Genesis Gate `/event` | Function works |
| R08.3 | Module auto-tracks: page_view on load, session duration on unload (via sendBeacon) | Auto-tracking works |
| R08.4 | Add `<script src="/p31-telemetry.js">` to all standalone apps | Script included |
| R08.5 | EDE emits: code_run, spoon_decay, fawn_guard_trigger, larmor_activation | Events fire |
| R08.6 | BONDING emits: game_start, molecule_complete, ping_sent, session_end | Events fire |
| R08.7 | Larmor emits: larmor_activation, breathing_start, frequency_change | Events fire |
| R08.8 | TACTILE emits: typing_test_complete, quest_complete, game_played | Events fire |
| R08.9 | Donate pages emit: donation_initiated (not amount — privacy) | Events fire |

**Signoff OQE:** All apps emit structured telemetry to Genesis Gate.

### WCD-R09: Worker → Genesis Gate Event Emission

**Agent:** Sonnet (CC)  
**Prereq:** R07 signed  
**Scope:** Active Workers emit telemetry on key events

| Step | Task | OQE |
|------|------|-----|
| R09.1 | bonding-relay: emit `relay_message` on each multiplayer sync | Events fire |
| R09.2 | donate-api: emit `donation_processed` on successful Stripe checkout | Events fire |
| R09.3 | p31-kofi-webhook: emit `kofi_donation` on each Ko-fi payment | Events fire |
| R09.4 | kenosis-mesh: emit `mesh_init`, `mesh_aggregate` on session lifecycle | Events fire |
| R09.5 | p31-sce-broadcaster: emit `social_post` on each broadcast (when working) | Events fire |
| R09.6 | Genesis Gate aggregates all Worker events alongside app events | Unified stream |

**Signoff OQE:** Worker events flow into the same Genesis Gate telemetry stream as app events.

### WCD-R10: Telemetry Dashboard

**Agent:** Sonnet (CC)  
**New file:** `software/p31ca/public/telemetry.html`  
**Prereq:** R07, R08, R09 signed

| Step | Task | OQE |
|------|------|-----|
| R10.1 | Build telemetry.html: fetches Genesis Gate `/events?since=1h` on load | Dashboard renders |
| R10.2 | Event stream: real-time feed of events as they arrive (polling every 10s) | Feed updates |
| R10.3 | Metrics: events/hour by type, top sources, error rate | Metrics compute |
| R10.4 | Spoon economy: aggregate spoon_decay events, show ecosystem-wide cognitive load | Aggregate visible |
| R10.5 | User journey: trace a session_id across apps (e.g., landing → EDE → BONDING) | Journey traceable |
| R10.6 | P31 design system | Matches ecosystem |
| R10.7 | Add to p31ca.org as card | Card visible |

**Signoff OQE:** Telemetry dashboard shows the entire ecosystem's pulse in real time.

---

## TRACK 4: CROSS-PRODUCT INTEGRATION

### WCD-R11: Deep Links Between Apps

**Agent:** Sonnet (CC)  
**Scope:** Every app can link to every other app with context

| Step | Task | OQE |
|------|------|-----|
| R11.1 | Define URL scheme: `p31ca.org/<app>?from=<source>&session=<id>` | Scheme documented |
| R11.2 | EDE → BONDING: "Test this molecule" button opens BONDING with a pre-loaded formula | Link works |
| R11.3 | EDE → Larmor: Fawn Guard trigger opens Larmor in breathing mode | Link works |
| R11.4 | BONDING → Ko-fi: achievement unlock suggests Ko-fi support | Link works |
| R11.5 | Hub → any app: all hub cards deep-link correctly | All links work |
| R11.6 | phosphorus31.org → p31ca.org: all product links verified | Cross-site works |
| R11.7 | Larmor → EDE: "Return to work" button from Layer 0 opens EDE | Link works |

**Signoff OQE:** Apps cross-reference each other with context-preserving deep links.

### WCD-R12: Shared State via Cloudflare KV

**Agent:** Sonnet (CC)  
**Scope:** Apps that share user state (spoons, settings, session) can read/write to a common KV namespace

| Step | Task | OQE |
|------|------|-----|
| R12.1 | Create KV namespace: `P31_USER_STATE` | Namespace exists |
| R12.2 | Define state schema: `{ spoons, tier, settings, lastActive, activeApp }` | Schema documented |
| R12.3 | Create CF Worker: `p31-state` with GET/PUT endpoints, auth via session token | Worker deployed |
| R12.4 | EDE writes spoon state on decay/regen | State written |
| R12.5 | Larmor reads spoon state to determine default mode (breathing if MINIMAL) | State read |
| R12.6 | Hub reads spoon state to show current tier badge | Badge shows |
| R12.7 | All reads/writes use `fetch()` with graceful fallback if offline | Offline safe |

**Signoff OQE:** Shared state flows between apps via KV. Spoon state is ecosystem-wide.

---

## CWP STACK (As of 2026-04-04)

```
CWP-2026-005  Incorporation    ACTIVE    SoS processing → ~Apr 14
CWP-2026-006  Larmor           ACTIVE    ESG target Apr 13
CWP-2026-011  Consolidation    ✅ CLOSED  v0.5.0-consolidation tagged
CWP-2026-012  Grant Cascade    ACTIVE    HCB + ESG + NIDILRR
CWP-2026-013  Signal           ACTIVE    Community → 39 nodes
CWP-2026-014  Resonance        NEW       34 apps hardened + telemetry mesh

CLOSED: 003↓, 004↓, 007, 008, 009, 010, 011
```

---

## EXECUTION ORDER

```
═══════════════════════════════════════════════════
PHASE 1 — AUDIT (Days 1-2)
  R01: Full app audit (every deployed artifact)
  R04: Worker inventory (all 22 Workers)
═══════════════════════════════════════════════════

PHASE 2 — HARDEN (Days 3-6)
  R02: Fix all audit issues across all apps
  R03: EDE production hardening
  R05: Health endpoints on all active Workers
═══════════════════════════════════════════════════

PHASE 3 — WIRE (Days 7-12)
  R07: Genesis Gate as telemetry hub
  R08: App → Genesis Gate events
  R09: Worker → Genesis Gate events
  R06: Health dashboard
═══════════════════════════════════════════════════

PHASE 4 — INTEGRATE (Days 13-16)
  R10: Telemetry dashboard
  R11: Deep links between apps
  R12: Shared state via KV
═══════════════════════════════════════════════════
```

---

## WORKER CONSOLIDATION CANDIDATES

These Workers appear to be duplicates or stale versions. Resolve during R04:

| Keep | Delete? | Reason |
|------|---------|--------|
| p31-sce-broadcaster | p31-social-broadcast, p31-social-drop-automation | Three social posting Workers. One should survive. |
| donate-api | stripe-donate, p31-donation-relay | Three donation Workers. donate-api is active (19 req). Others are stale (0 req, 31d ago). |
| p31-kofi-webhook | p31-kofi-telemetry | Main webhook is active (388 req). Telemetry variant has 0 requests. |

Deleting stale Workers reduces attack surface and confusion for future agents.

---

## PARKING LOT

| # | Item | Disposition |
|---|------|-------------|
| 1 | Yjs CRDT real-time collaboration in EDE | Future — stub exists |
| 2 | Monaco/CodeMirror editor upgrade | Future — textarea works |
| 3 | Genesis Gate deployed as standalone CF Worker (vs package) | Evaluate during R07 |
| 4 | Privacy-respecting analytics (Plausible/Fathom) | Telemetry dashboard may replace this need |
| 5 | Rate limiting on telemetry endpoint | Add after R07 if abuse detected |
| 6 | User authentication (session tokens for KV state) | R12 uses anonymous sessions initially |
| 7 | BONDING test count reconciliation (413 vs 488 vs 558) | Verify once and lock in CogPass |

---

## SUCCESS CRITERIA

- [ ] All 34 vectors load without console errors
- [ ] All standalone apps: persistent state, offline-capable, mobile-responsive
- [ ] EDE production-hardened (memory, disclosure cycle, export/import, performance)
- [ ] All 22 Workers documented in inventory
- [ ] Stale Workers identified and deleted
- [ ] All active Workers have `/health` endpoints
- [ ] Health dashboard live at p31ca.org/health
- [ ] Genesis Gate receives events from all apps and active Workers
- [ ] Telemetry dashboard live at p31ca.org/telemetry
- [ ] Deep links work between all major apps
- [ ] Shared spoon state flows between EDE, Larmor, and Hub
- [ ] Zero dead links across entire ecosystem

---

**FINAL OPERATOR SIGNOFF: _____________ (Will) Date: _______**

---

When R12 closes, the EDE knows your spoons, Larmor knows when to breathe for you, and the hub shows your cognitive tier — all from a single KV-backed state that follows you across the ecosystem.

---

*Resonance is what happens when every component vibrates at the same frequency.*  
*22 Workers. 34 vectors. 2 websites. 3 Zenodo papers.*  
*They were built in a sprint. Now they learn to breathe together.*  
*The telemetry mesh is the nervous system of the calcium cage.*  
*Every event is a signal. Every signal is a measurement.*  
*When the system can observe itself, it can heal itself.*  
*That's autopoiesis. That's the Posner molecule. That's P31.*
