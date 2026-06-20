# P31 Andromeda — Unified Battle Plan

**Generated:** 2026-06-19T10:50Z
**Source:** Synthesis of Gemini narrative + DeepSeek technical responses, cross-referenced against disk

**Status:** All agents locked in, plan solidified. No code written until blueprint is approved.

---

## ECOSYSTEM STATE (Commit to Memory)

```
verify.sh: 16 pass / 0 fail / 4 warn (all 4 expected)
8 endpoints HTTP 200
5 money stream scripts: all stubs (10 lines, `echo "stub"`)
```

---

## PHASE 1: IMMEDIATE EXECUTION (Today)

### Track A — Narrative & Grants (Gemini) → BLOCKED

| Deliverable | Status | Blocked By |
|---|---|---|
| P31 Story for Funders (1-pager) | ✅ DONE — Gemini delivered usable master narrative |
| 30-day social cadence | ✅ DONE — channel matrix + rotation schedule |
| NLnet proposal narrative review | ⏸ **BLOCKED** — needs 3 raw proposal texts from Will |
| Paper XII narrative polish | ⏸ **BLOCKED** — needs latest draft from Will |

**Next action for Will:** Drop the 3 NLnet proposal texts and Paper XII draft in the Gemini chat.

### Track B — Money Streams (DeepSeek) → WRITE READY

| Stream | On Disk | Replacement |
|---|---|---|
| bounty-hunter.sh | stub (10 lines, nuclei-not-installed-safe) | ✅ Full script written — overwrite file |
| package-assets.sh | stub | ✅ Full script written — overwrite file |
| audit-crawler.sh | stub | ✅ Full script written — overwrite file |
| publish-action.sh | stub | ✅ Full script written — overwrite file |
| post-sponsorships.sh | stub | ✅ Full script written — overwrite file |

**Assessment:** DeepSeek's scripts are solid. Each supports `--dry-run`, `SPOON_LEVEL` gating, proper exit codes (0/1/2), structured JSON logging. Ready to write to disk.

**⚠ One gap:** `package-assets.sh` (Gumroad) has a placeholder comment — actual Gumroad presigned upload API needs research. Script will log success but the S3 presign call is a stub within a stub.

### Track C — Node Zero Firmware (DeepSeek) → NEEDS REDIRECT

**Critical finding:** DeepSeek wrote `display_boot.cpp` targeting **ST7796 over SPI3**. The actual hardware on disk is **AXS15231B over QSPI**. These are completely different display controllers with different init sequences, buses, and pinouts.

#### Hardware Reality (From Disk)
| Component | Actual | DeepSeek Assumed |
|---|---|---|
| Display controller | AXS15231B | ST7796 |
| Display bus | QSPI | SPI3 |
| Touch controller | Integrated with AXS15231B (`esp_lcd_touch_axs15231b`) | FT6336 on I2C |
| Board | Waveshare ESP32-S3-Touch-LCD-3.5B | Same (correct) |

**Existing firmware that already does the job:**
- `display.h` / `display.c` — AXS15231B QSPI init, LVGL registration, backlight PWM — **188 lines, complete**
- `touch.h` / `touch.c` — Touch init via `esp_lcd_touch_axs15231b` — **36 lines, complete**
- `main.cpp` — LVGL task, WiFi init, NVS credentials, boot flow — **235 lines, complete**
- `p31_ui.h` / `p31_ui.c` — Widgets: status, LoRa dot, spoon arc, RSSI bar — **187 lines, complete**
- `lora.h` / `lora.c` — SX1262 LoRa driver — **complete**

**Decision: DeepSeek display_boot.cpp is NOT to be written.** The init sequence already lives in `display.c` + `touch.c`. What's actually needed:

| Actual Need | Priority |
|---|---|
| Boot animation sequence (LVGL splash → spinner → main menu transition) | Medium |
| BLE provisioning screen (for WiFi creds when NVS is empty) | Medium |
| Integration: `p31_ui` already has widget handles, but needs main menu feature | Low |
| GPIO audit against PSRAM kill zone 26-37 | Low |

