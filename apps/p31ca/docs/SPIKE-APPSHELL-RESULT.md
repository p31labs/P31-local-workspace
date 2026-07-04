# SPIKE-APPSHELL-RESULT — Track 2.5

**Spike spec:** `docs/SPIKE-APPSHELL-PERSISTENCE.md` (home repo).
**Status:** **automation green** across **13** headless probes (2026-04-30). Awaiting operator field test on real Chromebook + iPhone for the parts automation cannot reach.

---

## Headless Chromium results (2026-04-30)

Thirteen automated probes across two suites. **All thirteen pass.** Same canvas DOM node in every scenario; WebGL context loss is bounded and always restored; zero heap leak across every probe including the 100-nav overnight surface.

### Suite 1 — `spike-appshell-persistence.spec.ts` (architectural pass criteria)

| Scenario | Navs | avgFps | minFps | canvasAttach | ctxLost / Rest. | heapΔ | Duration |
|---|---|---|---|---|---|---|---|
| **baseline** (idle, ClientRouter) | 20 | 22 | 12 | 1 | 1 / 1 | 0 MB | 116 s |
| **extended** (slow-leak surface) | 50 | 24 | 12 | 1 | 1 / 1 | 0 MB | 131 s |
| **cpu-throttle** (CDP rate=4×, Chromebook-class) | 20 | 28 | 21 | 1 | 1 / 1 | 0 MB | 25 s |
| **reduced-motion** (`prefers-reduced-motion: reduce`) | 20 | 29 | 13 | 1 | 1 / 1 | 0 MB | 117 s |
| **bfcache** (browser back/forward) | 10 | 31 | 13 | 1 | 1 / 1 | 0 MB | 11 s |

### Suite 2 — `spike-appshell-field.spec.ts` (operational field simulation)

| Scenario | Navs | avgFps | minFps | canvasAttach | ctxLost / Rest. | heapΔ | Duration |
|---|---|---|---|---|---|---|---|
| **device-iphone** (iPhone 13 viewport + UA) | 20 | 41 | 21 | 1 | 1 / 1 | 0 MB | 15 s |
| **device-pixelbook** (1366×768 viewport) | 20 | 36 | 15 | 1 | 1 / 1 | 0 MB | 15 s |
| **network-slow-3g** (CDP throttle 500 Kbps / 400 ms RTT) | 10 | 43 | 32 | 1 | 0 / 0 | 0 MB | 11 s |
| **network-offline-recovery** (offline 2 s mid-flight) | 5 | 31 | 23 | 1 | 0 / 0 | 0 MB | 6 s |
| **tab-visibility** (hidden ↔ visible cycle) | 10 | 32 | 22 | 1 | 0 / 0 | 0 MB | 13 s |
| **console-clean** (zero JS errors sniffed) | 20 | 25 | 19 | 1 | 0 / 0 | 0 MB | 12 s |
| **forced-gc** (CDP HeapProfiler.collectGarbage between navs) | 20 | 25 | 17 | 1 | 0 / 0 | 0 MB | 16 s |
| **overnight-100** (100 navs, random idle 100-500 ms) | 100 | 36 | 16 | 1 | 1 / 1 | 0 MB | 112 s |

**The signal that matters:** in every one of the thirteen scenarios, `canvasAttachCount` ended at **1** — the same `<canvas>` DOM node survived every navigation. ClientRouter, browser back/forward, iPhone-shape, Chromebook-shape, throttled cellular, dropped network, backgrounded tab, forced GC, and 100 random-idle navs end-to-end. Astro `transition:persist` + `view-transition-name: none` + the singleton + the `webglcontextrestored` rebuild path is the right architecture.

**What changed in the field suite:**

