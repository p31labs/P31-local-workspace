# UI Brief: ProposalReviewPanel

**Status:** proposed — first field test of the UI Brief pattern in `UI_CONTEXT.md`.

## What

Presentational panel rendering a selected proposal with its review history and
the human decision controls (approve / reject with reason). Today this markup
is inline in `App.tsx:196-252`; extract it without changing behavior.

## Where

`grid-area: panel` (the `<aside class="loom-panel">`). Not lazy-loaded —
it is small and renders only while a proposal is selected. It is the panel
surface, sibling to `EventOverlay` and `ProposalDigest`.

## State

Pure props — no hook, no log access. All reads are derived in `App` and passed
down:

```ts
import type { Proposal } from '@p31/canon/loom/events'
import type { Tier } from '../lib/profile'

interface ProposalReviewPanelProps {
  proposal: Proposal                       // state.proposals.get(selectedProposal)
  tier: Tier                               // effective tier (App passes effTier)
  reason: string                           // controlled reject-reason input
  notYet: boolean                          // beginner "Not yet" gate
  onApprove: () => void
  onReject: (reason: string) => void
  onReasonChange: (reason: string) => void
  onToggleNotYet: () => void
}
```

Selection, `rejectReason`, and `notYet` stay owned by `App` (as today).

## Writes

Component dispatches callbacks only; App wires them to the warp:

- onApprove → `postEvent({ writer: 'human', kind: 'approve', proposal })`
- onReject → `postEvent({ writer: 'human', kind: 'reject', proposal, reason })`,
  where `reason = rejectReasonFor(tier, rawReason)` (App already computes this
  via `rejectReasonFor` from `lib/surface`). After either decision App clears
  `reason`/`notYet`, exactly as the inline code does today.

No component-level fetch. Human kinds only (`approve`/`reject`), per the gate.

## Existing Similar

`EventOverlay` — read-only sidebar panel in the same `<aside>` slot, same
`--p31-glass-border` / `--p31-surface` / typographic rhythm. Mirror its
uncontrolled-free, callback-only structure.

## Design Tokens Used

- `--p31-text` — labels, `--p31-text-tertiary` — hint/`code` metadata
- `--p31-accent-green` — `.loom-btn--ok` border (approve)
- `--p31-accent-red` — `.loom-btn--no` border + reason input (reject)
- `--p31-surface`, `--p31-glass-border` — controls
- Gold accent for the `proposal` kind badge (`.loom-kind--component`)

All classes already exist in `src/index.css` (`.loom-kind`, `.loom-summary`,
`.loom-hint`, `.loom-actions`, `.loom-btn--ok/--no`, `.loom-reject`,
`.loom-reason`, `.loom-json`). **Do not add new CSS.**

## Constraints

- No new colors, no `rgb(`/hex literals.
- No `fetch`, `localStorage`, or file writes anywhere in the component.
- Tier behavior preserved verbatim:
  - beginner + !notYet → "Not yet" button; else reason input + Reject.
  - `approveLabel(tier)` on the approve button (import from `../lib/surface`).
  - advanced only → `loom-json` `<pre>` of `JSON.stringify(proposal.body, null, 2)`.
- Responsive: wrap the `.loom-actions` row (not fixed width) so controls stack
  under 820px; the panel itself scrolls internally.
- TypeScript strict; single quotes, no semicolons (repo style).

## Acceptance

- [ ] `App.tsx` `<aside>` renders `<ProposalReviewPanel …/>` with identical DOM
      (classnames, labels, ordering) to today's inline block.
- [ ] Unit test `src/components/ProposalReviewPanel.test.tsx`
      (jsdom + @testing-library/react) covering: approve dispatch,
      reject-with-reason dispatch, beginner Not-yet flow, advanced JSON block,
      empty reason defaults via `rejectReasonFor`.
- [ ] Approve/reject landing in the log verified by e2e or manual
      `POST /api/loom/event` round-trip.
- [ ] Five checks green: no bare hex, no fetch/localStorage, `pnpm --filter @p31/loom typecheck`, `pnpm --filter @p31/loom test`, visual pass at 820px.