**Redirect DeepSeek:** Instead of rewriting display init, extend the existing boot flow:
1. Add splash animation to `p31_ui.c` (LVGL fade-in, spinner)
2. Add BLE provisioning callback to `p31_net.c`
3. Validate GPIOs in `config.h` against PSRAM kill zone

### Track D — K4 Cage Review (DeepSeek) → NEEDS CODE-GROUNDED REVIEW

DeepSeek's review is **generic Cloudflare Worker advice** without having read the actual source. The real `k4-cage/src/index.js` needs a line-by-line review.

**On disk:** single file `andromeda/software/k4-cage/src/index.js`, plus `wrangler.toml` and `deploy.sh`.

**Assessment:** DeepSeek's generic recommendations (WS cleanup, KV TTL, rate limiting, DO memory limits) are correct patterns — but they need to be validated against the actual 1 file of source before we make changes.

**Next action:** Review the actual `src/index.js` with DeepSeek. Recommendations stand but need code grounding.

---

## PHASE 2: THIS WEEK

### Priority Order (From 8-Ball: Spoons=3, Peak hrs, Deadlines=1)

| # | Action | Spoons | Why Now |
|---|---|---|---|
| 1 | ✅ **Money stream scripts → disk** | 1 | Scripts written, just need file write — highest ROI per spoon |
| 2 | ⏸ **NLnet proposals → Gemini** | 1 | Due June 1 — 12 days. But blocked by Will's text |
| 3 | 🔧 **Node Zero boot animation** | 2 | Existing code complete, just needs splash transition |
| 4 | 🔧 **K4 Cage code review** | 1 | Read existing src/index.js, validate DeepSeek's patterns |
| 5 | 📝 **Paper XII polish → Gemini** | 1 | Blocked by Will's text |
| 6 | 🧹 **BONDING audit fixes** | 2 | Priority 1: server unhandled rejections + input validation |

---

## CONFLICT REGISTER

| Conflict | Detail | Resolution |
|---|---|---|
| Display driver mismatch | DeepSeek wrote ST7796/SPI3 code. Hardware is AXS15231B/QSPI. | **DISCARD** DeepSeek's display_boot.cpp. Extend existing display.c instead. |
| Touch controller mismatch | DeepSeek wrote FT6336/I2C code. Hardware uses integrated axs15231b touch. | **DISCARD** DeepSeek's touch init. Existing touch.c is correct. |
| Money stream filenames collide | DeepSeek's scripts have same filenames as existing stubs. | **OVERWRITE** — stubs are no-op, replacements are real implementations. |
| K4 Cage review is generic | DeepSeek gave best-practices without reading actual source. | **VALIDATE** against src/index.js before any changes. |

---

## WHAT WE'RE NOT DOING (Anti-Patterns)

| Not Doing | Why |
|---|---|
| Rewriting display init | Already done correctly in `display.c` + `touch.c` |
| Rewriting LVGL task | Already done in `main.cpp` (lines 44-59) |
| Implementing Gumroad S3 upload | API is not straightforward; script logs the attempt |
| Refactoring BONDING mobile | 32 tests pass, not critical path |
| Deploying K4 Cage changes | Not until code review against actual source |
| Writing NLnet proposals from scratch | Gemini needs to polish existing drafts, not start from zero |

---

## DEPENDENCY GRAPH

```
Will drops NLnet texts + Paper XII
  └→ Gemini: narrative review + polish (Phase 1)
      └→ Will: submits to NLnet by June 1

Will approves Battle Plan
  └→ Write money stream scripts to disk (Phase 1)
  └→ Redirect DeepSeek to boot animation + BLE provisioning (Phase 2)
  └→ Read K4 Cage source, DeepSeek reviews actual code (Phase 2)
  └→ BONDING audit fixes (Phase 2-3)
```

---

## NEXT ACTION

**Will:** 
1. ✅ Approve this plan (or modify it)
2. Drop NLnet proposal texts + Paper XII for Gemini
3. We start writing money streams to disk immediately on your go
