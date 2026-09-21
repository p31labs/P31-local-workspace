# Build prompt — P31 collaborative spatial music maker

Paste this into a new coding agent to start the build. It synthesizes an
infrastructure audit of `/home/p31` and a deep-research pass on spatial audio,
real-time collaboration, and accessibility. Read it whole before writing code —
the "what's built vs. new" table in §1 exists so you don't rebuild
`apps/phos/src/lib/sound.ts` from scratch.

---

## 0. What you're building

A spatial instrument where a family — a 7-year-old, a 10-year-old, a
70-year-old, and everyone between — places sounds in a 3D field and hears
each other play, live, across devices. Notes are zones in space; touching a
zone triggers it; the *arrangement* of zones is a score that's saved,
replayable, and provenance-tracked, the same way everything else in this
system's log is. Think "a planetarium you can hear," not a DAW.

This is not a from-scratch project. It's the Loom's existing architecture —
pure projection from a log, "reading is writing," opt-in sound, the family-fit
constraints — applied to a new domain. The constraint authority for this build
is `apps/loom/docs/STANDARDS.md` (touch floor, motion, contrast),
`apps/loom/docs/DECISIONS.md` #003 (sound opt-in) and #004 (reduced motion
collapses duration, never `animation: none`), and the AAF manifest at
`apps/loom/public/.well-known/agent-manifest.json`. §3 embeds the summary so
you don't need to open those files to start; read them when you need the full
reasoning. This document assumes the house vocabulary (canon tokens,
`commit()`, AAF `data-agent-*` attributes, the three-humans audience frame)
and doesn't repeat it except where music-specific work diverges from it.

---

## 1. Audit — what already exists in `/home/p31`

| Layer | File(s) | What it gives you |
|---|---|---|
| **Sonic vocabulary** | `apps/phos/src/lib/sound.ts` | A working `AudioContext` engine. `LARMOR_HZ`-derived frequencies, a pentatonic scale, and `spoonProfile()` — oscillator type/volume/attack/decay scaled by a 1–4 intensity value. This is your starting point for per-zone timbre. |
| **Multi-oscillator engine** | `apps/p31ca/public/lib/p31-quantum-composer.mjs` | A real, if archived, instrument: `QuantumComposerEngine` — oscillators → gains → filters → master, `vertexFrequencyHz()`, `bornNormalize()` for weighted chord blending. Reuse the osc→gain→filter chain pattern; don't reinvent it. |
| **Sensory-diet audio DNA** | `apps/p31ca/public/archive/2025-early/synth.html` | Archived but shows the house style for calm, non-startling audio onboarding (breath pacer, gentle ramps). Reference for tone, not code to lift. |
| **Opt-in sound discipline** | `apps/loom/src/lib/useLoomSound.ts`, `apps/loom/src/components/SoundToggle.tsx` | Sound OFF by default, every cue has a visual equivalent, motion preference and sound preference are tracked independently. `SoundToggle` is a 48px AAF surface (`chapter.sound.toggle`). **You will extend this, not replace it** — see §7. |
| **3D substrate** | `apps/loom/src/components/JitterbugScene.tsx`, `three@0.185.1` | A working three.js scene with the house conventions: phyllotaxis-sphere placement, a fixed color-token contract (no hex/rgb/oklch literals in the file — everything through `resolveTokenRgb` as a shader uniform), cursor-over-zone deposits a focus trace. **Copy the token-uniform pattern exactly.** |
| **Pure projection substrate** | `packages/field/src/instrument.ts`, `packages/field/src/*` | `zonesFromRegistry`, `tracesFromWarp`/`tracesFromWeft`, `projectInstrument`, `decay`/`pressure`/`hazard`. Pure, deterministic, no I/O. These operate on the *canon registry* (118 CSS-class/component zones) — **not** the same "zones" as your music spatial zones, but the decay/pressure/hazard math is directly reusable for "a played note glows, then cools" (see §5.4). Don't conflate the two zone concepts; name yours `MusicZone`. |
| **Event log / commit path** | `apps/loom/src/lib/useLoomState.ts`, `packages/canon/src/loom/{events,commit}.ts` | `commitThrough → gate → D1 → SSE fan-out`. `EventSource` with manual reconnect and `Last-Event-ID` resume (not bare `EventSource` — mobile networks need the backoff). This is your composition log, unmodified in mechanism, extended in vocabulary (§4). |
| **Weft (read/presence-adjacent log)** | `apps/loom/src/lib/useInstrument.ts` | `view.read` events already model "a passive act becomes a log entry, which becomes a trace, which feeds back into the field." This is conceptually your closest existing analogue to a "note trigger" — but it's fetched once (`fetch('/api/loom/weft')`), not streamed. You need to make live triggers *stream*, which weft doesn't do today (§6). |
| **Realtime WebSocket pattern** | `production/portals/chat/src/lib/chat.ts` — a sibling repo at `/home/p31/production`, outside this monorepo | `wss://chat-sandbox.trimtab-signal.workers.dev`, presence rooms, a `'presence'` message type with `members` count. This is the established WS pattern in the stack if you decide the SSE path isn't enough (§6 explains when it would be). |
| **Registry scale** | `packages/canon/registry.json` | 118 zones/CSS classes, 2 components — context for what "the field" means elsewhere in the system. Not directly reused, referenced for scale calibration only. |
| **Cross-device presence in the Loom itself** | — | **Does not exist yet.** Confirmed absent by grep. This is real new work, not a port (§6). |
| **Spatial audio (`PannerNode`, `StereoPanner`, `AudioListener`)** | — | **Does not exist anywhere in the stack.** This is the actual gap this project fills. |

