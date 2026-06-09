# P31 universal design canon

**Source of truth:** [`p31-universal-canon.json`](./p31-universal-canon.json) (`p31.universalCanon/1.0.0`)

It defines:

- **palette** — brand hues shared across rings (hub + phosphorus31.org); `appearances.*.colors` must match these for every palette key.
- **appearances.hub** — dark UI (default on p31ca).
- **appearances.org** — light / paper field, ink text; same brand accents, inverted neutrals so the org site feels related but not identical to the hub.
- **typography, space, radius, shadow, motion, zIndex, focus** — shared scales as CSS variables (`--p31-space-*`, `--p31-radius-*`, …) emitted into `p31ca/public/p31-style.css`.

**Regenerate CSS + Tailwind CDN bridge:** from repo root, `npm run apply:p31-style`.

**Machine-readable table (generated):** [DESIGN-TOKENS-REFERENCE.md](./DESIGN-TOKENS-REFERENCE.md) — full palette, scales, `--p31-*` names, and hub vs org. Regenerate: `npm run apply:p31-style` from the P31 home root (or `npm run generate:design-token-docs` to refresh the Markdown only).

**Component patterns (layouts, Gray Rock, semantic classes):** [`docs/P31-DESIGN-DOCTRINE.md`](../../../docs/P31-DESIGN-DOCTRINE.md) — how tokens become surfaces; generated helpers live in `p31-style.css` via `emitDesignDoctrineBlock` in p31ca.

**phosphorus31.org:** see [PHOSPHORUS31-RING.md](./PHOSPHORUS31-RING.md). BONDING stays outside this canon by policy.
