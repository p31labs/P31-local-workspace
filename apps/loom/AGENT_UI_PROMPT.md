# Agent UI Prompt — copy-paste preamble

Paste this before any UI request. It points the coding agent at the context
doc and the brief template, so output obey the tokens, the write constraint,
the taxonomy, and the responsive rules instead of generating isolated UI.

---

You are writing a React component for the P31 Loom canvas.

First read and absorb:
- `apps/loom/UI_CONTEXT.md` — the design tokens (use `var(--p31-*)` only, never
  bare hex/rgb), the two write channels (warp `postEvent` / weft `view.read`;
  components NEVER write), the component taxonomy with real prop signatures,
  the `bar | canvas | panel | scrub` grid, responsive rules, and the quality
  gate.
- `apps/loom/BRIEF-ProposalReviewPanel.md` — a worked example of the brief
  format and what "integrated" looks like (existing classes in `index.css`,
  callbacks dispatched to App, tier labels from `lib/surface.ts`).

Then produce `<Component>` following this outline:

# UI Brief: <Component>
## What — one-sentence purpose.
## Where — grid area (canvas node / panel / overlay); lazy-loaded? justify.
## State — exact LoomState reads; types from @p31/canon/loom/events.
## Writes — human gate kinds dispatched (focus/revise/approve/reject/view.save)
## Existing Similar — one component in the taxonomy to mirror.
## Design Tokens — 2-3 `--p31-*` tokens this surface needs.
## Constraints — tokens only; no fetch/localStorage; no new callbacks; 820px.
## Acceptance — checklist.

Rules that are NOT negotiable:
1. Colors: `var(--p31-*, literal-fallback)` only. No bare `rgb(`/`#hex` in the
   component.
2. Writes: only callbacks. The component never calls `fetch`, touches
   `localStorage`, or writes files. The write layer lives in App.
3. Callbacks: only taxonomy names (onSelect/onFocus/onFollow/onSeqChange/
   onApprove/onReject) unless the brief defines new ones.
4. Types: `LoomState`/`LoomEvent`/`Proposal` from `@p31/canon/loom/events`;
   `LoomEventInput` from `@p31/canon/loom/gate`.
5. Responsive: layout must survive 820px; content scrolls inside its container.
6. No model names, no new libraries.

Before shipping, run the five checks from `UI_CONTEXT.md` (grep token/hex,
grep write bypass, `pnpm --filter @p31/loom typecheck` + `test`) and confirm
each item in the Acceptance checklist, or say explicitly which you could not
verify.

---

Usage:
1. Copy the preamble into your coding agent, then paste your filled-out Brief
   (or ask it to draft one).
2. Review the diff against `UI_CONTEXT.md` rows before landing.
3. Run the five checks. Fix forward, do not pile fixes into the component.
