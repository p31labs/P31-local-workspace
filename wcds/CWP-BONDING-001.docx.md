

**P31 LABS**

**CONTROLLED WORK PACKAGE**

CWP-BONDING-001

BONDING: Final Ship \+ Security Hardening

| Document ID: | CWP-BONDING-001 |
| ----: | :---- |
| **Classification:** | SOULSAFE – OQE Required |
| **Issue Date:** | March 8, 2026 |
| **Ship Deadline:** | March 10, 2026 (Bash’s 10th Birthday) |
| **Work Leader:** | Will Johnson (Operator) |
| **Supervisor/QA:** | Opus (Architect) |
| **Primary Mechanic:** | Sonnet/CC (80%) |
| **Predecessor:** | WCD-01 through WCD-M13 (ALL CLOSED) |
| **Scope:** | Close M14–M16, Android QA, Ship |

# **1\. Condition Found (Ship Check – As-Is)**

BONDING is in final sprint. The core game is functional, tested, and deployed as a PWA at bonding.p31ca.org. 328 tests are green across 21 suites. The bundle is optimized (three.js 688KB, r3f 500KB, app 223KB). wcds 01 through M13 and CC01 through CC03 are all closed. Three wcds remain open.

## **1.1 WCD Status Matrix**

| WCD | Scope | Status | Tests | Notes |
| :---- | :---- | :---- | :---- | :---- |
| WCD-01–03 | Days 1–3 core build | **CLOSED** | Covered | Palette, drag-drop, living atoms |
| WCD-04A | Day 4 bugs \+ checkpoint | **CLOSED** | Covered | Carbon fix, atom sizes, Rock Solid |
| WCD-05 | Formula mismatch \+ test suite | **CLOSED** | 109 tests | CC found more damage than scoped |
| CC-01–03 | Course corrections | **CLOSED** | Covered | Bug fixes, stability |
| WCD-M01–M13 | March sprint milestones | **CLOSED** | 328 total | Difficulty modes, touch, displayFormula |
| WCD-M14 | Multiplayer relay | **OPEN** | Pending | CF Worker \+ KV. Bulletin-board architecture. |
| WCD-M15 | Android tablet QA | **OPEN** | Pending | 2× physical tablets. Touch hardening verification. |
| WCD-M16 | Quest chains | **OPEN** | Pending | Genesis (Seed), Kitchen (Sprout), Posner (Sapling) |

## **1.2 Enumerated Faults**

| Fault ID | Severity | Description | Impact |
| :---- | :---- | :---- | :---- |
| BND-001 | **CRITICAL** | Multiplayer relay (M14) not deployed. CF Worker exists but client sync, lobby, PING cross-device not wired. | Cannot demonstrate remote co-play. Court evidence of “playing with kids remotely” requires multiplayer. |
| BND-002 | **HIGH** | Android tablet QA (M15) not executed. Touch targets, viewport lock, rubber-banding not verified on physical hardware. | Game may be unusable on target devices (kids’ tablets). |
| BND-003 | **MEDIUM** | Quest chains (M16) not implemented. Guided progression from water → glucose → Posner molecule does not exist. | Kids will have open sandbox but no narrative structure. Acceptable fallback but reduces engagement. |
| BND-004 | **LOW** | Neo4j password (p31delta) exposed in git history. Credential rotation \+ git filter-repo scrub needed. | No active exploit risk (password is for local dev). Remediation deferred to post-ship. |
| BND-005 | **LOW** | Sound engine uses static config. Web Audio initializes but some browsers require user gesture before AudioContext. | First-tap silence on some devices. Non-blocking. |

# **2\. Condition Left (Ship Check – Target State)**

**On March 10, 2026, the following conditions are met:**

**BONDING is live, playable, and birthday-ready on two Android tablets.**