- **Device emulation passes** — both iPhone-13 viewport+UA and 1366×768 Chromebook-class viewport hold the canvas across 20 navs. (Caveat: this is Chromium-with-iPhone-shape; real Mobile Safari WebGL semantics still need an operator probe.)
- **Network is not a stressor** — Slow-3G shaping (500 Kbps, 400 ms RTT) does NOT trigger context loss because the persistent canvas paints from in-memory state independent of the navigation fetch. `network-slow-3g` and `network-offline-recovery` both ran with `ctxLost: 0`.
- **Tab visibility is not a stressor** — toggling `document.visibilityState` between `hidden` and `visible` 10 times does not lose the GL context. (Caveat: real iOS Safari tab kills aren't faked by `visibilitychange` — operator probe needed.)
- **Console-clean passes** with the meaningful-error filter rejecting only `WebGL context lost`/`SwiftShader`/`preserveDrawingBuffer`/`[Violation]` (these are expected and recovered). No application JS errors during 20-nav stress.
- **Forced GC sees zero leak** — `HeapProfiler.collectGarbage` between every nav strips the temp-object fog; `heapDeltaMb` still came back 0. The singleton's bookkeeping (RAFs, GL refs, listeners) is clean.
- **Overnight-100 is the durability proof** — 100 navs with random 100-500 ms idle between, ~112 s wall time, single context loss + restore at startup, zero heap drift, canvas DOM node identity preserved end-to-end.

Reproduce:

```bash
cd andromeda/software/p31ca
npm run spike:appshell           # 5 persistence probes (~6.5 min)
npm run spike:appshell:field     # 8 field probes (~5 min total; overnight-100 is ~2 min of that)
npm run spike:appshell:all       # both suites end-to-end
```

Per-nav sample JSONs land in `e2e/results/spike-appshell-*.json` (gitignored). Tables above are canon.

---

## What is NOT proven (operator field test still required)

Thirteen passing headless probes is the strongest signal automation can give. What it can't reach:

| Check | How | Pass criterion |
|---|---|---|
| **Pixelbook hardware GPU** (vs SwiftShader) | Open `/spike/appshell/` in Chromium on the Pixelbook, click 20× | `attach-count` footer stat stays at 1; subjective FPS >= 30; ctxLost likely 0 (real GPU) |
| **iPhone Safari via Tailscale** | Open spike URL on iPhone Safari, navigate 20× | Canvas survives; no white flash; the camera lerps |
| **iPhone Safari swipe-back** | Two-finger swipe from edge → back → forward 5× | `data-p31-spike-route` flips; canvas footer stat stays the same UUID |
| **Real iOS background-kill** | Switch to another app for 60+ s, return to Safari | Canvas resumes (or recovers cleanly) — `visibilitychange` automation does not simulate iOS evicting the page |
| **Cold load over cellular** | Force-reload while on cellular | First paint < 2.5 s; no console error |
| **WebAuthn coexistence** | Trigger a Passkey prompt mid-navigation | Canvas remains rendered; passkey flow completes |
| **WebKit WebGL semantics** | Run the suite under WebKit (or open on iPhone) | iPhone-shape Chromium != Mobile Safari WebGL impl |

Record subjective notes (especially "the sky stays" / "the sky breaks") below.

---

## Operator field-test log

> Fill this section after running the spike on real hardware. One row per session. Sign with date + device.

| Date | Device | Result | Min FPS (subjective) | Notes |
|---|---|---|---|---|
| _e.g. 2026-05-01_ | _Pixelbook Chromium_ | _green / yellow / red_ | _smooth / judder / freeze_ | _free-text_ |

---

## Decision (operator)

> After all rows above are filled in, write the call here. One paragraph.
>
> **Green** → spec the full p31ca consolidation as a Tier-1 WCD using this AppShell pattern; promote `src/components/AppShell.astro` + `src/lib/starfield-singleton.ts` from `/spike/` into the production layer; refactor `index.astro` and `dome.astro` (and the rest of the 7 routes) to consume `AppShell`.
>
> **Yellow** → file the workaround spike (e.g. `bfcache-recovery`) as its own work package and re-run this spike afterward.
>
> **Red** → archive this spike to `docs/_archive/`, log a row in `docs/PARKING-LOT.md` rejecting full consolidation, and pivot the p31ca overhaul to SPA-style routing (single Astro entry + JS router) where the canvas does survive trivially.

---

## Cross-references

- Home spec: `docs/SPIKE-APPSHELL-PERSISTENCE.md`
- Home parking lot row: `docs/PARKING-LOT.md` § Architectural spikes (deferred but tracked) → "p31ca.org 7-route consolidation".
- Spike artefacts:
  - `andromeda/software/p31ca/src/components/AppShell.astro`
  - `andromeda/software/p31ca/src/lib/starfield-singleton.ts`
  - `andromeda/software/p31ca/src/pages/spike/appshell/{index,dome/index}.astro`
  - `andromeda/software/p31ca/e2e/helpers/spike-appshell.ts` — shared sample / report helpers
  - `andromeda/software/p31ca/e2e/spike-appshell-persistence.spec.ts` — Suite 1 (5 architectural probes)
  - `andromeda/software/p31ca/e2e/spike-appshell-field.spec.ts` — Suite 2 (8 operational probes)
  - `andromeda/software/p31ca/e2e/results/spike-appshell-*.json` (generated, gitignored)
