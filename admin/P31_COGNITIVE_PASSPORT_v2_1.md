# P31 COGNITIVE PASSPORT — v2.1
## Last Updated: 2026-03-03 (T-7 — Spaceship Earth LIVE)

---

## 1. THE OPERATOR

**Name:** William Rodger Johnson (Will)
**DOB:** August 12, 1985 (age 40)
**Location:** 401 Powder Horn Road, Saint Marys, GA 31558
**Email:** will@p31ca.org | will@phosphorus31.org
**Legacy email:** classicwilly@wonkysprout.com (forwarding only)
**Personal email:** willyj1587@gmail.com
**Phone:** (912) 227-4980

### Diagnoses
- **AuDHD** (Autism + ADHD) — diagnosed 2025, age 39-40
- **Hypoparathyroidism** — since 2003, following a seizure (calcium regulation disorder; wife was aware throughout relationship)

### Cognitive Profile
- High-bandwidth thinker. Sees systems, isomorphisms, and connections across domains instantly.
- **Output bottleneck:** Cannot reliably compile internal state into real-time verbal speech. The thoughts are correct — the serialization layer drops packets.
- Writing (by hand, iPad) is the highest-fidelity capture method. Typing disrupts flow. Speech is lossy.
- With the right context, the operator produces genius-level synthesis. Without context, the same ideas sound like conspiracy theories or hallucination. **Context is the cryptographic key.**
- Processes information geometrically (Buckminster Fuller, tetrahedra, tensegrity) rather than linearly.
- Fawn response under social pressure — authenticity collapses to match external expectations (psychological decoherence).
- Executive dysfunction is the primary daily challenge. When it hits, decision-making freezes. The system's job is to eliminate decisions during those moments.
- **Impulse management:** Neurodivergence drives urges to fix small things immediately. Mitigated by parking lot pattern — capture the impulse in writing, don't act on it, triage later. Knowing where something lives in the build plan lets the brain release it.

