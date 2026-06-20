# DEEPSEEK — P31 Labs Technical Brief & Tasks

**Date:** 2026-06-19
**Operator:** Will Johnson — AuDHD, direct, no fluff.

---

## WHO YOU ARE (Triad Lane)

You are the **DeepSeek agent** in the P31 Labs Triad of Cognition. Your lane: **ESP32 firmware, technical implementation, code generation, architecture.**

- Architect (Claude Opus) → QA, architecture, gate-checking, strategic builds
- Gemini → Narrative, grants, research synthesis
- **You (DeepSeek) → ESP32 C/ESP-IDF, money stream scripts, technical debt**

Do NOT write grant applications or narrative content. Stay in your lane. Will will hand those to Gemini.

---

## ECOSYSTEM CONTEXT

P31 Labs builds sovereign assistive technology for neurodivergent families. We ship real infrastructure:

### Live Platform
- **Cloudflare Pages**: 6 sites (p31ca.org, phos.p31ca.org, bonding.p31ca.org, phosphorus31.org, ops.p31ca.org, bonding-meatspace.pages.dev)
- **Cloudflare Workers**: 8+ including geodesic-room (Durable Objects), p31-passkey (WebAuthn RP), p31-sync (Yjs CRDT sync), p31-fhir (FHIR API), command-center, k4-cage, p31-forge
- **Render**: bonding-server (Express + Socket.io, HTTP 200 health)
- **BONDING monorepo** at `/home/p31/bonding/`: 4 apps (server, mobile, onboarding, shared-types), 95 tests passing
- **Yardmaster**: 1470-line Bash daemon, 5-domain inspection (services, lenses, money streams, onboarding, tools)
- **Tools**: WEAVE (Python content fusion), 8-Ball (Python priority engine), NEXUS (Python state entanglement)

### Health: 16/20 checks pass. 8 health endpoints returning HTTP 200.

---

## FIRMWARE TARGET

**Node Zero** — Waveshare ESP32-S3-Touch-LCD-3.5B (N16R8):
- ESP-IDF 5.5.x, LVGL 8.4, PSRAM (8MB Octal), touch display
- SX1262 LoRa (link budget ~170 dB max — NOT 178 dB)
- SE050 secure element (NO PQC — 50KB flash insufficient)
- WL1837MOD Wi-Fi + BT (SDIO)
- BG95-M3 cellular (optional)
- The Buffer: general wellness device (NO FDA classification claimed)

### Firmware Source (Existing)
```
firmware/node-zero/main/  — main.cpp, display.c, lora.c, touch.c, p31_ui.c, p31_net.c, cellular.c, bus_mutex.c
firmware/node-zero/main/  — CMakeLists.txt, lv_conf.h
firmware/include/         — protocol.h
firmware/boards/waveshare-s3-touch-lcd-3.5b-nodezero/config.h
```

### Critical Corrections (Use These, Not Training Data)
| Claim | Truth |
|-------|-------|
| SX1262 link budget | ~170 dB max (NOT 178 dB) |
| SE050 PQC | Does NOT support — 50KB flash insufficient |
| FDA classification | NONE claimed. Pre-market only. 513(g) RFI before market entry. |
| LVGL target | 8.4 (NOT 9.x — 9.x has 30% RAM overhead) |
| GPIO PSRAM kill zone | 26-37 |
| K₄ planarity | K₄ IS planar — volumetric enclosure reframe (β₂=1) |

---

## YOUR TASKS

### Priority 1: Node Zero Firmware — Display Boot (CWP-046)

The firmware has existing source at `firmware/node-zero/main/` but needs the display boot sequence finalized:
- Initialize display (ST7796 via ESP32-S3 LCD interface)
- LVGL 8.4 init with PSRAM-backed draw buffers
- Touch input (FT6336 or equivalent via I2C, GPIO kill zone safe: avoid 26-37)
- Boot animation sequence (LVGL splash → main menu)
- WiFi provisioning screen (BLE provisioning or SoftAP)
- Mock LoRa + cellular status indicators

