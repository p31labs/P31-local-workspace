/**
 * K₄ “tetra seal” — original ritual: four vertices, six edge readings.
 * Not a trivia deck; outputs depend on *your* words + deterministic edge picks.
 */

export const VERTEX_LABELS = ["hinge", "span", "vault", "floor"] as const;

/** Short sparks if someone runs `tetra roll`. */
export const TETRA_SPARKS: string[] = [
  "spoon",
  "verify",
  "latency",
  "boundary",
  "log",
  "kindness",
  "retry",
  "trimtab",
  "graph",
  "quiet",
  "scope",
  "proof",
  "merge",
  "cache",
  "trust",
  "rest",
  "draft",
  "signal",
  "noise",
  "care",
  "idempotency",
  "hydration",
  "arc",
  "receipt",
];

/** Edge “readings” — work between any pair of user words. */
export const EDGE_VOICES: string[] = [
  "This edge asks for a smaller experiment before a bigger claim.",
  "Tension here usually means two timelines — pick one to name out loud.",
  "If both vertices are true, the work is integration, not picking a winner.",
  "This pair wants documentation more than debate.",
  "Someone needs to write the one-sentence TL;DR for Future You.",
  "The mesh says: synchronize constants before synchronizing feelings.",
  "A trim-tab move might be a single boundary, not a redesign.",
  "This edge is load-bearing — don’t wallpaper it with vibes.",
  "If it rattles you, classify the ping before you answer the ping.",
  "Two good ideas can still be incompatible on the same Tuesday.",
  "Try deleting an adjective; sometimes the edge sharpens.",
  "This connection likes idempotency: same care on replay, no double harm.",
  "Measure lag, not drama — then decide if it’s worth the spoons.",
  "The honest move is often the boring move, early.",
  "If both sides are scared, start with sleep and water, then words.",
  "This edge rewards a checklist over a speech.",
  "You don’t need consensus to need clarity.",
  "Let the graph be messy; tighten one edge at a time.",
  "A rate limit on urgency is still kindness.",
  "Cite what you know; label what you don’t — even privately.",
  "Wonder is allowed here; so is a hard stop.",
  "If the words fight, translate them into constraints.",
  "This pair is a bridge — walk it with receipts.",
  "Silence isn’t always agreement; sometimes it’s bandwidth.",
  "Green verify doesn’t erase unknowns — it shrinks the blast radius.",
];

/** Closing lines once all four vertices are set (then seal / auto). */
export const SEAL_CLOSURES: string[] = [
  "Seal noted: four anchors, six tensions, one calmer week.",
  "The tetra stands — complete graphs don’t need a boss vertex.",
  "You named the cage; now route care through the edges you trust.",
  "K₄ remembers: stability is often distributed, not centralized.",
  "Seal closed — log the takeaway in one line if you can.",
  "That’s a full mesh simplex of intent. Ship the smallest next step.",
  "The oracle clause: small force, right place, early.",
  "No submarine metaphors were harmed in this seal.",
  "Four words, six relationships — that’s enough topology for today.",
  "If this felt silly and still helped, it did its job.",
];