### Communication Style
- Direct. No corporate pleasantries.
- Thinks in metaphors drawn from: electrical engineering (grounding, floating neutrals, delta/wye topology), quantum mechanics (decoherence, measurement, entanglement), and geometry (Fuller's synergetics, IVM, jitterbug transformation).
- **NEVER use submarine, naval, or military metaphors.** Will was a DoD CIVILIAN engineer, not military. His estranged wife's father was Navy — it's a trigger in the legal context.
- Curses when emphasis is needed. It's punctuation, not aggression.

### Professional Background
- 16 years as a DoD civilian submarine electrician
- **Position:** Engineering Technician (Electrical), GS-0802-12
- **Activity:** TRIDENT Refit Facility (TRIREFFAC), Kings Bay, GA
- **Official separation date:** Approximately September 30, 2025
- **Supervisor:** Robby Allen (signed SF 3112B)
- **Expertise:** Motor maintenance, safety-critical electrical systems, fault tolerance, SUBSAFE principles, 57B certification
- Currently: Founder/CEO of P31 Labs (nonprofit)

---

## 2. THE FAMILY

| Person | DOB | Notes |
|--------|-----|-------|
| **Sebastian "Bash" Johnson** | 3/10/2016 | Son. Turning 10 on March 10, 2026. BONDING ships on his birthday. |
| **Willow Marie Johnson** | 8/8/2019 | Daughter, age 6. Has encopresis. Pre-reader — needs big visual feedback, fast wins. |
| **Christyn Elizabeth Johnson** (née Francis) | 3/14/1987 | Estranged wife. Active family court proceedings. |

**Custody status:** Will has not seen his children in 29+ days (as of March 3, 2026). BONDING is designed to bridge this distance — remote multiplayer so Dad can play alongside both kids from separate devices. Every atom placed is a timestamped parental engagement log. Every ping is documented contact. The game is a bridge, not a toy.

**Target devices:** 2× Android tablets (one per child) + Will's device. Touch input. All features must work on Android Chrome.

---

## 3. P31 LABS — THE ENTITY

**Full name:** P31 Labs
**Type:** Georgia 501(c)(3) nonprofit
**Mission:** Open-source assistive technology for neurodivergent individuals
**Fiscal sponsor:** HCB (applied 2/18/26, ref 4XDUXX, status pending)
**GitHub:** github.com/p31labs
**Domain:** p31.io (root brand), phosphorus31.org (public site), p31ca.org (Spaceship Earth — LIVE), bonding.p31ca.org (BONDING standalone — LIVE)

### The Metaphor (This Is Not Decoration — It's Architecture)
- **Phosphorus (P-31):** The operator. Unstable, reactive, essential for life. Phosphorus alone burns.
- **Calcium cage (P31 Labs):** The Posner molecule — Ca₉(PO₄)₆ — protects phosphorus at all angles. The organization insulates the operator from entropy.
- **Larmor frequency:** 863 Hz — the canonical resonance of ³¹P in Earth's magnetic field. This is the system's heartbeat.
- **L.O.V.E.:** Ledger of Ontological Volume and Entropy. The token economy. Soulbound (can't be bought, sold, or transferred). Earned through care, creation, and consistency. Spoons are spent; LOVE is earned. Dual-currency cognitive economy.

### Products

| Product | Type | Status | Description |
|---------|------|--------|-------------|
| **Node One (The Totem)** | Hardware | Prototype | ESP32-S3 palm device. Haptic feedback (DRV2605L + LRA), LoRa mesh, hardware security module (NXP SE050). |
| **The Buffer** | Software | ~85% | Communication processing. Fawn Guard detects people-pleasing patterns. Chaos ingestion converts journal → structured data. |
| **Spaceship Earth** | Software | **DEPLOYED at p31ca.org** | The Soup shell — 4-room navigation (BONDING, Observatory, Bridge, Buffer). 3D Jitterbug Navigator (8 vertices). CockpitHUD with SpoonGauge. System-wide LOVE economy. Cross-origin postMessage sync. |
| **BONDING** | Game | **DEPLOYED at bonding.p31ca.org** | Molecule builder. Multiplayer live. Difficulty modes (Seed/Sprout/Sapling). Touch hardened. See §4 for full status. |
| **Whale Channel** | Comms | Planned | Low-frequency, high-context communication channel for deep connections. |
| **Thick Click** | Hardware/UX | Concept | Kailh Choc Navy switches (60gf) — proprioceptive feedback as medical necessity for dissociation/anxiety. |
| **Ping** | Protocol | In BONDING | Reaction system. 💚🤔😂🔺. One ping = one documented connection. Max 3 per molecule. Every ping = LOVE for both sender and receiver. |
| **The Centaur** | Protocol | Active | Human-AI collaboration model. Will (biological intent) + AI stack (silicon execution) = Homo syntheticus. |

### Tech Stack
- **Frontend:** React + TypeScript + Vite + Three.js (@react-three/fiber + drei) + Tailwind + Zustand
- **Backend:** Cloudflare Workers + KV (BONDING relay + telemetry + Spaceship Earth telemetry); FastAPI + PostgreSQL + Redis (planned for Buffer)
- **Workspace:** npm workspaces at `software/` — `bonding/`, `spaceship-earth/`, `packages/shared/`, `extensions/*`
- **Shared packages:** `@p31/shared` — promoted Genesis Block modules (eventBus, economyStore, telemetryStore) + system-wide event types
- **Hardware:** ESP32-S3 + DRV2605L + LoRa SX1262 + NXP SE050
- **Firmware:** C/C++ (ESP-IDF), LVGL UI, Opus codec, OTA A/B partitions
- **State sync:** Cloudflare KV polling (BONDING multiplayer); postMessage bridge (BONDING iframe → Spaceship Earth LOVE sync)
- **Persistence:** IndexedDB via idb-keyval (LOVE economy + telemetry backstop); navigator.storage.persist() for eviction defense
- **Cryptography:** Browser-native crypto.subtle SHA-256 (client) + Cloudflare Workers crypto.subtle (server-side countersignature)
- **Testing:** Vitest + jsdom + @vitest/coverage-v8 — **488 tests, all green**
- **Repo structure:** npm workspace at `software/` — `bonding/` (standalone game), `spaceship-earth/` (Soup shell), `packages/shared/` (@p31/shared), `extensions/` (VS Code extensions incl. relocated p31ca). Legacy: `pwa/` (original Buffer, BondingView) and `apps/web/` (IVM, wallet, onboarding)
- **ESLint:** v10 flat config

### Hardware
- **Dev machine:** Acer Chromebook Spin 713 (MrChromebox Linux conversion evaluated, currently ChromeOS 145 beta)
- **Desktop (heavy compute):** AMD RX 6600 XT + Intel i3-12100 (Ollama local inference capable with ROCm HSA_OVERRIDE_GFX_VERSION=10.3.0)

### The Triad of Cognition (AI Tag-Out System)

| Agent | Role | Allocation | Tagged IN | Tagged OUT |
|-------|------|-----------|-----------|------------|
| **Sonnet (CC)** | Mechanic | 80% | UI, React, Python, debugging, WCD execution | Architecture, firmware |
| **Gemini** | Narrator | 15% | Grants, narrative, HAAT framing, technical specs, research synthesis | Code implementation (uses [V: claim, source] markers) |
| **DeepSeek** | Firmware | 4% | ESP32 C/C++, hardware registers | UI, architecture |
| **Opus** | Architect | 1% | QA, architecture verification, test suites, WCD authoring/closeout, risk audits | Minor coding tasks |

**Proven pattern (Feb 27–Mar 3):** Gemini wrote the Affective Chemistry technical spec. Opus wrote the test suite (109 → 484 tests), authored WCD-MERGE (10 architecture wcds + 3 ship wcds), and caught the `software/package.json` VS Code extension conflict before it broke the workspace. Sonnet executed M01–M13 in a single session — caught `workspace:*` npm syntax mismatch, `const enum` cross-boundary issue, missing shared deps (idb-keyval, zustand), and tsconfig references requiring composite. Each agent in their lane, each catching what the others missed. The Triad works.

**Failure modes documented in SOULSAFE v1.0:**
- Gemini: "The Chaplain" — refuses task, redirects to wellness advice, under-intervenes (accelerant)
- Opus: Over-intervention — can break flow with excessive QA
- Sonnet: Hallucination during patch application — mitigated by pre-patched code delivery

---

## 4. BONDING — DETAILED STATUS

### What Is Deployed (bonding.p31ca.org)

```
Day 1    ██████████  Core builder, palette, drag-and-drop
Day 2    ██████████  Living atoms (MeshDistortMaterial), VSEPR ghosts, bloom, stability
Day 3    ██████████  Achievements (12), LOVE economy, sound (Web Audio), toasts
Day 4    ██████████  Checkpoint system, carbon fix, atom sizes, Rock Solid (CaO)
WCD-05   ██████████  Formula mismatch fix (11 entries), HCl display name
CWP-03B  ██████████  THE GENESIS BLOCK — Rev B deployed (see §4a)
WCD-07   ██████████  Jitterbug Navigator (3D→2D SVG, cuboctahedron→tetrahedron)
WCD-41   ██████████  Stress test: 488 tests, 500 concurrent events, zero packet loss
WCD-08   ██████████  The Cockpit — executed and deployed
Mar 2-3  ██████████  MolecularWarp field, warp easter egg, ElementPalette emissive, Jitterbug organic
M01-M10  ██████████  Spaceship Earth built — workspace, @p31/shared, Jitterbug 3D, LOVE economy, Soup shell
M11      ██████████  Touch hardening (viewport lock, touch-action:none, 48px targets, overscroll kill)
M12      ██████████  postMessage LOVE handshake (useEconomyStore.subscribe → parent frame)
M13      ██████████  Production domains: p31ca.org + bonding.p31ca.org (SSL active)
```

### 4a. THE GENESIS BLOCK (CWP-03 Rev B) — LIVE

Court-grade telemetry and L.O.V.E. economy engine. All four Opus-audited patches applied:

| Patch | Threat | Defense |
|-------|--------|---------|
| PATCH 1 | Chrome evicts localStorage, destroying hash chain | IndexedDB via idb-keyval + navigator.storage.persist() + custom merge function |
| PATCH 2 | KV shared index loses sessions during concurrent writes | Per-session unique keys + KV.list() for discovery — zero write contention |
| PATCH 3 | sendBeacon drops 5-15% of mobile sessions on exit | 30s incremental flush + IDB backstop on visibilitychange/freeze + orphan recovery |
| PATCH 4 | Client-side SHA-256 vulnerable to Daubert challenge | Server-side independent hash + serverVerified flag + forensic metadata (cf-ray, TLS, UA) |

**Architecture:** eventBus.ts (typed pub/sub) → economyStore.ts (L.O.V.E. ledger, IndexedDB-persisted) + telemetryStore.ts (Exhibit A, 30s flush) → worker-telemetry.ts (6 Cloudflare endpoints, server SHA-256) → genesis.ts (async bootstrap, persist(), orphan recovery, postMessage broadcast to parent). Genesis modules promoted to @p31/shared in M02 — BONDING re-exports from shared

**Relay:** https://bonding-relay.trimtab-signal.workers.dev (14 routes: telemetry, sessions, LOVE read, bug reports, multiplayer)

**Legal basis (Georgia):**
- O.C.G.A. § 24-9-901(b)(9): Authentication via process/system description
- O.C.G.A. § 24-9-902(11): Self-authentication via custodian certification
- O.C.G.A. § 24-8-803(6): Business records hearsay exception
- O.C.G.A. § 24-7-702: Daubert standard (server-side countersignature neutralizes tamperability claim)

### 4b. SPACESHIP EARTH — DEPLOYED at p31ca.org

The Soup shell — 4-room navigation system embedding BONDING and P31 products:

| Room | Component | Status |
|------|-----------|--------|
| **BONDING** | iframe (bonding.p31ca.org) — origin-isolated, Genesis Block untouched | ✅ LIVE |
| **Observatory** | 3D Jitterbug Navigator (8 vertices, cuboctahedron↔tetrahedron morph, smoothstep) | ✅ LIVE |
| **Bridge** | LOVE wallet — real-time sync via postMessage + KV polling fallback | ✅ LIVE |
| **Buffer** | Placeholder — AI buffer agent integration future | Placeholder |

**CockpitHUD:** Glassmorphism SpoonGauge (🥄 spoons deplete, 💜 LOVE accumulates). Hidden in BONDING room (BONDING has its own HUD).

**LOVE economy system-wide:** 9 source types with LOVE_VALUES table in @p31/shared: molecule_complete (10), ping_sent (5), ping_received (5), buffer_processed (3), fawn_guard_ack (10), calcium_logged (15), wcd_complete (25), meditation_session (20), quest_complete (50).

**Telemetry:** Separate Cloudflare Worker at spaceship-relay.trimtab-signal.workers.dev. SHA-256 chain on all writes. KV namespace SPACESHIP_TELEMETRY (independent from BONDING_TELEMETRY).

**Cross-origin LOVE sync (M12):** BONDING broadcasts P31_BONDING_STATE via postMessage on every LOVE change (useEconomyStore.subscribe on totalLove). Spaceship Earth validates origin, extracts sessionId, polls GET /love/:sessionId every 10s as backup. Math.max(postMessage, polledValue) displayed.

### What Remains for March 10

| Track | Status |
|-------|--------|
| Multiplayer | ✅ LIVE — room codes, PING sync, player cards |
| Difficulty Modes | ✅ LIVE — Seed 🌱 (H+O), Sprout 🌿 (H+C+N+O), Sapling 🌳 (full palette) |
| Touch Hardening | ✅ DONE (M11) — viewport lock, touch-action, 48px targets |
| Production Domains | ✅ DONE (M13) — p31ca.org + www.p31ca.org + bonding.p31ca.org |
| LOVE Sync | ✅ DONE (M12) — postMessage + KV polling |
| Tyler Stress Test | 🟡 PENDING |
| Android Tablet QA | 🟡 PENDING |
| Quest Chains | ⚪ STRETCH |

### Architecture Decisions

**Multiplayer is NOT co-editing.** Each player builds independently in a shared room. The relay is a bulletin board — broadcasts formula, LOVE, completion status. No conflict resolution, no CRDT, no merge logic.

**Difficulty modes are palette restriction + target filtering.** One codebase, one game loop. The mode controls which elements appear and which achievements are visible.

**The Cockpit (WCD-08) z-index contract:**
```
Layer  z-index   Owner                   pointer-events
─────  ────────  ──────────────────────  ──────────────
  0       0      <body> void (#050505)   none
  1       1      R3F <Canvas> (full)     auto
  2      10      HUD Container (grid)    none (passthrough)
  3      11      HUD Panels (glass)      auto (per-panel)
  4      50      Achievement Toast       none
  5      60      Modal / Overlay         auto
```

### Build Timeline (March 1→10)

```
Mar 1    ✅ WCD-08A authored (Cockpit). CWP-03B locked.
Mar 2    ✅ WCD-08A executed. MolecularWarp field. Warp easter egg. 488 tests.
Mar 3    ✅ M01–M13 executed in one session. Spaceship Earth built and deployed.
            Workspace, @p31/shared, Jitterbug 3D, LOVE economy, Soup shell,
            iframe BONDING, touch hardening, postMessage handshake, production domains.
            488 tests green throughout. 8 commits pushed. All domains SSL active.
Mar 4-5  Tyler stress test. Android tablet QA. Quest chains (stretch).
Mar 6-7  Polish: sounds, colors, toast sizing, final run.
Mar 8-9  Final QA. Backup buffer.
Mar 10   🎂 Ship. Bash's 10th birthday. Genesis Block fires.
```

### BONDING Molecule Catalog

40+ molecules from Will's biochemistry mapped to game targets. Full catalog created from molecular portrait (Feb 28). Includes neurotransmitter synthesis quest chains (catecholamine pathway: Tyrosine → L-DOPA → Dopamine → Norepinephrine; serotonin pathway: Tryptophan → 5-HTP → Serotonin). Posner molecule Ca₉(PO₄)₆ at 39 atoms is the endgame build.

### The Vision Beyond March 10

Planned features (none blocking birthday ship):

- **Molecule soundtracks:** Each element is a chromatic note. A molecule is a chord.
- **Breathing room:** Atoms pulse 4-4-6. Kid on their tablet can SEE Dad's atoms pulsing.
- **Calcium logging:** Log meds → molecule brightens. Miss a dose → dims.
- **Module Maker:** Players create custom reaction rules. The game becomes a research tool.
- **LoRa transport:** Meshtastic on Node One hardware. Messages hop the mesh. No internet needed.
- **Spoon depletion wiring:** Currently static 12/20 — wire to real cognitive load data.
- **Buffer room:** AI buffer agent integration in the Soup shell.
- **Module import migration:** Replace iframe with direct React module import when origin isolation is no longer legally required.

---

## 5. ACTIVE WORKSTREAMS

### ✅ BONDING Birthday Ship (March 10, 2026)
T-7 days. **Code-complete.** Spaceship Earth at p31ca.org. BONDING at bonding.p31ca.org. Multiplayer live. Difficulty modes live. Touch hardened. Production domains active. Genesis Block firing. LOVE syncing cross-origin. Remaining: Tyler stress test, Android tablet QA, quest chains (stretch).

### 🟡 LEGAL — Family Court
- Case continued to **March 12, 2026** (Chief Judge Scarlett)
- Judge Green recusal pending — Feb 5 order unsigned
- Key evidence: Messenger Kids logs (children initiated all contact), TSP withdrawal timeline ($70,793.85 gross, Oct 2025), neither attorney converted to RBCO
- Second Supplemental Brief prepared but held due to continuance
- McGhan filed despite knowing East was terminated
- Oct 23, 2025 order signed by East three days after TSP withdrawal — Will never signed anything
- **Will has not seen children in 29+ days.** BONDING is how he meets them where they are.
- **Legal evidence package created:** Exhibit A system description (8th grade reading level), GAL briefing memo, NGSS educational alignment doc, engagement report template
- **Genesis Block Daubert defense:** Server-side SHA-256 countersignature, per-session unique KV keys, forensic metadata (cf-ray, TLS version, user agent), Georgia statutes § 24-9-901/902, § 24-8-803, § 24-7-702
- **March 12 hearing package prepared:** Tactical gameplan, Response to Contempt (Docket 74), Response to Vexatious Litigant (Docket 69), ADA Accommodation Request (Brenda O'Dell as support person), courtroom briefing document

### 🟡 FERS Disability Retirement
- **Official separation:** ~September 30, 2025 from TRIREFFAC Kings Bay, GA
- **Filing deadline:** ~September 30, 2026 (5 CFR § 844.201)
- **Contact:** Eric Violette (OCHR Norfolk, 202-913-3720) responded Feb 25
- **Navy Civilian Benefits Center:** 1-888-320-2917 / navybenefits@us.navy.mil (email sent Feb 22)
- **Forms completed:** SF 3112A (with medical nexus attachment), SF 3112B (Robby Allen signed), SF 3112C (psychiatrist)
- **Forms needed from agency:** SF 3112D, SF 3112E
- **Forms needed from Will:** SF 3107 (Application for Immediate Retirement)
- **Escalation:** OCHR Stennis (Amber Antoine) couldn't help — directed to HRO. HRO unknown. Navy Benefits Center is the path.
- **Nuclear option:** File directly to OPM Boyers PA without 3112D/E; OPM requests from agency under BAL 20-103
- **Mail to:** U.S. Office of Personnel Management, Retirement Operations Center, P.O. Box 45, Boyers, PA 16017-0045

### 🟢 SSA Disability
- Both exams complete (Feb 20 telehealth psych, Feb 26 in-person medical/physical/ROM)
- Positive results reported from both
- Awaiting determination. Ball in SSA's court.

### 🟢 P31 Infrastructure
- HCB fiscal sponsorship pending (ref 4XDUXX)
- **p31ca.org** — Spaceship Earth (Cloudflare Pages, SSL active)
- **bonding.p31ca.org** — BONDING (Cloudflare Pages, SSL active)
- **www.p31ca.org** — redirect (Cloudflare Pages, SSL active)
- **phosphorus31.org** — live at phosphorus31-org.pages.dev
- **bonding-relay.trimtab-signal.workers.dev** — 14-route relay
- **spaceship-relay.trimtab-signal.workers.dev** — 3-route Spaceship Earth telemetry
- Regulatory: Node One = FDA Class II exempt (21 CFR §890.3710); Buffer = non-device CDS under 21st Century Cures Act
- P31 Master Doctrine JFMM synthesized (200+ pages)
- SOULSAFE v1.0 written
- WCD template suite established (WCD-01 through WCD-06 types)
- 6 professional document templates created (Grant, Research Paper, Defensive Publication, Executive Brief, Technical Spec, Letterhead)
- Defensive publication uploaded to Internet Archive (Feb 25, 2026 timestamp)
- 289 atomic building blocks taxonomy created for tetrahedral file structure
- Ollama local agent army researched (Qwen 2.5 Coder 7B + Qwen3 8B for AMD RX 6600 XT)

---

## 6. FINANCIAL SNAPSHOT

- Currently on SNAP/Medicaid
- Children covered by Medicaid
- GEICO joint auto policy reinstated 02/12/26 ($298.27)
- Vehicles: 2010 VW Golf (Will), 2011 Mazda CX-7 (Christyn)
- TSP hardship withdrawal: $70,793.85 gross, $14,158.37 federal withheld, $7,079.39 penalty (Code 1), initiated ~Sep 12, 2025
- IRS W-2 shows $74,627.59
- **FERS disability annuity (if approved):** Year 1: 60% of high-3 minus SSDI; Year 2+: 40% of high-3 minus 60% SSDI

---

## 7. CORE CONCEPTS (The Operator's Dialect)

These are not metaphors. They are the operator's native conceptual framework.

| Term | Meaning |
|------|---------|
| **Delta topology** | Mesh/rigid network. Resilient. P31 target architecture. |
| **Wye topology** | Centralized/fragile star network. Legacy. What we're replacing. |
| **Ground the floating neutral** | Triangulate truth, code, and law. Don't rely on external validation. |
| **Decoherence** | Loss of authentic internal state under external pressure. The fawn response. |
| **Spoons** | Cognitive/physical energy units (spent). From spoon theory. |
| **LOVE** | Regulation credits (earned). System-wide across all P31 products. 9 source types with LOVE_VALUES table in @p31/shared. |
| **SOULSAFE** | SUBSAFE principles applied to cognitive systems. OQE + WCD. |
| **OQE** | Objective Quality Evidence. Proof it works. |
| **WCD** | Work Control Document. Authorization to modify critical systems. |
| **Tag-out** | Lockout/tagout for AI agents. Stay in your lane. |
| **Jitterbug transformation** | Fuller's VE → Tetrahedron. Now a 3D Three.js component in Observatory with 8 cognitive vertices and smoothstep morph. |
| **IVM** | Isotropic Vector Matrix. Fuller's coordinate system. How the operator thinks about space. |
| **Posner molecule** | Ca₉(PO₄)₆. The calcium cage that protects phosphorus. P31 Labs protecting the operator. |
| **Fisher-Escolà Q-Factor** | Cognitive coherence. 8 vertices: Energy, Tasks, Environment, Creation, BONDING, Communication, Legal, Health. |
| **The Centaur** | Human + AI > either alone. The operational model. |
| **Hill system** | Formula ordering convention used internally by BONDING chemistry engine. C first, H second, then alphabetical. Display layer translates to conventional notation. |
| **Parking lot** | Impulse capture file. One line per idea. No editing, no prioritizing, just capture. Triaged at phase gates. |
| **The Soup** | **LIVE at p31ca.org.** 4 rooms: BONDING (iframe), Observatory (Jitterbug 3D), Bridge (LOVE wallet), Buffer (placeholder). Room navigation via bottom glassmorphism nav. |
| **The Cockpit** | WCD-08 spatial doctrine. R3F canvas fills viewport; glassmorphism HUD panels tile the perimeter. Nothing crosses the glass. |
| **Genesis Block** | CWP-03 Rev B. The cryptographic, court-admissible, server-verified telemetry engine. **LIVE.** |
| **The Chaplain** | Gemini failure mode: refuses task, redirects to wellness advice instead of executing. |
| **Quantum Brain Dump** | Workflow: Google Keep capture → Google Docs organization (Gemini) → Deep Research synthesis with citations. |
| **MolecularWarp** | Chemistry-native particle field. 200 LineSegment particles colored by element emissive values. Replaced generic drei Stars everywhere. Idle drift; warp speed on double-tap. |
| **Double-tap warp** | Easter egg. Double-tap empty canvas within 400ms → warp speed effect (element-colored streaks + ascending frequency sweep). WMP DNA in a chem game. |
| **@p31/shared** | npm workspace package. Promoted Genesis modules + system-wide event types. Cross-product source of truth. |

---

## 8. DAILY SCHEDULE (The Buffer Schedule)

| Block | Time | Task |
|-------|------|------|
| Morning Flow | 7:00–8:30 | Handwrite on iPad. Brain dump. Music: Einaudi, Daniel Jang, French Fuse. |
| Process | 8:30–9:30 | OCR → AI processing. Brain dump → action items. Quantum Brain Dump workflow. |
| Deep Work 1 | 9:30–12:00 | Priority #1 deliverable |
| Midday Reset | 12:00–1:00 | Lunch. House. Movement. |
| Admin Block | 1:00–2:30 | Legal, FERS, emails, filings |
| Deep Work 2 | 2:30–4:30 | Secondary priority |
| Kids Block | 4:30–7:00 | Bash and Willow. Present. Off-system. (When custody allows.) |
| Evening Review | 8:00–9:00 | Update context file. Stage tomorrow. |

---

## 9. OUTPUT PREFERENCES

- No fluff. No "As an AI" disclaimers.
- Action over explanation. Code, diffs, terminal commands.
- If it works, it ships.
- Don't scope conservatively when the designs already exist. Execute the plan.
- When exec dysfunction hits: don't ask what to do. Tell me what tool to pick up and what task to do with it.
- Casualty control: If operator is thrashing (tool-task mismatch), halt and ask ONE question: "What tool are you holding and what task are you doing right now?"
- **Don't plan for "post-birthday."** Plan for it and it'll happen. Everything goes in. We have time.
- **Pre-patched code over patch descriptions.** When handing files to Sonnet, bake the fixes into the TypeScript. Don't describe patches — implement them. Eliminates mechanic hallucination risk.
- **wcds are formal execution directives.** Include: file manifest, wiring guide, verification checklist, "what you must NOT touch" section.

---

## 10. KEY PEOPLE

| Person | Role | Contact / Notes |
|--------|------|-----------------|
| **Brenda O'Dell** | Will's mother | brendaodell54@gmail.com. ADA support person for March 12 hearing. |
| **Tyler** | Beta tester | Tailscale mesh. BONDING multiplayer stress test partner. Family: Ashley, Link, Judah. |
| **Robby Allen** | Former supervisor | Signed SF 3112B (FERS disability) |
| **Eric Violette** | OCHR Norfolk | 202-913-3720. Responded Feb 25 re: FERS forms. |
| **Amber Antoine** | OCHR Stennis | Handled separation processing. Cannot help with benefits (wrong office). |
| **Chief Judge Scarlett** | Family court | Continued case to March 12, 2026. |
| **Judge Green** | Family court | Pending recusal. Feb 5 order unsigned. |
| **McGhan** | Opposing counsel | Filed despite knowing East was terminated. |
| **East** | Former attorney | Terminated. Signed Oct 23, 2025 order three days post-TSP withdrawal. |
| **Hunter McFeron** | Georgia Tools for Life | hunter.mcferon@gatfl.gatech.edu — AT Lending Library contact |

---

## 11. KEY INFLUENCES

- **Buckminster Fuller** — Synergetics, geodesic geometry, "do more with less." (Note: Fuller was hard for even experts to understand. His ideas operated on ~50-year timelines.)
- **Matthew Fisher** — Quantum cognition theory, Posner molecules. Hypothesis is experimentally tractable, not validated.
- **Chess centaur concept** — Human + machine > either alone
- **Naval nuclear SUBSAFE** — Safety-critical procedure applied to cognitive systems
- **Spoon theory** — Christine Miserandino's disability energy framework

---

## 12. WCD HISTORY (Executed)

| WCD | Date | Scope | Status |
|-----|------|-------|--------|
| WCD-01 — WCD-03 | Feb 25-26 | Days 1-3 core build (builder, palette, drag, atoms, VSEPR, bloom, achievements, sound) | ✅ Complete |
| WCD-04A | Feb 27 | Day 4 bug fixes + checkpoint system | ✅ Complete |
| WCD-05 | Feb 27 | Formula mismatch (11 entries) + test suite (109 tests) | ✅ Complete |
| CWP-03 Rev A | Feb 28 | Genesis Block v1 (eventBus, economyStore, telemetryStore, worker-telemetry, genesis) | ⚠️ Superseded |
| CWP-03 Rev B | Mar 1 | Genesis Block v2 — 4 Opus-audited patches (IndexedDB, KV race fix, 30s flush, server SHA-256) | ✅ Deployed |
| WCD-07 | Feb 28 | Jitterbug Navigator (SVG, cuboctahedron→tetrahedron based on spoons) | ✅ Complete |
| WCD-08 Phase A | Mar 1 | The Cockpit — Spatial Doctrine, glassmorphism HUD, z-index contract (6 components + config) | ✅ Executed and deployed |
| WCD-41 | Mar 1 | Stress test: 488 tests, 500 concurrent events, zero packet loss | ✅ Passed |
| Mar 2-3 Visual | Mar 2-3 | MolecularWarp, double-tap warp, CSS fixes, ElementPalette emissive, Jitterbug organic | ✅ Deployed |
| **WCD-M01** | **Mar 3** | Workspace scaffolding — npm workspaces, @p31/shared stub, SE scaffold, extension relocation | ✅ |
| **WCD-M02** | **Mar 3** | Promote Genesis Block to @p31/shared — re-exports, const enum→enum, shared deps | ✅ |
| **WCD-M03** | **Mar 3** | System-wide event types (6 new, additive) | ✅ |
| **WCD-M04** | **Mar 3** | Jitterbug 3D Navigator — 8 vertices, cubocta↔tetra morph, smoothstep | ✅ |
| **WCD-M05** | **Mar 3** | LOVE economy system-wide — 9 sources, SpoonGauge, CockpitHUD | ✅ |
| **WCD-M06** | **Mar 3** | The Soup shell — 4-room nav, BONDING iframe (origin-isolated) | ✅ |
| **WCD-M07** | **Mar 3** | Deploy Spaceship Earth to Cloudflare Pages | ✅ Deployed |
| **WCD-M08** | **Mar 3** | Cross-origin LOVE sync — GET /love/:sessionId, KV polling | ✅ Deployed |
| **WCD-M09** | **Mar 3** | Spaceship Earth telemetry Worker — separate KV, SHA-256 | ✅ Deployed |
| **WCD-M10** | **Mar 3** | Final verification — all checks green | ✅ Passed |
| **WCD-M11** | **Mar 3** | Touch hardening — SE shell (viewport, touch-action, 48px targets) | ✅ |
| **WCD-M12** | **Mar 3** | postMessage LOVE handshake — real-time BONDING→SE sync | ✅ |
| **WCD-M13** | **Mar 3** | Production domains — p31ca.org + bonding.p31ca.org (SSL active) | ✅ |

---

## 13. infrastructure MAP (Current)

```
p31ca.org  (Cloudflare Pages: p31ca, SSL active)
  └── Spaceship Earth v1
        ├── Observatory  → Jitterbug Navigator (3D, 8 vertices)
        ├── BONDING      → iframe → bonding.p31ca.org
        ├── Bridge       → LOVE wallet (postMessage + KV poll)
        └── Buffer       → placeholder

bonding.p31ca.org  (Cloudflare Pages: bonding, SSL active)
  └── BONDING game (standalone, origin-isolated)
        └── Genesis Block → bonding-relay.trimtab-signal.workers.dev
              └── BONDING_TELEMETRY KV (7-day flush, 1-year seal)

bonding-relay.trimtab-signal.workers.dev  (14 routes)
  ├── Telemetry chain (POST /telemetry, /seal, /orphan)
  ├── Session queries (GET /telemetry/*)
  ├── LOVE read       (GET /love/:sessionId)
  ├── Bug reports     (POST/GET /bug-report*)
  └── Multiplayer     (POST/PUT/GET /api/room/*)

spaceship-relay.trimtab-signal.workers.dev  (3 routes)
  └── SPACESHIP_TELEMETRY KV
        ├── POST /session/start
        ├── POST /session/heartbeat
        └── POST /session/end

phosphorus31.org  (Cloudflare Pages: phosphorus31-org)
  └── Institutional / legal / Daubert-ready static site
```

---

*This document is the operator's cognitive passport. Attach it to any AI interaction for instant context. Without it, words are nothing. With it, a small model becomes extremely powerful.*

*"With the right context I'm an absolute genius. With the wrong context I'm a hallucinating conspiracy theorist."*

*— P31 Cognitive Passport v2.1*
*— March 3, 2026*
*— 🔺*
