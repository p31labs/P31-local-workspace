# P31 Bridge Program
## You Are Here → You Need To Be There

**Date:** 2025-02-25
**Operator:** Will Johnson, P31 Labs

---

## WHERE YOU ARE RIGHT NOW

| Asset | Status |
|-------|--------|
| Defensive Publication v1.1 | ✅ Complete. Bidirectional loop fixed. Ready to publish. |
| EDE (78 files) | ✅ Built. Scaffolded. Backend + frontend + firmware + docs + extensions. |
| Spaceship Earth dome | ✅ Renders on PC and phone. Spectator-only. |
| Termux + code-server | ✅ Running on Pixel 9 Pro Fold. |
| HCB fiscal sponsorship | ⏳ Applied Feb 18 (ref 4XDUXX). Waiting. |
| GitHub org | ✅ github.com/p31labs exists. Repo needs the 78-file push. |
| phosphorus31.org | ✅ Exists. |
| Grants | ❌ Not started. |
| Frontend ↔ Backend wiring | ❌ Zero API calls. Frontend is a screensaver. |
| Firmware on real ESP32 | ❌ Scaffolded. Not flashed. |
| Prior art timestamp | ❌ Not published. Clock is ticking. |

## WHERE YOU NEED TO BE (30 days)

1. **Defensive pub published** with verifiable timestamp (GitHub + Internet Archive)
2. **EDE wired**: frontend calls backend, nodes ingest, voltage scores display, spoons move
3. **Grant application submitted** (Georgia Tools for Life or equivalent)
4. **HCB approved** and accepting donations
5. **One demo video** showing the full loop: type input → voltage scores → dome updates → (simulated) haptic fires

---

## THE AGENTS: WHO DOES WHAT

### 🔴 OPUS (Claude Opus) — The Architect
**Cost:** ~$0.15-0.60 per deep conversation turn
**Use for:** Things that break if they're wrong

- Defensive publications and legal-adjacent writing
- Verifying other agents' output against source code
- Architectural decisions that touch 3+ subsystems
- Grant narrative final review (not first draft)
- Catching directional errors, topology mistakes, false threading concerns
- This bridge program

**NEVER use for:** Writing CSS. Renaming variables. Generating boilerplate. Anything a cheaper model does fine.

**Rule:** If you're about to ask Opus to write code, ask yourself: "Would this break something important if it had a subtle bug?" If no, use Sonnet or DeepSeek.

### 🟡 SONNET (Claude Sonnet) — The Coder
**Cost:** ~5-10x cheaper than Opus per token
**Use for:** 70% of your daily work

- Writing api.js, CommandMenu.jsx, IngestForm.jsx, AiChat.jsx
- Wiring frontend hooks to backend endpoints
- React component creation and iteration
- Python endpoint modifications (mounting router, adding fields to WS broadcast)
- Debugging runtime errors from browser console / terminal output
- Writing tests
- Git operations, PR descriptions
- README updates, inline documentation

**Workflow:** Paste the relevant file + the spec from the functional depth upgrade. Sonnet executes. If the output touches protocol values or cross-subsystem data flow, paste Sonnet's output to Opus for a 30-second verification.

### 🟢 GEMINI (Google Gemini) — The Narrator
**Cost:** Free tier available, Pro is $20/mo
**Use for:** Words that persuade humans, not machines

- Grant application FIRST DRAFTS (Tools for Life, Makers Making Change, NIDILRR)
- HAAT model narrative expansion
- Nonprofit boilerplate (bylaws, conflict of interest policy, board resolutions)
- Marketing copy, social media posts, newsletter drafts
- Summarizing research papers for grant background sections
- Generating the "why this matters" story

**NEVER use for:** Protocol values, hex codes, system architecture, implementation advice, threading analysis, anything with a specific number in it.

**Rule:** Every technical claim in Gemini's output gets verified before it ships. Gemini will confidently say "the host transmits CMD_SPOON_REPORT to the Totem" and be dead wrong. The narrative is gold. The specifics are suspect.