All wcds through M16 are closed. Multiplayer is functional (Tyler-verified stress test complete). Difficulty modes operational: Seed mode presents only H and O for Willow (age 6), Sprout mode adds C and N for Bash (age 10). Quest chains provide guided progression. Touch targets hardened for both age groups (50–60px for Willow, 44px+ for Bash). Genesis Block telemetry recording all interactions as court-admissible engagement evidence. PWA installable on Android Chrome. All court-referenced URLs resolve on cellular.

**Multiplayer architecture:**

Bulletin-board model. Each player builds independently in a shared room. Relay broadcasts formula, LOVE, completion status. No CRDT, no conflict resolution, no merge logic. 6-character room codes. PING reactions (4 emoji) transmit cross-device. This is what makes it feasible in the remaining window.

**Fallback if M14 (relay) does not close:**

BONDING ships as single-player only. Solo play is fully functional. Multiplayer becomes post-ship enhancement. This is an acceptable degradation — the game still demonstrates parental engagement via Genesis Block telemetry.

# **3\. Job Specifications**

## **3.1 Task Breakdown**

| Task ID | Task | Agent | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- | :---- |
| B1.1 | WCD-M14: Deploy CF Worker relay | Sonnet/CC | 2h | Worker deployed to bonding-relay.trimtab-signal.workers.dev. KV namespace created. POST /room and GET /room/:id endpoints functional. |
| B1.2 | WCD-M14: Client sync integration | Sonnet/CC | 2h | useMultiplayer hook polls relay every 2s. Room state renders partner molecules. PING emoji transmit and display as toasts. |
| B1.3 | WCD-M14: Lobby \+ room codes | Sonnet/CC | 1h | 6-char alphanumeric room code generator. Join/Create room UI. Room persists in KV for 24h TTL. |
| B1.4 | WCD-M16: Genesis quest chain (Seed) | Sonnet/CC | 1.5h | Willow builds H₂O. Toast on each step. Quest complete celebration. LOVE awarded. |
| B1.5 | WCD-M16: Kitchen quest chain (Sprout) | Sonnet/CC | 1.5h | Bash builds through guided sequence: H₂O → CO₂ → NaCl → glucose. Achievements unlock. |
| B1.6 | WCD-M16: Posner quest chain (Sapling) | Sonnet/CC | 1h | Advanced chain ending at Ca₉(PO₄)₆. Easter egg: Missing Node 172.35 Hz resonance. |
| B1.7 | WCD-M15: Android tablet QA pass 1 | Will | 2h | Full game flow on Tablet 1 (Willow device). Seed mode. Touch targets 50–60px. No viewport scroll. No rubber-banding. PWA install. |
| B1.8 | WCD-M15: Android tablet QA pass 2 | Will | 1h | Full game flow on Tablet 2 (Bash device). Sprout mode. Quest chain completable. Multiplayer join via room code. |
| B1.9 | Multiplayer stress test (Tyler) | Will \+ Tyler | 2h | 30-min session. No disconnects. PING round-trip \< 2s. Both players see each other’s molecules update. Tailscale mesh if needed. |
| B1.10 | Security: AudioContext user-gesture gate | Sonnet/CC | 30m | Web Audio resumes on first user tap. No silent-start on any browser. |
| B1.11 | Final build \+ deploy | Sonnet/CC | 1h | npm run build: 0 errors. tsc \--noEmit: 0 errors. 328+ tests pass. CF Pages deploy success. |
| B1.12 | Birthday deploy verification | Will | 30m | BONDING accessible on both tablets. Room code connects. Genesis Block recording. |
| B1.13 | Evidence URL verification | Will | 30m | bonding.p31ca.org loads on cellular (not WiFi). Engagement report accessible. Exhibit A URLs resolve. |

## **3.2 Tools, Software & Dependencies**

