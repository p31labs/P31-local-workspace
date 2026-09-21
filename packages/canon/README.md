# @p31/canon

The P31 design canon — a **family-first, agent-native design system**.
Apache-2.0. Built by [P31 Labs](https://p31ca.org) for neurodivergent
families; consumed by agents as easily as humans.

One source of truth: `packages/canon/src/theming/theme-store.ts`. Everything —
the W3C DTCG export, the typed `P31TokenName` contract, the CSS, this
`DESIGN.md` — is generated from it. There is no second definition.

## What you get

- **Typed tokens** — `P31TokenName`, a compile-time contract for every token.
- **W3C DTCG export** — `tokens/tokens.dtc.json` (Design Tokens Format Module
  2025.10).
- **`DESIGN.md`** — Google's open format for coding agents: YAML token
  front-matter + rationale. Read it, and an agent knows the design system.
- **The Loom log** — the tamper-evident, append-only event log that the design
  system's state folds over (`loom/hash-chain`, `loom/gate`). The log is the
  runtime, not a layer bolted on.
- **Privacy by construction** — the log is an artifact record, never a person
  record; care proofs (`loom/love`) return verdicts, never events.

## Quick start

```bash
pnpm install
pnpm build          # regenerates DTCG, CSS, contracts, exports, DESIGN.md
```

Drop `DESIGN.md` in your project root and any AI coding agent (your CLI of
choice, the P31 MCP surface) instantly understands how P31 UI should look.

## Design principles

1. **Family-first** — 48px touch floor (56/64 recommended/large), above WCAG AAA.
2. **Accessible by default** — WCAG 2.2 AA minimum; OKLCH perceptual math.
3. **Sensory-aware** — `muted` and `warmLight` modes; `prefers-reduced-motion`
   collapses duration, never disables animation.
4. **Agent-native** — typed tokens, AAF manifest, DESIGN.md, tamper-evident log.

## License

Apache-2.0 — see `LICENSE`. The express patent grant is the point: you can
build on this without legal review.