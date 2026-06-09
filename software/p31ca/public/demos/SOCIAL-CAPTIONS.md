# P31 visual demos — social caption pack

Pre-written caption blocks for the four shareable visualizations in `demos/`. Use `demos/index.html` for interactive copy buttons; this file is the markdown mirror so the operator can grab a block from any text editor.

**Voice rules** (from `docs/PUBLIC-VOICE.md` + `docs/ETHICAL-STYLE-MAP.md`):

- Direct. Action over explanation.
- No streak / leaderboard / hustle language.
- No manufactured urgency. No "you'll regret missing this."
- Identity-first ("a family", not "users"). Tier B/C guardrails: no medical or legal advice in social copy.

**Hashtag suggestion** (use sparingly): `#openmesh` `#ephemeralization` `#glassbox` `#audhd-ops` `#topology` `#openscience`.

---

## Demo 1 — K₄ family mesh (`/demos/k4-mesh.html`)

**Anchor idea:** topology matters. A family is K₄ (the complete graph on four vertices), not a tree, not a star.

### Bluesky / X (≤300 chars)

```
the shape of a family is not a tree.
it's K₄ — 4 vertices, 6 edges, no central hub.
putting your family on a centralized social platform forces a star with the platform at the center.
different graph. different power.
we picked K₄ on purpose.
→ p31ca.org/visuals
```

### LinkedIn (long-form)

```
Topology matters more than people think.

The shape of a family is not a tree — it's K₄, the complete graph on four nodes (4 vertices, 6 edges, no central hub). Every member touches every other directly.

When you put a family on a centralized platform, the topology becomes a star: every relationship now passes through the platform. That's a different graph and a different power structure.

The P31 mesh chose K₄ on purpose.

Live demo: https://p31ca.org/visuals
Source: https://github.com/p31labs/bonding-soup
```

### Mastodon (~500 chars)

```
the shape of a family is not a tree.

it's K₄ — 4 vertices, 6 edges, no central hub.

putting a family on a centralized platform makes it a star with the platform at the center. different graph, different power.

p31 picked K₄ on purpose.

p31ca.org/visuals

#openmesh #ephemeralization
```

---

## Demo 2 — Alignment graph (`/demos/alignment-graph.html`)

**Anchor idea:** "single source of truth" is normally invisible. We rendered it.

### Bluesky / X (≤300 chars)

```
111 sources × 53 derivations, in one JSON file.
edit a node, the rest update themselves. drift is detectable. lies are expensive.
fuller called this "ephemeralization." we just made it visible.
→ p31ca.org/visuals
```

### LinkedIn (long-form)

```
What if "single source of truth" was a graph you could see?

Every concept in the P31 codebase has exactly one canonical source. The relationships are encoded in a single JSON file: 111 sources, 53 one-way derivations.

Edit one node — the registry tells you which downstream artefacts to regenerate. Drift becomes detectable. Lies become expensive.

Buckminster Fuller called this "ephemeralization" — doing more with less. Live demo renders the graph in real time:

https://p31ca.org/visuals/alignment-graph.html
Source: https://github.com/p31labs/bonding-soup
```

### Mastodon

```
single source of truth, but legible:

• 111 canonical sources
• 53 one-way derivations
• 1 JSON file (p31-alignment.json)

edit one node → the rest update themselves. drift is detectable.

fuller called this ephemeralization. we just rendered it.

p31ca.org/visuals

#ephemeralization
```

---

## Demo 3 — Larmor pulse (`/demos/larmor-pulse.html`)

**Anchor idea:** one number, many surfaces. Edit-once propagation, made visible.

### Bluesky / X (≤300 chars)

```
one number, 863 Hz, in 40+ files.
larmor freq of ³¹P in earth's field — also the canonical heartbeat of P31.
one place to edit. many places it shows up.
the demo pulses at the constant itself (downsampled 100×).
→ p31ca.org/visuals
```

### LinkedIn (long-form)

```
One number. Forty surfaces.

863 Hz is the Larmor frequency of phosphorus-31 in Earth's magnetic field. It's also the canonical heartbeat of the P31 project — appearing in 40+ files across UI, science exhibits, tests, CI gates.

It is editable in exactly one place: p31-constants.json. One npm script propagates and proves it across the codebase.

The live demo pulses at the constant itself (downsampled 100× so a human eye can see it beat):

https://p31ca.org/visuals/larmor-pulse.html
```

### Mastodon

```
one number — 863 Hz — flowing into 40+ files.

larmor frequency of ³¹P in earth's field. also the canonical heartbeat of P31.

one place to edit, many places it shows up. propagation is provable.

the demo pulses at the constant itself (slowed 100× for human eyes).

p31ca.org/visuals

#openscience
```

---

## Demo 4 — Glass box terminal (`/glass-box`)

**Anchor idea:** put a window in the wall. Take fear out of AI ops by showing the work.

### Bluesky / X (≤300 chars)

```
public terminal that streams our tests + simulations + reports as they happen.
no login, no analytics, no secrets — only what we'd publish anyway. real heartbeat + faithful synthetic playback of the real CLI tools.
takes the scary out of "AI ops".
→ p31ca.org/glass-box
```

### LinkedIn (long-form)

```
What if the way to take fear out of AI ops was to put a window in the wall?

We just shipped a public, read-only terminal — the "Glass Box" — that streams our tests, simulations, and reports as they happen. Visitors can watch the verify pipeline run, file simulated incident-day reports, and check the real verify-pulse heartbeat.

Three honest signals on every screen:

• LIVE: reports feed (real, committed, public)
• PULSE: <time-ago> · <git head> (real, recorded after each green verify)
• SYNTHETIC: faithful CLI playback (clearly tagged [SYN])

No login. No analytics. No secrets — only what we'd publish anyway.

https://p31ca.org/glass-box
Source: https://github.com/p31labs/bonding-soup/blob/main/glass-box.html
```

### Mastodon

```
public terminal that streams our tests + simulations + reports as they happen.

no login, no analytics, no secrets. faithful synthetic playback + real heartbeat from the verify pipeline.

takes the scary out of AI ops by putting a window in the wall.

p31ca.org/glass-box

#glassbox #transparency
```

---

## Recording loops (15-sec social videos)

For each demo, the simplest content loop:

1. **K₄ mesh** — load `/demos/k4-mesh.html`, leave auto-rotate on, screen-record for 12 seconds. Caption with the Bluesky text.
2. **Alignment graph** — load `/demos/alignment-graph.html`, let layout settle 3 seconds, click two distant nodes (lineage highlights), screen-record.
3. **Larmor pulse** — load `/demos/larmor-pulse.html`, hit speed slider to 0.6× → 1× → 2× over 12 seconds (shows that pulse rate IS the constant).
4. **Glass box** — load `/glass-box.html`, click "auto-pilot", record one full cycle of `launch:audit` (≈30 seconds; cut to 15).

Recommended capture sizes:

- **Square (IG, X):** 1080×1080. Open browser at 1080×1080, hide chrome with F11.
- **Vertical (Reels, TikTok, Shorts):** 1080×1920. The demos are responsive and fill.
- **Landscape (LinkedIn, Mastodon):** 1920×1080.

Each demo also has a **snapshot** button that exports a still PNG.

---

## License

All four visualizations are **CC-BY 4.0** by P31 Labs, Inc. — share, remix, embed, archive freely; please credit `p31ca.org`. Source files under `demos/` and `glass-box.html` in the bonding-soup repo.

*Updated 2026-04-30. Edit this file when adding new demos; the hub mirror at `p31ca/public/demos/` is regenerated by `npm run build:demos`.*