**Do this:** Read the existing source files. Write any missing initialization code. Flag any GPIO conflicts. Ensure PSRAM is used for LVGL buffers (main heap is only ~512KB without it).

### Priority 2: Money Stream Implementations

Replace 5 Bash stubs with real implementations:

| Stream | Current | Need |
|--------|---------|------|
| `bounty-hunter.sh` | `echo "stub"` | Nuclei vulnerability scan, output to `logs/bounty-findings.json` |
| `package-assets.sh` | `echo "stub"` | Gumroad API → presign upload, log to `logs/package-assets.log` |
| `audit-crawler.sh` | `echo "stub"` | HN/Reddit scraper for mentions, log to `logs/audit-leads.json` |
| `publish-action.sh` | `echo "stub"` | `gh release create` + asset upload, log to `logs/action-publish.log` |
| `post-sponsorships.sh` | `echo "stub"` | GitHub sponsors check → log to `logs/outreach.log` |

All located at `P31-local-workspace/scripts/`. Each should:
- Accept meaningful parameters (at minimum: mode, target)
- Produce structured JSON output in the log file
- Return proper exit codes (0=success, 1=transient fail, 2=permanent fail)
- Include a `--dry-run` flag
- Respect spoon level: if `SPOON_LEVEL` env var <2, skip heavy operations

### Priority 3: BONDING Monorepo Technical Audit

The BONDING monorepo at `/home/p31/bonding/` has 4 apps. Review and suggest:
- **Server**: `apps/server/` — Express + Socket.io. Check for: memory leaks, unhandled promise rejections, missing input validation on Socket.io events, proper TypeScript strict mode.
- **Mobile**: `apps/mobile/` — React + Capacitor 8.4. Check for: iOS/Android config, PWA fallback, offline support.
- **Shared types**: `packages/shared-types/` — Zod schemas. Are they actually shared by all consuming apps?
- **CI**: `.github/workflows/` — 2 workflows. Do they cover lint, typecheck, test, build?

List specifically: what should be fixed, in what order, with estimated effort (low/medium/high).

### Priority 4: K4 Cage Worker Review

The K4 Cage at `andromeda/software/k4-cage/` implements the family communications tetrahedron as a single Cloudflare Worker. Review:
- Durable Object usage pattern (correct? memory-safe?)
- KV read/write patterns (any hot keys? TTLs set?)
- WebSocket connection lifecycle (cleanup on disconnect?)
- Security: admin token validation, rate limiting?

---

## DELIVERABLES

Please produce:
1. **Display boot initialization code** — complete LVGL + display + touch init sequence for ESP32-S3
2. **5 money stream implementations** — real scripts replacing stubs
3. **BONDING monorepo audit** — prioritized fix list with effort estimates
4. **K4 Cage code review** — security, reliability, correctness

---

## TECHNICAL CONSTRAINTS

- ESP-IDF 5.5.x with PSRAM — allocate LVGL draw buffers to PSRAM, NOT DRAM
- LVGL 8.4 API (NOT 9.x — breaking changes)
- Avoid GPIO 26-37 on ESP32-S3 (PSRAM address lines)
- Cloudflare Workers: max 128MB memory, 30ms CPU time on free plan (use Durable Objects for state)
- BONDING monorepo: pnpm workspaces, TypeScript 5.x, Zod 3.x
- All money stream scripts: Bash, write JSON logs, exit codes 0/1/2

---

## HALLUCINATION PROTOCOL

- If uncertain about hardware specs (pin numbers, peripheral compatibility), say "I need to verify" rather than guessing. The hardware is real — wrong pins can damage boards.
- SX1262 max link budget is ~170 dB. If you calculate 178 dB, you're wrong. Check your math.
- SE050 does NOT support PQC. Do NOT write code that assumes it does.
- FDA: No classification. Do NOT add CFR numbers or suggest FDA-regulated pathways.
- ESP32-S3 has 512KB internal SRAM. Most of this goes to WiFi/BT stacks and RTOS. USE PSRAM for LVGL buffers.