| Tool | Version/Source | Purpose | Cost |
| :---- | :---- | :---- | :---- |
| Vite | Latest (build tool) | Dev server \+ production bundler | Free |
| React \+ R3F | React 18 \+ R3F (r128 freeze) | UI \+ 3D rendering | Free |
| Zustand | Latest | State management (atoms, LOVE, quests) | Free |
| Vitest | Latest | Test runner (328+ tests) | Free |
| TypeScript | Latest | Type checking (tsc \--noEmit) | Free |
| Cloudflare Workers | Free tier | Multiplayer relay (KV polling) | Free |
| Cloudflare Pages | Free tier | Static hosting (bonding.p31ca.org) | Free |
| Chrome DevTools | Built-in | Android remote debugging | Free |
| Tailscale | Free tier | Mesh VPN for Tyler stress test | Free |
| 2× Android tablets | Physical hardware (existing) | Target devices for QA | Owned |

# **4\. Phase Gates & Sequencing**

## **4.1 Critical Path**

B1.1 (Worker deploy) → B1.2 (client sync) → B1.3 (lobby) → B1.9 (Tyler test) → B1.11 (build) → B1.12 (birthday deploy)

## **4.2 Parallel Track**

B1.4–B1.6 (quest chains) run parallel to B1.1–B1.3 (relay). B1.7–B1.8 (Android QA) execute after relay \+ quests are both complete.

## **4.3 Gate Definitions**

| Gate | Date/Time | Required OQE | Go/No-Go |
| :---- | :---- | :---- | :---- |
| Gate B1: Relay Live | Mar 9 AM | CF Worker responds to POST /room. Client receives room state. PING round-trip functional on localhost. | Will |
| Gate B2: Feature Complete | Mar 9 PM | All 3 quest chains completable. Multiplayer lobby functional. 328+ tests green. | Will |
| Gate B3: Device Verified | Mar 9 EOD | Both tablets pass QA (B1.7, B1.8). Tyler stress test passed (B1.9). Screenshots captured. | Will |
| Gate B4: Ship | Mar 10 AM | Final build deployed. Birthday verification passed. Genesis Block snapshot archived. Evidence URLs verified on cellular. | Will |

## **4.4 OQE Artifacts**

**Gate B1:** Terminal screenshot of Worker deploy log. curl response from POST /room endpoint.

**Gate B2:** Terminal screenshot of 328+ test pass. Screen recording or screenshots of each quest chain completion.

**Gate B3:** Photos of BONDING running on physical tablets. Tyler confirmation message (text/Slack). Video of multiplayer session if possible.

**Gate B4:** Cloudflare Pages deploy log. Screenshot of BONDING on Bash’s tablet. Genesis Block timestamp. Cell phone screenshot of bonding.p31ca.org loading on cellular.

# **5\. Role Assignments**

| Role | Assigned To | Responsibilities | Boundaries |
| :---- | :---- | :---- | :---- |
| Work Leader | Will Johnson | Go/no-go at all gates. Physical device QA (B1.7, B1.8). Tyler coordination. Birthday deploy. Evidence verification. | Does not write relay code. If exec dysfunction: open this doc, find next numbered task. |
| Primary Mechanic | Sonnet/CC | All code tasks: relay Worker, client sync, lobby, quest chains, AudioContext fix, final build. | Does not make architecture decisions. Follows task specs exactly. Flags ambiguity to Work Leader. |
| QA/Supervisor | Opus | Reviews test coverage. Validates quest chain logic matches chemistry specs. Final sign-off on Gate B2. | Does not write production code. |
| Beta Tester | Tyler | 30-min multiplayer stress test. Reports disconnects, PING failures, visual bugs. | Receives only: URL, room code, and “play and tell me if it breaks.” No architecture context needed. |

# **6\. Quality Assurance Plan**

## **6.1 Automated Checks (Every Commit)**

| Check | Tool | Threshold |
| :---- | :---- | :---- |
| Unit \+ integration tests | Vitest | 328+ tests, 0 failures |
| Type checking | tsc \--noEmit | 0 errors |
| Production build | npm run build | 0 errors (CSS import warning accepted) |
| Bundle size | Vite build output | three.js ≤ 700KB, r3f ≤ 520KB, app ≤ 250KB |