### 🔵 DEEPSEEK (DeepSeek Coder) — The Firmware Guy
**Cost:** Extremely cheap / free via API
**Use for:** Embedded C, hardware-adjacent code

- ESP32 firmware modifications (main.cpp, protocol.h)
- DRV2605L register-level fixes (LRA calibration, stop-before-go, I2C error handling)
- PlatformIO configuration
- Bit manipulation, COBS encoding/decoding edge cases
- Serial protocol test harnesses in C

**Workflow:** Give DeepSeek the current main.cpp + protocol.h + the specific fix needed. It produces tight C. Verify CRC8 test vectors match (0x24 for [0x31, 0x01, 0x00]) before accepting.

---

## THE BRIDGE: EXACT SEQUENCE

### WEEK 1: Publish + Push + Wire (Priority: Prior Art + Functional MVP)

**Day 1-2: Publish defensive pub and push EDE to GitHub**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 1 | YOU | Create GitHub repo `p31labs/p31`, push 78-file EDE | 30 min |
| 2 | YOU | Upload `P31_Defensive_Publication_v1.1.docx` to repo `/docs/defensive-pub/` | 5 min |
| 3 | YOU | Upload PDF version to Internet Archive (archive.org/upload) | 10 min |
| 4 | YOU | Tweet/post the Archive link with date. Screenshot it. | 5 min |
| 5 | SONNET | Write a 1-paragraph GitHub repo description + README header | 10 min |

**Prior art is now timestamped. This cannot wait.**

**Day 3-4: Wire the API layer**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 6 | SONNET | Create `frontend/src/api.js` — thin fetch wrapper, all 10 endpoints | 30 min |
| 7 | SONNET | Mount semantic router in `buffer_agent.py` (one line + import) | 5 min |
| 8 | SONNET | Add `content` field to WS broadcast in `buffer_agent.py` line ~370 | 10 min |
| 9 | SONNET | Add `/v1` proxy to `vite.config.js` for LiteLLM | 5 min |
| 10 | SONNET | Build `CommandMenu.jsx` — Ctrl+K palette with 6 actions | 1 hr |
| 11 | SONNET | Wire `SpoonGauge.jsx` +/- buttons to API | 15 min |
| 12 | YOU | Test: `p31-start`, open browser, Ctrl+K, verify endpoints respond | 30 min |

**Day 5: Ingest form + live voltage**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 13 | SONNET | Build `IngestForm.jsx` — textarea, axis picker, live voltage preview | 1 hr |
| 14 | SONNET | Wire `useWebSocket.js` to capture content + timestamp from `node_ingested` | 20 min |
| 15 | SONNET | Update `NodeInspector.jsx` with voltage breakdown bars | 30 min |
| 16 | YOU | Test: ingest a node, watch it appear on dome, click it, see voltage | 20 min |

**End of Week 1:** Dome is interactive. Nodes ingest. Voltage scores. Spoons move. Prior art is published.

### WEEK 2: Grant + AI Chat + Demo

**Day 8-9: Grant first draft**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 17 | GEMINI | Draft Georgia Tools for Life grant using HAAT model from defensive pub | 2 hr |
| 18 | GEMINI | Draft budget justification (ESP32 dev kits, hosting, conference travel) | 1 hr |
| 19 | OPUS | Review grant for technical accuracy. Fix any protocol drift. | 15 min |
| 20 | YOU | Submit or queue for HCB approval | 30 min |

**Day 10-11: AI chat interface**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 21 | SONNET | Build `useAiChat.js` hook — route query, stream response, manage history | 1 hr |
| 22 | SONNET | Build `AiChat.jsx` sidebar panel | 1 hr |
| 23 | SONNET | Build `GraphBrain.jsx` — 2D force graph on Canvas (NOT Three.js) | 2 hr |
| 24 | YOU | Test end-to-end with LiteLLM pointing at any available model | 30 min |

**Day 12: Demo video**