**Bottom line:** the sonic vocabulary, the log/commit/SSE backbone, the
three.js scene conventions, and the opt-in-sound discipline all exist and
should be reused close to as-is. What's genuinely new: spatial audio
(`PannerNode`), a `MusicZone` domain model, live cross-device presence, and a
music-specific instrument surface.

---

## 2. Decisions (resolved, not open)

The audit's original open questions are resolved below, informed by the
research pass. Treat these as defaults to build against; flag to a human
only if implementation reveals one is wrong.

| Question | Decision | Why |
|---|---|---|
| **Surface** | Standalone `apps/music-maker`, consuming `@p31/canon` (tokens, gate, scope) and `@p31/field` (decay/pressure math only, not the registry zones) | Keeps the Loom's chapters untouched; inherits the trust/log layer for free; matches the audit's lean. |
| **Sound default** | Opt-in, muted by default — same hard rule as the rest of the Loom | Non-negotiable family rule, not a per-feature choice. `useLoomSound` already encodes this; extend it, don't fork it. |
| **Spatial model** | Static zone sphere; the listener moves (touch-drag primary; device-orientation as a later enhancement, not v1) | Matches the "planetarium" metaphor, maps directly onto `AudioListener.setPosition()`/`setOrientation()`, and avoids the accessibility and permissions complexity of gyroscope-driven navigation in v1. |
| **Panning model** | `PannerNode` with `panningModel: 'HRTF'` by default; fall back to `'equalpower'` when `navigator.hardwareConcurrency` is low or a startup latency probe exceeds budget | HRTF measurably outperforms equalpower for localization (IEEE 2025 WebXR study — back-positioned sources especially), but is the most CPU-intensive node in the Web Audio graph; mobile cold-start with HRTF adds real latency (~35ms vs ~12ms) on mid-range Android. This is a one-line `panningModel` toggle, so default high-quality and step down, not the reverse. |
| **Distance model** | `'inverse'`, with `refDistance`/`maxDistance` tuned per zone density, not global constants | Natural falloff for zones placed on a sphere; avoids the harsher cliff of `'linear'`. |
| **Composition sync** | Placements/clears/names are **committed events** (heavy, verifiable, replayable) through the existing `commit → gate → D1 → SSE` path. Live triggers (touching a zone to hear it) are **ephemeral** — broadcast, never persisted, never gated | This is the log/awareness split the research surfaces repeatedly (Yjs Awareness vs. `Y.Doc`; MusicColab/VHV's kern-document-vs-activity-awareness split) — but you get it by *reusing the log's existing commit boundary*, not by adding Yjs. The log is already append-only and single-writer-per-event, so it doesn't have the concurrent-field-edit problem CRDTs solve; you don't need Yjs unless two people can simultaneously drag the *same* zone (not in v1 scope — flag if that changes). |
| **Presence/live-trigger transport** | New, small, explicitly separate from the log: extend the SSE worker with an ungated broadcast channel, OR stand up a dedicated Cloudflare Durable Object per music room | Real new infrastructure (confirmed absent in §1). Durable Objects are Cloudflare's own recommended pattern for this exact shape of problem (WebSocket Hibernation, strong consistency, no need to keep the DO warm) and there's a maintained CF+Yjs adapter precedent (`@yjsync/cloudflare`) if the project ever needs full CRDT semantics later. Recommendation: start with the DO approach as its own small service (`workers/music-presence`), not bolted onto the existing Loom SSE worker — keeps blast radius small. See §6 for the contract. |
| **MIDI** | Optional enhancement only, feature-detected, never a dependency of the core loop | Safari (desktop and iOS) does not support Web MIDI at all. A family product cannot make the core interaction MIDI-gated. Touch/pointer is primary; MIDI input augments it when `navigator.requestMIDIAccess` exists. |
| **Vertical spatial encoding** | Height → pitch or timbre brightness (not yet decided which — prototype both, see §9), stereo pan + distance-gain as the accessible baseline | Research on non-visual spatial encoding (NIME 2026 vibrotactile paper; multimodal 3D data-viz research) converges on stereo pan + distance-loudness as the primary channel, with a secondary non-positional channel (pitch or timbre) for the axis panning can't carry alone. |

---

## 3. Hard constraints (inherited + new)

The Loom's family constraints apply unchanged to this build. They are
enforced by `apps/loom/docs/STANDARDS.md` and `apps/loom/docs/DECISIONS.md`
#003/#004; the summary is embedded here so you can build against it without
opening those files:

- **Token-only everything.** No hex, no rgb, no oklch literals in any
  production file. Every color, spacing, and motion value comes from a
  `--p31-*` token. In three.js, resolve tokens to shader uniforms via the
  same `resolveTokenRgb` pattern `apps/loom/src/components/JitterbugScene.tsx`
  uses.
- **Touch targets.** 48×48 minimum (`--p31-touch-min`); 56px for
  child/elder-primary controls (`--p31-touch-recommended`); 64px large
  (`--p31-touch-large`). Above WCAG AAA and Material 48dp. Do not correct
  these down.
- **Text.** 16px minimum on user-facing text; 7:1 contrast for body.
- **No timers / no auto-advance / no streaks.** Nothing moves without a tap.
- **Reduced motion.** `prefers-reduced-motion: reduce` collapses
  `--motion-scale` to 0.01 — it never sets `animation: none` (load-bearing:
  the phase machines depend on `animationend`). Honor
  `prefers-reduced-transparency` too.
- **No model names anywhere.** Role language, not model names.
- **AAF vocabulary.** Interactive and status elements carry
  `data-agent-kind` (`action|field|status`), `data-agent-action`,
  `data-agent-danger` (`none|low|high`), `data-agent-confirm`
  (`never|optional|review|required`).

**Audio-specific additions, non-negotiable:**

1. **No sound plays without an explicit prior tap on the sound toggle in
   this session.** Not "off by default with an easy way to turn on" —
   literally silent until opted in, every session, every device. A shared
   session where one family member enabled sound does not turn sound on for
   another family member's device.
2. **No sound object exceeds a hard gain ceiling** (suggest `0.6` linear on
   the master gain node) regardless of how many zones are triggered
   simultaneously — a child mashing six zones at once must not produce a
   volume spike. Use a limiter or a master-gain compressor, not per-zone
   discipline alone.
3. **Every triggered sound has a visual echo** — the zone brightens/pulses
   whether or not sound is on, exactly matching `useLoomSound`'s existing
   "every cue has a visual equivalent" rule, extended from discrete chapter
   chimes to a continuous instrument.
4. **`AudioContext` is created/resumed only on a user gesture** (the sound
   toggle tap, or the first zone touch if sound is already on from a
   previous toggle this session) — never on mount, never speculatively.
   Browsers block autoplay without this and it's also just good manners.
5. **HRTF fallback is automatic and silent** — the user never sees a
   "reduced audio quality" message; the fallback to `equalpower` (or, if
   needed, disabling spatialization entirely and using stereo pan + gain
   as a manual approximation) must be indistinguishable in *interaction*,
   only in fidelity.

---

## 4. Event vocabulary (new, additive to the existing 8 kinds)

Add to `packages/canon/src/loom/events.ts`'s `LoomEventKind` union. These are
**committed** — they go through gate/D1/SSE exactly like `focus` or
`approve` do today:

| Kind | Writer | When | Payload shape (beyond `target`) |
|---|---|---|---|
| `instrument.zone.place` | `human` | A zone is created at a spatial position with a chosen timbre | `{ position: [x,y,z], timbre: string, name?: string }` |
| `instrument.zone.clear` | `human` | A zone is removed | `{ }` (target carries the zone id) |
| `instrument.zone.name` | `human` | A zone is renamed | `{ name: string }` |

**Deliberately not a new event kind:** the live act of a zone sounding when
touched. That is ephemeral (§2, §6) — it never reaches `commit()`, never
gets a `seq`, never persists. If a later requirement needs an audit trail of
*who played what when* (not just *what the score looks like*), that's a
scope decision for a human, not something to add unilaterally — it changes
the privacy and storage shape of the whole feature.

Update `apps/loom/public/.well-known/agent-manifest.json` with the three new
`data-agent-action` values this implies (see §8 for the exact attributes).

---

## 5. Audio + spatial engine spec

### 5.1 `SpatialInstrumentEngine`

New file, `apps/music-maker/src/audio/SpatialInstrumentEngine.ts`. Not a
class-per-zone soup — one engine, N zones, each zone owning one
`PannerNode` + one `GainNode` + oscillator(s) sourced from a timbre profile.

```
AudioContext
 └─ masterGain (hard ceiling, §3.2)
     └─ compressor (DynamicsCompressorNode, gentle knee)
         └─ per-zone: PannerNode (HRTF|equalpower, inverse distance model)
             └─ per-zone: GainNode (envelope: attack/decay from timbre profile)
                 └─ oscillator(s) (reuse phos spoonProfile()-style shape, or
                    the quantum-composer osc→gain→filter chain for richer
                    zones)
```

- Reuse `spoonProfile()`'s attack/decay/volume/oscillator-type shape from
  `apps/phos/src/lib/sound.ts` as the base `TimbreProfile` type — don't
  invent a parallel shape.
- `AudioListener.setPosition()` / `setOrientation()` updates on every
  listener-move frame (touch-drag), throttled to animation-frame rate, not
  per-pointer-event rate.
- Distance model: `'inverse'`, `refDistance` and `maxDistance` computed from
  the sphere's radius so falloff feels proportionate regardless of how many
  zones are on it.
- Benchmark HRTF cold-start on your actual target devices before locking
  the equalpower fallback threshold — the ~35ms figure from research is a
  reference point, not a number to hardcode without verifying.

### 5.2 Node budget

Each zone costs one `PannerNode` (the most expensive node type in the
graph). Plan for 8–16 zones as the family-scale baseline; if a session wants
more, either pool/reuse `PannerNode`s for zones outside the listener's
audible range or gate zone count in the UI rather than letting the graph
grow unbounded.

### 5.3 `SpatialScene` (three.js)

New file, `apps/music-maker/src/scene/SpatialScene.tsx`, sibling to
`apps/loom/src/components/JitterbugScene.tsx` in spirit. Follow its
conventions exactly:

- **Color contract:** no hex/rgb/oklch literals in the file. Every color
  resolved from a `--p31-*` token via the same `resolveTokenRgb` pattern
  and passed to shaders/materials as uniforms.
- **Layout:** phyllotaxis-sphere placement for zones (reuse the algorithm,
  don't reinvent it) unless a zone has an explicit human-placed position
  (from `instrument.zone.place`), in which case the placed position wins
  and phyllotaxis only fills unplaced/default slots.
- **The listener** is a visible marker (not a bare camera) so a child can
  see "you are here" independent of the camera framing.

### 5.4 Reuse `@p31/field`'s decay/pressure math for the "played note glows" feedback

When a zone is triggered (locally or via a remote presence event), don't
hand-roll a fade — feed the trigger through the same `decay`/`pressure`
functions `packages/field/src/index.ts` already exports, the way
`JitterbugScene` does for focus traces. A struck zone brightens
(`pressure` rises) and cools on the same curve the rest of the system's
"reading is writing" visuals use. This is the single biggest piece of free
consistency available in this build — use it.

---

## 6. Collaboration: the log/presence split, concretely

**Composition (persisted, verifiable):** `instrument.zone.place/clear/name`
events flow through the existing, unmodified `commitThrough → gate → D1 →
SSE` path (`apps/loom/src/lib/useLoomState.ts` is your reference
implementation — extend its event-kind union, don't fork its transport).
Every device sees every placement, in order, with `Last-Event-ID` resume on
reconnect, exactly like today.

**Live presence (ephemeral, not persisted):** two viable shapes — pick one,
don't build both:

- **Option A — extend the SSE worker.** Add an ungated broadcast endpoint
  the client can POST ephemeral trigger/cursor events to, which the worker
  fans out over the *same* SSE connection with a distinguishing message
  type (`type: 'ephemeral'`), skipping D1 entirely. Smallest change, reuses
  the connection the client already holds.
- **Option B — a dedicated Durable Object** (`workers/music-presence`),
  one instance per music room, holding live WebSocket connections with
  Hibernation enabled. Broadcasts trigger/cursor events to all connected
  clients; holds nothing durably. More infrastructure, but cleanly
  separates "the score" (D1/gate/log) from "the performance" (this DO),
  and gives you a natural home for a future upgrade to full Yjs Awareness
  if concurrent same-zone editing ever becomes required.

**Recommendation: start with Option A.** It's less new infrastructure,
reuses a connection and reconnection strategy that's already
production-hardened in this stack, and the ephemeral-message-type approach
is exactly what SSE's typed-event mechanism is for. Move to Option B only
if load testing shows the shared SSE worker can't take the trigger-event
volume, or if a future requirement needs true multi-writer conflict
resolution.

Whichever option: **an ephemeral trigger message is never mistakable for a
committed event.** Different shape, different code path, no `seq`, no
`ts` in the log's sense, no gate involvement. A client that logs both to
the console for debugging should visibly tag which is which.

---

## 7. Extending `useLoomSound` — don't fork it

`apps/loom/src/lib/useLoomSound.ts` was designed for short, discrete chapter
chimes: opt-in, muted by default, visual-equivalent-always. A live instrument
needs the same three rules but a different playback shape (continuous
engagement, not one-shot cues, potentially many overlapping triggers). Extend
the hook (or extract its opt-in/mute-state logic into a shared primitive both
`apps/loom/src/lib/useLoomSound` and a new `useInstrumentSound` consume)
rather than duplicating the mute-state/localStorage logic. The
`apps/loom/src/components/SoundToggle.tsx` component should be reusable as-is —
same 48px AAF surface, same `chapter.sound.toggle` action name if this mounts
inside a chapter context, or a new `instrument.sound.toggle` action if
`apps/music-maker` is fully standalone (pick based on §2's surface decision;
standalone → new action name, and add it to the manifest).

---

## 8. AAF / porting-contract additions

Follow the existing manifest's format (`apps/loom/public/.well-known/
agent-manifest.json`). New rows for this feature:

| Element | Component | `data-agent-action` |
|---|---|---|
| A zone in 3D space | `apps/music-maker/src/scene/MusicZone.tsx` | `instrument.zone.trigger` (ephemeral, §6) |
| Placing a new zone | (gesture, not a button — see UX note below) | `instrument.zone.place` |
| Clearing a zone | context control on a selected zone | `instrument.zone.clear` |
| Naming a zone | inline label editor | `instrument.zone.name` |
| The sound toggle | reused/extended `apps/loom/src/components/SoundToggle.tsx` | `instrument.sound.toggle` (if standalone) |
| The listener-position control | drag surface on the scene | `instrument.listener.move` (ephemeral, not committed) |

Note the UX implication buried in that table: **placing a zone is a
gesture-driven action** (drag-and-drop or long-press-and-release in 3D
space), not a form submission — but it still needs a `data-agent-action`
so an agent (or a test) can trigger it non-visually. Give the gesture
handler's completion callback the same `data-agent-action="instrument.zone.place"`
semantics a button would carry, documented in a comment at the call site
since there's no single DOM element to hang the attribute on.

---

## 9. What to prototype first

Before writing anything under `apps/music-maker/src`, build **one or two
single-file HTML prototypes** to de-risk the parts research couldn't settle
for you. The prototype discipline is a house pattern: single-file HTML, canon
tokens, no build step, iterated in a browser tab, ported into production only
after empirical validation. (The Loom's evidence-before-production discipline
is documented in `apps/loom/docs/HUMAN_TEST_PLAN.md`; the prototypes here
apply it to interaction feel rather than to a full chapter walkthrough.)

1. **`prototype-spatial-touch.html`** — a handful of zones on a sphere,
   `PannerNode` + `AudioListener`, touch-drag to move the listener. Proves
   the core loop feels good before any collaboration or log plumbing exists.
   Test both height→pitch and height→timbre-brightness mappings here (§2)
   and pick one empirically, with a family member if possible — not just
   by reasoning about it.
2. **`prototype-presence-echo.html`** — two browser tabs, the ephemeral
   channel from §6 (Option A first), one tab's zone-touch visibly and
   audibly echoing in the other within your latency budget. Proves the
   collaboration path before it's wired into the real log.

Only after both feel right does `apps/music-maker` become a porting
exercise — mechanical, because the hard design questions were already
answered in a file you could iterate on in a browser tab.

---

## 10. Verification checklist

In addition to the Loom's existing gates (`apps/loom/docs/STANDARDS.md`
conformance, the replay-determinism check the canon's `test:loom` suite
already runs, and the port-audit):

- [ ] No sound plays before the sound toggle is tapped, every session, every device — verify with a hard page reload, not just a soft state reset.
- [ ] Triggering every zone simultaneously does not exceed the master gain ceiling (measure, don't eyeball).
- [ ] HRTF → equalpower fallback is automatic and produces no visible/audible "degraded mode" messaging.
- [ ] `AudioContext` is created/resumed only inside a user-gesture handler — check DevTools' autoplay-policy warnings are silent.
- [ ] Every triggered zone has a visible echo with sound off.
- [ ] `instrument.zone.place/clear/name` events replay deterministically (reload with the same committed log reproduces the same zone layout — the canon's replay-determinism check, applied here).
- [ ] Ephemeral trigger/presence messages never appear in the committed log, and are visibly distinguishable from committed events in any debug/instrument view.
- [ ] Reduced-motion and reduced-transparency both visibly collapse the scene's animation, same as the Loom's existing chapters.
- [ ] Web MIDI is fully absent (no `navigator.requestMIDIAccess` calls, no missing-feature errors) on Safari/iOS, and the core loop works identically without it.
- [ ] No model names anywhere (same grep as the canon's `verify:agent-names` gate).
- [ ] `port-audit` reports 0 used-but-unmanifested actions once §8's additions land in the manifest.

---

## 11. Output format

Respond with:

1. The prototype(s) from §9 first, each as a complete single-file `.html`
   per the prototype discipline — do not skip to production code.
2. Once prototypes are approved, the `apps/music-maker` production files,
   organized per the directory implied by §5–§8 (`src/audio/`, `src/scene/`,
   `src/hooks/`, `src/components/`), with the same review-note discipline
   used elsewhere in the Loom: call out anywhere a literal port of prototype
   code was restructured for production, and why.
3. A `<!-- MANIFEST ADDITIONS -->` block listing every new
   `data-agent-action` from §8 not yet in `apps/loom/public/.well-known/
   agent-manifest.json`.
4. A `<!-- TOKEN GAPS -->` block for any color/spacing/motion value this
   feature needs that isn't already in `packages/canon/dist/tokens.css`.
5. A short note flagging any place where §2's resolved decisions turned out
   to be wrong once real device/latency numbers came in — these are
   provisional defaults informed by research and an infrastructure audit,
   not commitments that override what you actually measure.

## Related Documents

- `../README.md` — what the Loom is; the app this build inherits its log from
- `./STANDARDS.md` — the family constraints §3 embeds (the authority)
- `./DECISIONS.md` — #003 (sound opt-in), #004 (reduced motion), #012 (scope)
- `./PORTING_AGENT_BRIEF.md` — the method for a new app consuming `@p31/canon`
- `./HUMAN_TEST_PLAN.md` — the evidence-before-production discipline §9 cites
- `./MAP.md` — the doc index; where this page sits