## **6.2 Manual Verification Matrix**

| Scenario | Device | Steps | Expected Result |
| :---- | :---- | :---- | :---- |
| Seed mode (Willow, age 6\) | Tablet 1 | Tap Seed. Drag H to slot. Drag O to slot. Build. | H₂O forms. Achievement toast. LOVE awarded. Touch targets 50–60px. No scroll. |
| Sprout mode (Bash, age 10\) | Tablet 2 | Tap Sprout. Complete Kitchen quest chain. | Water → CO₂ → NaCl → glucose. Each step toasts. Achievements unlock. |
| Multiplayer join | Both tablets | Create room on T1. Join with code on T2. Build molecule on T1. | T2 sees T1’s molecule appear. PING from T2 shows on T1 as toast. |
| PWA install | Tablet 1 | Chrome menu → Add to Home Screen. Launch from icon. | App launches fullscreen. No browser chrome. Splash screen shows. |
| Offline fallback | Tablet 1 | Enable airplane mode after load. Build molecule. | Single-player works. Multiplayer shows “Offline” indicator. No crash. |
| Genesis Block capture | Any device | Build 3 molecules. Check IndexedDB. | Timestamped entries for each molecule. Creator ID. Formula. LOVE awarded. |

# **7\. Risk Register**

| Risk ID | Risk | L | I | Mitigation |
| :---- | :---- | :---- | :---- | :---- |
| BR-01 | Relay instability under load | M | M | Bulletin-board architecture has no conflict resolution — simplicity IS the mitigation. KV polling every 2s is conservative. Fallback: single-player. |
| BR-02 | Android tablet hardware failure | L | H | BONDING is a PWA. Any Android Chrome device works. Worst case: Will’s phone. |
| BR-03 | Tyler unavailable for stress test | M | L | Will solo-tests with two devices simultaneously. Less rigorous but sufficient. |
| BR-04 | Quest chain blocks on chemistry bug | L | M | 62-molecule dictionary already verified in WCD-05. 11 formula mismatches already fixed. Test suite covers all quest target molecules. |
| BR-05 | Executive dysfunction during critical path | H | H | This document. Open it, find the next B-number task, execute it. No decisions required. |
| BR-06 | Sonnet hallucination in relay code | M | M | tsc \--noEmit \+ full test suite before any deploy. No deploy without 0 errors. |
| BR-07 | CF Workers free tier rate limit | L | M | KV reads: 100K/day free. At 2s polling with 2 players \= \~86K reads/day. Tight but within limit for a birthday. |

# **8\. Security Hardening Ledger**

The following security items are tracked but explicitly deferred from the ship deadline. They do not block BONDING launch.

| Item | Severity | Status | Remediation Plan | Target |
| :---- | :---- | :---- | :---- | :---- |
| Neo4j password in git history | **LOW** | Tracked | git filter-repo \--replace-text scrub. Rotate credential. Force-push all branches. Notify collaborators. | Post-hearing |
| HTTPS-only enforcement | **COMPLETE** | Done | Cloudflare auto-SSL on all \*.p31ca.org subdomains. | N/A |
| CSP headers | **LOW** | Not started | Add Content-Security-Policy header via CF Pages \_headers file. Script-src self \+ CDNs only. | Post-hearing |
| IndexedDB encryption at rest | **LOW** | Not started | Wrap idb-keyval with crypto.subtle AES-GCM before write. Key derived from Genesis Block. | Q2 2026 |
| Relay authentication | **MEDIUM** | Not started | Room codes are currently unauthenticated. Add Ed25519 signed payloads to relay POST. | Post-hearing |

**END OF CWP-BONDING-001**  
Ship date: March 10, 2026 • Classification: SOULSAFE

*“Every atom placed is a timestamped parental engagement log. Every ping is documented contact.”*