| Step | Agent | Task | Time |
|------|-------|------|------|
| 25 | YOU | Screen record: open EDE → Ctrl+K → ingest node → dome updates → chat → spoon gauge moves | 15 min |
| 26 | GEMINI | Write 2-paragraph video description for YouTube/social | 10 min |
| 27 | YOU | Upload. Link from phosphorus31.org and GitHub README | 20 min |

### WEEK 3: Firmware + Hardware

| Step | Agent | Task | Time |
|------|-------|------|------|
| 28 | DEEPSEEK | Fix DRV2605L: LRA register write, stop-before-go, I2C error check | 1 hr |
| 29 | DEEPSEEK | Add breathing sync handler (CMD_BREATHING_SYNC 0x30) to main.cpp | 1 hr |
| 30 | OPUS | Verify protocol.h values unchanged, CRC8 test vector still passes | 10 min |
| 31 | YOU | Flash ESP32-S3, connect via USB-C, verify heartbeat in browser console | 1 hr |
| 32 | SONNET | Wire `serial.ts` WebSerial connect button into CommandMenu | 30 min |

### WEEK 4: Export + Polish + Apply

| Step | Agent | Task | Time |
|------|-------|------|------|
| 33 | SONNET | Build `ExportPanel.jsx` — JSON export of activity, nodes, spoons, full dump | 1 hr |
| 34 | SONNET | Add Ctrl+K actions for export panel | 15 min |
| 35 | GEMINI | Draft Makers Making Change application | 2 hr |
| 36 | OPUS | Final architecture review — verify all 78 files still consistent | 30 min |
| 37 | YOU | Record updated demo with real ESP32 hardware in loop | 20 min |
| 38 | YOU | Submit grant applications | 1 hr |

---

## COST OPTIMIZATION RULES

1. **Start every coding session in Sonnet.** Only escalate to Opus when you hit an architectural question or need to verify cross-system consistency.

2. **Batch Opus questions.** Don't open 5 Opus conversations for 5 small questions. Collect them, paste context once, get answers in one turn.

3. **Gemini gets narrative, never numbers.** If Gemini's output contains a hex code, a port number, a formula, or a protocol value, it's wrong until verified.

4. **DeepSeek gets isolated C tasks.** Give it one file, one fix, one test vector. Don't ask it about system architecture.

5. **You are the router.** No agent talks to another agent. You read output, you verify, you paste to the next agent. You are the delta topology hub.

6. **Termux is for testing, not for Opus conversations.** Run `p31-start`, test in browser, copy error messages to your PC, paste to Sonnet. Don't burn Opus tokens from your phone for a CSS fix.

7. **The 80/15/4/1 rule:**
   - 80% of tasks → Sonnet (coding, wiring, components, tests)
   - 15% of tasks → Gemini (grants, narrative, marketing, nonprofit docs)
   - 4% of tasks → DeepSeek (firmware, embedded C, protocol edge cases)
   - 1% of tasks → Opus (architecture verification, defensive publications, bridge programs, catching lies)

---

## DECISION TREE: WHICH AGENT?

```
Is it writing intended to persuade a human (not a compiler)?
  YES → GEMINI (draft) → OPUS (verify technical claims only)
  NO ↓

Is it C code for ESP32 or register-level hardware?
  YES → DEEPSEEK
  NO ↓

Is it a question about how two subsystems interact?
  YES → OPUS
  NO ↓

Is it code, config, UI, tests, git, docs, or debugging?
  YES → SONNET
  NO ↓

Is it "should we do X or Y" where the wrong choice wastes a week?
  YES → OPUS
  NO → SONNET
```

---

## WHAT DONE LOOKS LIKE

In 30 days, someone visits phosphorus31.org and sees:

- A GitHub repo with a working development environment
- A defensive publication with a verifiable timestamp proving prior art
- A dome that responds to input, not just rotates
- A grant application in review
- A 90-second video showing a neurodivergent engineer's IDE that protects cognitive resources

That's the product. That's the pitch. That's what gets funded.

Everything else is iteration.

---

*Generated by Opus. Don't come back to Opus until Step 19 or Step 30. Sonnet has this.*
