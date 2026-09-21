# ADR-004-the-companion-view-has-no-chip

## Status

**Status**: Accepted

## Context

The companion view is the 70-year-old's window into the log — one sentence and
a gentle "Show me," built for someone who should never feel they are reading a
dashboard. The chapter surfaces show a `.shared-chip` ("You've done N things
with Lumi"), a count that motivates a child. The temptation was to give the
companion the same chip, so the elder sees numbers too.

## Decision

The companion view has **no chip**. No counts, no numbers, no badges. The
elder sees the artifact ("Look what we made") and a single calm sentence
about what it is. The count stays in the instrument, where the child's
progress belongs.

## Consequences

- The elder's surface is quiet by construction: no "you have N unread
  memories," no score, nothing to optimize. It reads as a window, not a
  dashboard.
- A chip would have been a *type* error: it converts a person into a number.
  The companion is the antidote to that.
- The count is still reachable — it lives in the instrument chrome — so
  removing it from the companion costs the family nothing.

## Considered alternatives

- **Show the chip, smaller** — rejected. The size was never the problem; the
  presence of a number was. A smaller score still reads as a score.
- **Show the artifact count as text ("you and Lumi made three things")** —
  considered. Softer than a chip, but still a metric. The companion's job is
  to show the thing, not to quantify the making. Rejected to keep the window
  a window.
- **Show nothing but the sentence** — accepted. The artifact IS the content;
  the sentence is its caption.